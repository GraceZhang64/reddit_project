import { PrismaClient } from '@prisma/client';
import { getSupabaseClient } from '../config/supabase';

const prisma = new PrismaClient();

interface PaginationParams {
  page: number;
  limit: number;
}

interface CreatePostData {
  title: string;
  body: string | null;
  post_type?: string;
  link_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  media_urls?: string[];
  crosspost_id?: number | null;
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

    // Get vote counts and user votes for all posts
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

    // Calculate hot score (votes + comments * 0.5) and sort
    const postsWithScores = await Promise.all(
      posts.map(async (post) => {
        const voteCount = await getVoteCount('post', post.id);
        const commentCount = await prisma.comment.count({ where: { postId: post.id } });
        const hotScore = voteCount + commentCount * 0.5;
        const userVote = userId ? await getUserVote(userId, 'post', post.id) : null;
        
        return {
          ...post,
          vote_count: voteCount,
          comment_count: commentCount,
          hot_score: hotScore,
          user_vote: userVote,
        };
      })
    );

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
    for (const comment of post.comments) {
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

    // Sort top-level comments by creation date (newest first)
    topLevelComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      ...post,
      vote_count: voteCount,
      user_vote: userVote,
      comment_count: post.comments.length,
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
    for (const comment of post.comments) {
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

    // Sort top-level comments by creation date (newest first)
    topLevelComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      ...post,
      vote_count: voteCount,
      user_vote: userVote,
      comment_count: post.comments.length,
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
        image_url: data.image_url || null,
        video_url: data.video_url || null,
        media_urls: data.media_urls || [],
        crosspost_id: data.crosspost_id || null,
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
        crosspost: data.crosspost_id ? {
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                username: true,
              },
            },
            community: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        } : false,
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
    const { updateCommunityMemberCount } = await import('../utils/communityMemberCount');
    await updateCommunityMemberCount(data.community_id, data.author_id);

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
};

