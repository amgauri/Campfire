import { randomUUID } from 'node:crypto';
import type { Clock } from '../auth/ports.js';
import { encodeCursor } from './cursor.js';
import type { Comment, LikeState } from './domain.js';
import type { DeleteCommentResult, PostRepository } from './port.js';
import type {
  CreateCommentInput,
  ListCommentsInput,
} from './interaction-validation.js';

export type CommentList = {
  items: Comment[];
  nextCursor: string | null;
};

export class PostInteractionService {
  constructor(
    private readonly posts: PostRepository,
    private readonly clock: Clock,
  ) {}

  getLikeState(postId: string, userId: string): Promise<LikeState | null> {
    return this.posts.getLikeState(postId, userId);
  }

  like(postId: string, userId: string): Promise<LikeState | null> {
    return this.posts.like(postId, userId);
  }

  unlike(postId: string, userId: string): Promise<LikeState | null> {
    return this.posts.unlike(postId, userId);
  }

  createComment(
    postId: string,
    authorId: string,
    input: CreateCommentInput,
  ): Promise<Comment | null> {
    return this.posts.createComment({
      id: randomUUID(),
      postId,
      authorId,
      text: input.text,
      createdAt: this.clock.now().toISOString(),
    });
  }

  async listComments(
    postId: string,
    input: ListCommentsInput,
  ): Promise<CommentList | null> {
    const page = await this.posts.listComments(postId, {
      limit: input.limit,
      ...(input.cursor ? { before: input.cursor } : {}),
    });
    if (!page) return null;
    const last = page.items.at(-1);
    return {
      items: page.items,
      nextCursor: page.hasMore && last ? encodeCursor(last) : null,
    };
  }

  deleteComment(
    postId: string,
    commentId: string,
    authorId: string,
  ): Promise<DeleteCommentResult> {
    return this.posts.deleteComment(postId, commentId, authorId);
  }
}
