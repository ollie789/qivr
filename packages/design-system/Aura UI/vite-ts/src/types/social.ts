import { User } from './users';

export interface EngagementStats {
  likes: number;
  comments?: number;
  shares?: number;
}

export type MediaType = {
  type: string;
  src: string;
};

export interface ContentBlock {
  id: string;
  type: 'post' | 'comment' | 'reply';
  author: User;
  message: {
    text?: string;
    attachments?: MediaType[];
  };
  createdAt: string;
  engagement: EngagementStats;
}

export interface PostType extends ContentBlock {
  comments: CommentType[];
}

export interface CommentType extends ContentBlock {
  replies: ReplyType[];
}

export type ReplyType = ContentBlock;

export type ProfileData = User & {
  bio: string;
  bannerImage: string;
  websiteUrl: string;
  username: string;
  following: number;
  followingUsers: (User & { following: number; followers: number; followingStatus: boolean })[];
  followers: number;
  posts: PostType[];
  photos: string[];
};
