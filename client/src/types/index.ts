export interface Community {
  id: number;
  name: string;
  slug?: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

export interface Post {
  id: number;
  slug?: string;
  title: string;
  body?: string;
  author: string;
  communityId: number;
  communityName: string;
  communitySlug?: string;
  voteCount?: number;
  commentCount: number;
  createdAt: string;
  aiSummary?: string;
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

