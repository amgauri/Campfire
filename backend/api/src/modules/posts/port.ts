import type { Comment, LikeState, Post, PostCursor } from './domain.js';

export type ListPageInput = {
  limit: number;
  authorId?: string;
  before?: PostCursor;
};

export type PostPage = {
  items: Post[];
  hasMore: boolean;
};

export type CommentPage = {
  items: Comment[];
  hasMore: boolean;
};

export type DeleteCommentResult =
  'deleted' | 'post_not_found' | 'comment_not_found' | 'forbidden';

export interface PostRepository {
  // Mutations verify post existence and update counts atomically; deletion cascades interactions.
  create(post: Post): Promise<void>;
  findById(id: string): Promise<Post | null>;
  listPage(input: ListPageInput): Promise<PostPage>;
  deleteOwned(
    id: string,
    authorId: string,
  ): Promise<'deleted' | 'not_found' | 'forbidden'>;
  getLikeState(postId: string, userId: string): Promise<LikeState | null>;
  like(postId: string, userId: string): Promise<LikeState | null>;
  unlike(postId: string, userId: string): Promise<LikeState | null>;
  createComment(comment: Comment): Promise<Comment | null>;
  listComments(
    postId: string,
    input: { limit: number; before?: PostCursor },
  ): Promise<CommentPage | null>;
  deleteComment(
    postId: string,
    commentId: string,
    authorId: string,
  ): Promise<DeleteCommentResult>;
}
