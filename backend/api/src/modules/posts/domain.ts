export type Post = {
  id: string;
  authorId: string;
  text: string;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PostCursor = Pick<Post, 'createdAt' | 'id'>;

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
};

export type LikeState = {
  postId: string;
  liked: boolean;
  likesCount: number;
};
