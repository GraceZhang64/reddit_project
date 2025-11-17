import axios from 'axios';
import { authService } from './auth';

const API_BASE = '/api';

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
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  poll_options?: string[];
  poll_expires_hours?: number;
  crosspost_id?: number;
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
    const response = await axios.get<PaginationResponse<Post>>(`${API_BASE}/posts`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getHot(page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await axios.get<PaginationResponse<Post>>(`${API_BASE}/posts/hot`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Post> {
    const response = await axios.get<Post>(`${API_BASE}/posts/${id}`);
    return response.data;
  },

  async getByIdOrSlug(idOrSlug: string | number): Promise<Post> {
    const response = await axios.get<Post>(`${API_BASE}/posts/${idOrSlug}`);
    return response.data;
  },

  async getWithSummary(id: number): Promise<Post> {
    const response = await axios.get<Post>(`${API_BASE}/posts/${id}/summary`);
    return response.data;
  },

  async getWithSummaryByIdOrSlug(idOrSlug: string | number): Promise<Post> {
    const response = await axios.get<Post>(`${API_BASE}/posts/${idOrSlug}/summary`);
    return response.data;
  },

  async search(query: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await axios.get<PaginationResponse<Post>>(`${API_BASE}/posts/search`, {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  async create(data: CreatePostData): Promise<Post> {
    const response = await axios.post<Post>(`${API_BASE}/posts`, data);
    return response.data;
  },

  async update(id: number, data: Partial<CreatePostData>): Promise<Post> {
    const response = await axios.put<Post>(`${API_BASE}/posts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/posts/${id}`);
  }
};

// Communities API
export const communitiesApi = {
  async getAll(page = 1, limit = 20): Promise<PaginationResponse<Community>> {
    const response = await axios.get<PaginationResponse<Community>>(`${API_BASE}/communities`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getBySlug(slug: string): Promise<Community> {
    const response = await axios.get<Community>(`${API_BASE}/communities/${slug}`);
    return response.data;
  },

  async create(data: { name: string; slug: string; description?: string }): Promise<Community> {
    const response = await axios.post<Community>(`${API_BASE}/communities`, data);
    return response.data;
  },

  async update(slug: string, data: { name?: string; description?: string }): Promise<Community> {
    const response = await axios.put<Community>(`${API_BASE}/communities/${slug}`, data);
    return response.data;
  },

  async delete(slug: string): Promise<void> {
    await axios.delete(`${API_BASE}/communities/${slug}`);
  },

  async getPosts(slug: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await axios.get<PaginationResponse<Post>>(`${API_BASE}/communities/${slug}/posts`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// Comments API
export const commentsApi = {
  async getByPost(postId: number): Promise<{ comments: Comment[] }> {
    const response = await axios.get<{ comments: Comment[] }>(`${API_BASE}/comments/post/${postId}`);
    return response.data;
  },

  async getById(id: number): Promise<Comment> {
    const response = await axios.get<Comment>(`${API_BASE}/comments/${id}`);
    return response.data;
  },

  async search(query: string, page = 1, limit = 20): Promise<PaginationResponse<Comment & { post: { id: number; slug?: string; title: string; community: { id: number; name: string; slug: string } } }>> {
    const response = await axios.get(`${API_BASE}/comments/search`, {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  async create(data: CreateCommentData): Promise<Comment> {
    const response = await axios.post<Comment>(`${API_BASE}/comments`, data);
    return response.data;
  },

  async update(id: number, body: string): Promise<Comment> {
    const response = await axios.put<Comment>(`${API_BASE}/comments/${id}`, { body });
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/comments/${id}`);
  }
};

// Votes API
export const votesApi = {
  async cast(data: VoteData): Promise<{ vote: any; voteCount: number }> {
    const response = await axios.post(`${API_BASE}/votes`, data);
    return response.data;
  },

  async remove(target_type: 'post' | 'comment', target_id: number): Promise<{ success: boolean; voteCount: number }> {
    const response = await axios.delete(`${API_BASE}/votes`, {
      data: { target_type, target_id }
    });
    return response.data;
  },

  async getCount(target_type: 'post' | 'comment', target_id: number): Promise<{ voteCount: number }> {
    const response = await axios.get(`${API_BASE}/votes/${target_type}/${target_id}`);
    return response.data;
  },

  async getUserVote(target_type: 'post' | 'comment', target_id: number): Promise<{ userVote: number | null }> {
    const response = await axios.get(`${API_BASE}/votes/user/${target_type}/${target_id}`);
    return response.data;
  }
};

// Users API
export const usersApi = {
  async getProfile(username: string): Promise<any> {
    const response = await axios.get(`${API_BASE}/users/${username}`);
    return response.data;
  },

  async getPosts(username: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await axios.get(`${API_BASE}/users/${username}/posts`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getComments(username: string, page = 1, limit = 20): Promise<PaginationResponse<Comment>> {
    const response = await axios.get(`${API_BASE}/users/${username}/comments`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getCommunities(username: string): Promise<{ communities: Community[] }> {
    const response = await axios.get(`${API_BASE}/users/${username}/communities`);
    return response.data;
  },

  async updateProfile(data: { bio?: string; avatar_url?: string }): Promise<any> {
    const response = await axios.put(`${API_BASE}/users/profile`, data);
    return response.data;
  }
};

