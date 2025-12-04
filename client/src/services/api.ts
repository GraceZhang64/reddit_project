import axios from 'axios';

const API_BASE = '/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Request interceptor to add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || 
                  sessionStorage.getItem('access_token') || 
                  localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.clear();
      
      // Redirect to auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

// Use configured axios instance for all API calls
export const api = axiosInstance;

export interface Post {
  id: number;
  slug?: string | null;
  title: string;
  body?: string | null;
  voteCount: number;
  commentCount: number;
  userVote?: number | null;
  author: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  community: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: string;
  ai_summary?: string | null;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  memberCount?: number;
  createdAt: string;
  creator_id?: string;
}

export interface Comment {
  id: number;
  body: string;
  authorId: string;
  postId: number;
  parentCommentId?: number | null;
  vote_count: number;
  user_vote?: number | null;
  author: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationResponse<T> {
  items?: T[];
  posts?: T[];
  communities?: T[];
  comments?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePostData {
  title: string;
  body?: string;
  post_type?: string;
  link_url?: string;
  poll_options?: string[];
  poll_expires_hours?: number;
  community_id: number;
}

export interface CreateCommentData {
  body: string;
  postId: number;
  parentCommentId?: number;
}

export interface VoteData {
  target_type: 'post' | 'comment';
  target_id: number;
  value: 1 | -1;
}

// Posts API
export const postsApi = {
  async getAll(page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get<PaginationResponse<Post>>('/posts', {
      params: { page, limit }
    });
    return response.data;
  },

  async getHot(page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get<PaginationResponse<Post>>('/posts/hot', {
      params: { page, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  },

  async getByIdOrSlug(idOrSlug: string | number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${idOrSlug}`);
    return response.data;
  },

  async getWithSummary(id: number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${id}/summary`);
    return response.data;
  },

  async getWithSummaryByIdOrSlug(idOrSlug: string | number): Promise<Post> {
    const response = await api.get<Post>(`/posts/${idOrSlug}/summary`);
    return response.data;
  },

  async search(query: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get<PaginationResponse<Post>>('/posts/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  async create(data: CreatePostData): Promise<Post> {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreatePostData>): Promise<Post> {
    const response = await api.put<Post>(`/posts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
  }
};

// Communities API
export const communitiesApi = {
  async getAll(page = 1, limit = 20): Promise<PaginationResponse<Community>> {
    const response = await api.get<PaginationResponse<Community>>('/communities', {
      params: { page, limit }
    });
    return response.data;
  },

  async getBySlug(slug: string): Promise<Community> {
    const response = await api.get<Community>(`/communities/${slug}`);
    return response.data;
  },

  async create(data: { name: string; slug: string; description?: string }): Promise<Community> {
    const response = await api.post<Community>('/communities', data);
    return response.data;
  },

  async update(slug: string, data: { name?: string; description?: string }): Promise<Community> {
    const response = await api.put<Community>(`/communities/${slug}`, data);
    return response.data;
  },

  async delete(slug: string): Promise<void> {
    await api.delete(`/communities/${slug}`);
  },

  async search(query: string, page = 1, limit = 50): Promise<PaginationResponse<Community>> {
    const response = await api.get<PaginationResponse<Community>>('/communities/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  async getPosts(slug: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get<PaginationResponse<Post>>(`/communities/${slug}/posts`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// Comments API
export const commentsApi = {
  async getByPost(postId: number): Promise<{ comments: Comment[] }> {
    const response = await api.get<{ comments: Comment[] }>(`/comments/post/${postId}`);
    return response.data;
  },

  async getById(id: number): Promise<Comment> {
    const response = await api.get<Comment>(`/comments/${id}`);
    return response.data;
  },

  async search(query: string, page = 1, limit = 20): Promise<PaginationResponse<Comment & { post: { id: number; slug?: string; title: string; community: { id: number; name: string; slug: string } } }>> {
    const response = await api.get(`/comments/search`, {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  async create(data: CreateCommentData): Promise<Comment> {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  },

  async update(id: number, body: string): Promise<Comment> {
    const response = await api.put<Comment>(`/comments/${id}`, { body });
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/comments/${id}`);
  }
};

// Votes API
export const votesApi = {
  /**
   * Cast or remove a vote for a post using new backend endpoint
   */
  async votePost(postId: number, value: 1 | -1 | 0): Promise<{ postId: number; vote_count: number; user_vote: number | null }> {
    const response = await api.post(`/posts/${postId}/vote`, { value });
    return response.data;
  },

  /**
   * Cast a vote for a comment
   */
  async cast(data: { target_type: 'post' | 'comment'; target_id: number; value: 1 | -1 }): Promise<{ vote: any; voteCount: number }> {
    const response = await api.post('/votes', data);
    return response.data;
  },

  /**
   * Remove a vote for a post or comment
   */
  async remove(target_type: 'post' | 'comment', target_id: number): Promise<{ success: boolean; voteCount: number }> {
    const response = await api.delete('/votes', {
      data: { target_type, target_id }
    });
    return response.data;
  },

  /**
   * Vote on a comment (upvote, downvote, or remove)
   */
  async voteComment(commentId: number, value: 1 | -1 | 0): Promise<{ voteCount: number; user_vote: number | null }> {
    if (value === 0) {
      const result = await this.remove('comment', commentId);
      return { voteCount: result.voteCount, user_vote: null };
    } else {
      const result = await this.cast({
        target_type: 'comment',
        target_id: commentId,
        value: value as 1 | -1
      });
      // Get user vote after casting (should be the value we just cast)
      return { voteCount: result.voteCount, user_vote: value as number };
    }
  },

  async getCount(target_type: 'post' | 'comment', target_id: number): Promise<{ voteCount: number }> {
    const response = await api.get(`/votes/${target_type}/${target_id}`);
    return response.data;
  },

  async getUserVote(target_type: 'post' | 'comment', target_id: number): Promise<{ userVote: number | null }> {
    const response = await api.get(`/votes/user/${target_type}/${target_id}`);
    return response.data;
  }
};

// Users API
export const usersApi = {
  async getProfile(username: string): Promise<any> {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    const response = await api.get(`/users/check-username/${username}`);
    return response.data;
  },

  async getPosts(username: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get(`/users/${username}/posts`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getComments(username: string, page = 1, limit = 20): Promise<PaginationResponse<Comment>> {
    const response = await api.get(`/users/${username}/comments`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getCommunities(username: string): Promise<{ communities: Community[] }> {
    const response = await api.get(`/users/${username}/communities`);
    return response.data;
  },

  async updateProfile(data: { bio?: string | null; avatar_url?: string | null }): Promise<any> {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  async updateUsername(username: string): Promise<{ message: string; user: any }> {
    const response = await api.put('/users/username', { username });
    return response.data;
  },

  async deleteAccount(confirm: string): Promise<{ message: string }> {
    const response = await api.delete('/users/me', { data: { confirm } });
    return response.data;
  }
};

// Follows API
export const followsApi = {
  async follow(username: string): Promise<{ message: string }> {
    const response = await api.post(`/follows/${username}`);
    return response.data;
  },

  async unfollow(username: string): Promise<{ message: string }> {
    const response = await api.delete(`/follows/${username}`);
    return response.data;
  },

  async checkFollowing(username: string): Promise<{ isFollowing: boolean }> {
    const response = await api.get(`/follows/check/${username}`);
    return response.data;
  },

  async getFollowers(username: string, page = 1, limit = 20): Promise<any> {
    const response = await api.get(`/follows/followers/${username}`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getFollowing(username: string, page = 1, limit = 20): Promise<any> {
    const response = await api.get(`/follows/following/${username}`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getFollowingFeed(page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get('/follows/feed', {
      params: { page, limit }
    });
    return response.data;
  }
};

// Saved Posts API
export const savedPostsApi = {
  async getSavedPosts(page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await api.get('/saved-posts', {
      params: { page, limit }
    });
    return response.data;
  },

  async savePost(postId: number): Promise<{ message: string; saved: boolean; savedAt: string }> {
    const response = await api.post(`/saved-posts/${postId}`);
    return response.data;
  },

  async unsavePost(postId: number): Promise<{ message: string; saved: boolean }> {
    const response = await api.delete(`/saved-posts/${postId}`);
    return response.data;
  },

  async checkIfSaved(postId: number): Promise<{ saved: boolean; savedAt: string | null }> {
    const response = await api.get(`/saved-posts/check/${postId}`);
    return response.data;
  },

  async checkMultipleSaved(postIds: number[]): Promise<Record<number, boolean>> {
    const response = await api.post('/saved-posts/check-multiple', { postIds });
    return response.data;
  }
};
