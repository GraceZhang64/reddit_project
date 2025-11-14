export interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  author: string;
  communityId: number;
  communityName: string;
  voteCount?: number;
  commentCount: number;
  createdAt: string;
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

