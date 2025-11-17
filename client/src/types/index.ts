export interface Community {
  id: number;
  name: string;
  slug?: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

export type PostType = 'text' | 'link' | 'image' | 'video' | 'poll' | 'crosspost';

export interface Post {
  id: number;
  slug?: string;
  title: string;
  body?: string;
  post_type?: PostType;
  link_url?: string;
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  crosspost_id?: number;
  crosspost?: {
    id: number;
    title: string;
    slug?: string;
    author: { username: string };
    community: { name: string; slug: string };
  };
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

