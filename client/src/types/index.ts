export interface Community {
  id: number;
  name: string;
  slug?: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

export type PostType = 'text' | 'poll';

export interface Post {
  id: number;
  slug?: string;
  title: string;
  body?: string;
  post_type?: PostType;
  link_url?: string;
  author: string;
  communityId: number;
  communityName: string;
  communitySlug?: string;
  voteCount?: number;
  commentCount: number;
  createdAt: string;
  aiSummary?: string;
}

export interface PollOption {
  id: number;
  text: string;
  position: number;
  vote_count: number;
}

export interface Poll {
  id: number;
  postId: number;
  expires_at?: string;
  is_expired: boolean;
  options: PollOption[];
  total_votes: number;
}

export interface Comment {
  id: number;
  body: string;
  author: string;
  postId: number;
  parentCommentId?: number;
  voteCount?: number;
  createdAt: string;
  replies?: Comment[];
}

