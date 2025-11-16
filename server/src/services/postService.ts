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
  image_url: string | null;
  community_id: number;
  author_id: string;
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
        const commentCount = await prisma.comment.count({ where: { postId: post.id } });
        
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          body: post.body,
          voteCount: voteCount,
          commentCount: commentCount,
          userVote: userVote,
          author: post.author,
          community: post.community,
          createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
          ai_summary: post.ai_summary,
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
          id: post.id,
          slug: post.slug,
          title: post.title,
          body: post.body,
          voteCount: voteCount,
          commentCount: commentCount,
          userVote: userVote,
          author: post.author,
          community: post.community,
          createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
          ai_summary: post.ai_summary,
          hot_score: hotScore,
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

    const supabase = getSupabaseClient();
    
    // Use Supabase full-text search
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .textSearch('search_vector', query)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!posts) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Get full post data with relations
    const postIds = posts.map((p: any) => p.id);
    const fullPosts = await prisma.post.findMany({
      where: { id: { in: postIds } },
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

    // Maintain search result order
    const orderedPosts = postIds.map((id: number) => 
      fullPosts.find(p => p.id === id)
    ).filter(Boolean);

    const postsWithVotes = await Promise.all(
      orderedPosts.map(async (post: any) => {
        const voteCount = await getVoteCount('post', post.id);
        const userVote = userId ? await getUserVote(userId, 'post', post.id) : null;
        const commentCount = await prisma.comment.count({ where: { postId: post.id } });
        
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          body: post.body,
          voteCount: voteCount,
          commentCount: commentCount,
          userVote: userVote,
          author: post.author,
          community: post.community,
          createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
          ai_summary: post.ai_summary,
        };
      })
    );

    // Get total count (approximate)
    const total = await prisma.post.count();

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

    // Get vote counts for comments
    const commentsWithVotes = await Promise.all(
      post.comments.map(async (comment) => {
        const commentVoteCount = await getVoteCount('comment', comment.id);
        const commentUserVote = userId ? await getUserVote(userId, 'comment', comment.id) : null;
        
        return {
          ...comment,
          vote_count: commentVoteCount,
          user_vote: commentUserVote,
        };
      })
    );

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
      voteCount: voteCount,
      commentCount: post.comments.length,
      userVote: userVote,
      author: post.author,
      community: post.community,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      ai_summary: post.ai_summary,
      comments: commentsWithVotes,
    };
  },

  async createPost(data: CreatePostData) {
    const post = await prisma.post.create({
      data: {
        title: data.title,
        body: data.body,
        image_url: data.image_url, // Note: schema uses image_url (snake_case)
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

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
      voteCount: 0,
      commentCount: 0,
      userVote: null,
      author: post.author,
      community: post.community,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      ai_summary: post.ai_summary,
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
      id: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
      voteCount: voteCount,
      commentCount: commentCount,
      userVote: null,
      author: post.author,
      community: post.community,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      ai_summary: post.ai_summary,
    };
  },

  async deletePost(postId: number) {
    await prisma.post.delete({
      where: { id: postId },
    });
  },
};

