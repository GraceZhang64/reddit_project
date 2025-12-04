import { prisma } from '../lib/prisma';
import { getSupabaseClient } from '../config/supabase';

interface PaginationParams {
  page: number;
  limit: number;
}

interface CreatePostData {
  title: string;
  body: string | null;
  post_type?: string;
  link_url?: string | null;
  community_id: number;
  author_id: string;
  poll_options?: string[] | null;
  poll_expires_hours?: number | null;
}

interface UpdatePostData {
  title?: string;
  body?: string | null;
  image_url?: string | null;
}

// Calculate vote count for a post or comment
async function getVoteCount(targetType: 'post' | 'comment', targetId: number): Promise<number> {
  const result = await prisma.vote.aggregate({
    where: {
      target_type: targetType,
      target_id: targetId,
    },
    _sum: {
      value: true,
    },
  });
  return result._sum.value || 0;
}

// Get user's vote for a post/comment
async function getUserVote(userId: string | undefined, targetType: 'post' | 'comment', targetId: number): Promise<number | null> {
  if (!userId) return null;
  
  const vote = await prisma.vote.findUnique({
    where: {
      userId_target_type_target_id: {
        userId: userId,
        target_type: targetType,
        target_id: targetId,
      },
    },
  });
  return vote ? vote.value : null;
}

export const postService = {
  async getPosts(params: PaginationParams, userId?: string) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.post.count(),
    ]);

    // Batch fetch vote counts, user votes, and comment counts for all posts
    const postIds = posts.map(p => p.id);
    
    const [voteCounts, userVotes, commentCounts] = await Promise.all([
      // Batch vote counts
      postIds.length > 0 ? prisma.vote.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'post',
          target_id: { in: postIds }
        },
        _sum: {
          value: true
        }
      }) : Promise.resolve([]),
      // Batch user votes
      userId && postIds.length > 0 ? prisma.vote.findMany({
        where: {
          userId,
          target_type: 'post',
          target_id: { in: postIds }
        },
        select: {
          target_id: true,
          value: true
        }
      }) : Promise.resolve([]),
      // Batch comment counts
      postIds.length > 0 ? prisma.comment.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds }
        },
        _count: {
          id: true
        }
      }) : Promise.resolve([])
    ]);

    // Create maps for quick lookup
    const voteCountMap = new Map(voteCounts.map(v => [v.target_id, v._sum.value || 0]));
    const userVoteMap = new Map(userVotes.map(v => [v.target_id, v.value]));
    const commentCountMap = new Map(commentCounts.map(c => [c.postId, c._count.id]));

    // Enrich posts with vote_count, user_vote, and comment_count
    const postsWithVotes = posts.map(post => ({
      ...post,
      vote_count: voteCountMap.get(post.id) || 0,
      user_vote: userVoteMap.get(post.id) ?? null,
      comment_count: commentCountMap.get(post.id) || 0,
    }));

    return {
      posts: postsWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getHotPosts(params: PaginationParams, userId?: string) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Get posts from last 7 days, ordered by vote count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Batch fetch vote counts, user votes, and comment counts for all posts
    const postIds = posts.map(p => p.id);
    
    const [voteCounts, userVotes, commentCounts] = await Promise.all([
      // Batch vote counts
      postIds.length > 0 ? prisma.vote.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'post',
          target_id: { in: postIds }
        },
        _sum: {
          value: true
        }
      }) : Promise.resolve([]),
      // Batch user votes
      userId && postIds.length > 0 ? prisma.vote.findMany({
        where: {
          userId,
          target_type: 'post',
          target_id: { in: postIds }
        },
        select: {
          target_id: true,
          value: true
        }
      }) : Promise.resolve([]),
      // Batch comment counts
      postIds.length > 0 ? prisma.comment.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds }
        },
        _count: {
          id: true
        }
      }) : Promise.resolve([])
    ]);

    // Create maps for quick lookup
    const voteCountMap = new Map(voteCounts.map(v => [v.target_id, v._sum.value || 0]));
    const userVoteMap = new Map(userVotes.map(v => [v.target_id, v.value]));
    const commentCountMap = new Map(commentCounts.map(c => [c.postId, c._count.id]));

    // Calculate hot score (votes + comments * 0.5) and sort
    const postsWithScores = posts.map(post => {
      const voteCount = voteCountMap.get(post.id) || 0;
      const commentCount = commentCountMap.get(post.id) || 0;
      const hotScore = voteCount + commentCount * 0.5;
      
      return {
        ...post,
        vote_count: voteCount,
        comment_count: commentCount,
        hot_score: hotScore,
        user_vote: userVoteMap.get(post.id) ?? null,
      };
    });

    postsWithScores.sort((a, b) => b.hot_score - a.hot_score);

    const total = await prisma.post.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      posts: postsWithScores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async searchPosts(query: string, params: PaginationParams, userId?: string) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    // Use Prisma case-insensitive search
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            body: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            community: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const postsWithVotes = await Promise.all(
      posts.map(async (post) => {
        const voteCount = await getVoteCount('post', post.id);
        const userVote = userId ? await getUserVote(userId, 'post', post.id) : null;
        
        return {
          ...post,
          vote_count: voteCount,
          user_vote: userVote,
          comment_count: await prisma.comment.count({ where: { postId: post.id } }),
        };
      })
    );

    // Get total count
    const total = await prisma.post.count({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            body: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            community: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          }
        ]
      }
    });

    return {
      posts: postsWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getPostBySlug(slug: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    const voteCount = await getVoteCount('post', post.id);
    const userVote = userId ? await getUserVote(userId, 'post', post.id) : null;

    // Build nested comment structure (same as comments endpoint)
    const commentsMap = new Map();
    const topLevelComments: any[] = [];

    // First pass: Get vote data for all comments
    for (const comment of (post.comments || [])) {
      const commentVoteCount = await getVoteCount('comment', comment.id);
      const commentUserVote = userId ? await getUserVote(userId, 'comment', comment.id) : null;
      
      commentsMap.set(comment.id, {
        ...comment,
        vote_count: commentVoteCount,
        user_vote: commentUserVote,
        replies: []
      });
    }

    // Second pass: Build the tree structure
    for (const comment of commentsMap.values()) {
      if (comment.parentCommentId === null) {
        topLevelComments.push(comment);
      } else {
        const parent = commentsMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    }

    // Sort top-level comments by vote count (highest first), then by creation date (newest first) as tiebreaker
    topLevelComments.sort((a, b) => {
      const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
      if (voteDiff !== 0) return voteDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Also sort replies by vote count
    const sortCommentsRecursive = (comments: any[]) => {
      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a: any, b: any) => {
            const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
            if (voteDiff !== 0) return voteDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          sortCommentsRecursive(comment.replies);
        }
      }
    };
    sortCommentsRecursive(topLevelComments);

    return {
      ...post,
      vote_count: voteCount,
      user_vote: userVote,
      comment_count: post.comments?.length || 0,
      comments: topLevelComments,
    };
  },

  async getPostById(postId: number, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // Get top-level comments first (limit to 10 for performance)
    const topLevelCommentsQuery = await prisma.comment.findMany({
      where: { 
        postId,
        parentCommentId: null
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });

    // Get all comment IDs (top-level + their replies)
    const topLevelCommentIds = topLevelCommentsQuery.map(c => c.id);
    
    // Get all replies for these top-level comments
    const replies = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: { in: topLevelCommentIds }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });

    const allComments = [...topLevelCommentsQuery, ...replies];
    const commentIds = allComments.map(c => c.id);

    // Parallelize: Fetch post vote data and comment vote data simultaneously
    const [postVoteData, commentVoteCounts, userVotes] = await Promise.all([
      // Post vote count and user vote
      Promise.all([
        getVoteCount('post', post.id),
        userId ? getUserVote(userId, 'post', post.id) : Promise.resolve(null)
      ]),
      // Comment vote counts (batch)
      commentIds.length > 0 ? prisma.vote.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'comment',
          target_id: { in: commentIds }
        },
        _sum: {
          value: true
        }
      }) : Promise.resolve([]),
      // User votes for comments (batch)
      userId && commentIds.length > 0 ? prisma.vote.findMany({
        where: {
          userId: userId,
          target_type: 'comment',
          target_id: { in: commentIds }
        },
        select: {
          target_id: true,
          value: true
        }
      }) : Promise.resolve([])
    ]);

    const [voteCount, userVote] = postVoteData;

    // Create a map of commentId -> voteCount
    const voteCountMap = new Map<number, number>();
    commentVoteCounts.forEach(vc => {
      voteCountMap.set(vc.target_id, vc._sum.value || 0);
    });

    // Create a map of commentId -> userVote
    const userVoteMap = new Map<number, number | null>();
    userVotes.forEach(vote => {
      userVoteMap.set(vote.target_id, vote.value);
    });

    // Build nested comment structure
    const commentsMap = new Map();
    const topLevelComments: any[] = [];

    // First pass: Create a map of all comments with their vote data
    for (const comment of allComments) {
      commentsMap.set(comment.id, {
        ...comment,
        vote_count: voteCountMap.get(comment.id) || 0,
        user_vote: userVoteMap.get(comment.id) || null,
        replies: []
      });
    }

    // Second pass: Build the tree structure
    for (const comment of commentsMap.values()) {
      if (comment.parentCommentId === null) {
        topLevelComments.push(comment);
      } else {
        const parent = commentsMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    }

    // Sort top-level comments by vote count (highest first), then by creation date (newest first) as tiebreaker
    topLevelComments.sort((a, b) => {
      const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
      if (voteDiff !== 0) return voteDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Also sort replies by vote count
    const sortCommentsRecursive = (comments: any[]) => {
      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a: any, b: any) => {
            const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
            if (voteDiff !== 0) return voteDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          sortCommentsRecursive(comment.replies);
        }
      }
    };
    sortCommentsRecursive(topLevelComments);

    // Get total comment count for the post
    const totalCommentCount = await prisma.comment.count({
      where: { postId }
    });

    return {
      ...post,
      vote_count: voteCount,
      user_vote: userVote,
      comment_count: totalCommentCount,
      comments: topLevelComments,
    };
  },

  async createPost(data: CreatePostData) {
    const { generateUniqueSlug } = await import('../utils/slugify');
    const slug = generateUniqueSlug(data.title);
    
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: slug,
        body: data.body,
        post_type: data.post_type as any || 'text',
        link_url: data.link_url || null,
        authorId: data.author_id,
        communityId: data.community_id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create poll if post_type is poll
    if (data.post_type === 'poll' && data.poll_options && data.poll_options.length >= 2) {
      const expiresAt = data.poll_expires_hours 
        ? new Date(Date.now() + data.poll_expires_hours * 60 * 60 * 1000)
        : null;

      await prisma.poll.create({
        data: {
          postId: post.id,
          expires_at: expiresAt,
          options: {
            create: data.poll_options.map((text, index) => ({
              text,
              position: index,
            })),
          },
        },
      });
    }

    // Update community member count if this is user's first interaction
    // Exclude the current post from the check since it was just created
    const { updateCommunityMemberCount } = await import('../utils/communityMemberCount');
    await updateCommunityMemberCount(data.community_id, data.author_id, post.id);

    // Create mention notifications for post body
    if (data.body) {
      const { createMentionNotifications } = await import('../utils/mentions');
      await createMentionNotifications(data.body, data.author_id, post.id);
    }

    return {
      ...post,
      vote_count: 0,
      comment_count: 0,
    };
  },

  async updatePost(postId: number, data: UpdatePostData) {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.image_url !== undefined && { image_url: data.image_url }),
        updated_at: new Date(), // Note: schema uses updated_at (snake_case)
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const voteCount = await getVoteCount('post', post.id);
        const commentCount = await prisma.comment.count({ where: { postId: post.id } });

    return {
      ...post,
      vote_count: voteCount,
      comment_count: commentCount,
    };
  },


  async deletePost(postId: number) {
    await prisma.post.delete({
      where: { id: postId },
    });
  },

  /**
   * Upvote, downvote, or remove vote for a post
   * @param { postId, userId, value } value: 1 (upvote), -1 (downvote), 0 (remove)
   */
  async voteOnPost({ postId, userId, value }: { postId: number, userId: string, value: 1 | -1 | 0 }) {
    // Check post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    // Remove vote if value is 0
    if (value === 0) {
      await prisma.vote.deleteMany({
        where: {
          userId,
          target_type: 'post',
          target_id: postId,
        },
      });
    } else {
      // Upsert vote
      await prisma.vote.upsert({
        where: {
          userId_target_type_target_id: {
            userId,
            target_type: 'post',
            target_id: postId,
          },
        },
        update: { value },
        create: {
          userId,
          target_type: 'post',
          target_id: postId,
          value,
        },
      });
    }

    // Return updated vote count and user's vote
    const vote_count = await getVoteCount('post', postId);
    const user_vote = await getUserVote(userId, 'post', postId);
    return { postId, vote_count, user_vote };
  },
};

