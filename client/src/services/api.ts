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
}

export interface PaginationResponse<T> {
  items?: T[];
  posts?: T[];
  communities?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

  async search(query: string, page = 1, limit = 20): Promise<PaginationResponse<Post>> {
    const response = await axios.get<PaginationResponse<Post>>(`${API_BASE}/posts/search`, {
      params: { q: query, page, limit }
    });
    return response.data;
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
  }
};

