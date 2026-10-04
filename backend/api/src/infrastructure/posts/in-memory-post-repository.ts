import type { Comment, LikeState, Post } from '../../modules/posts/domain.js';
import type {
  CommentPage,
  DeleteCommentResult,
  ListPageInput,
  PostPage,
  PostRepository,
} from '../../modules/posts/port.js';

function newestFirst(a: Post, b: Post): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt > b.createdAt ? -1 : 1;
  }
  if (a.id === b.id) return 0;
  return a.id > b.id ? -1 : 1;
}

export class InMemoryPostRepository implements PostRepository {
  private readonly byId = new Map<string, Post>();
  private readonly likes = new Map<string, Set<string>>();
  private readonly comments = new Map<string, Map<string, Comment>>();

  create(post: Post): Promise<void> {
    this.byId.set(post.id, { ...post });
    return Promise.resolve();
  }

  findById(id: string): Promise<Post | null> {
    const post = this.byId.get(id);
    return Promise.resolve(post ? { ...post } : null);
  }

  listPage(input: ListPageInput): Promise<PostPage> {
    const candidates = [...this.byId.values()]
      .filter(
        (post) =>
          (!input.authorId || post.authorId === input.authorId) &&
          (!input.before ||
            post.createdAt < input.before.createdAt ||
            (post.createdAt === input.before.createdAt &&
              post.id < input.before.id)),
      )
      .sort(newestFirst)
      .slice(0, input.limit + 1);
    return Promise.resolve({
      items: candidates.slice(0, input.limit).map((post) => ({ ...post })),
      hasMore: candidates.length > input.limit,
    });
  }

  deleteOwned(
    id: string,
    authorId: string,
  ): Promise<'deleted' | 'not_found' | 'forbidden'> {
    const post = this.byId.get(id);
    if (!post) return Promise.resolve('not_found');
    if (post.authorId !== authorId) return Promise.resolve('forbidden');
    this.byId.delete(id);
    this.likes.delete(id);
    this.comments.delete(id);
    return Promise.resolve('deleted');
  }

  getLikeState(postId: string, userId: string): Promise<LikeState | null> {
    const post = this.byId.get(postId);
    if (!post) return Promise.resolve(null);
    return Promise.resolve({
      postId,
      liked: this.likes.get(postId)?.has(userId) ?? false,
      likesCount: post.likesCount,
    });
  }

  like(postId: string, userId: string): Promise<LikeState | null> {
    const post = this.byId.get(postId);
    if (!post) return Promise.resolve(null);
    const likes = this.likes.get(postId) ?? new Set<string>();
    likes.add(userId);
    this.likes.set(postId, likes);
    post.likesCount = likes.size;
    return this.getLikeState(postId, userId);
  }

  unlike(postId: string, userId: string): Promise<LikeState | null> {
    const post = this.byId.get(postId);
    if (!post) return Promise.resolve(null);
    const likes = this.likes.get(postId);
    likes?.delete(userId);
    post.likesCount = likes?.size ?? 0;
    return this.getLikeState(postId, userId);
  }

  createComment(comment: Comment): Promise<Comment | null> {
    const post = this.byId.get(comment.postId);
    if (!post) return Promise.resolve(null);
    const comments =
      this.comments.get(comment.postId) ?? new Map<string, Comment>();
    comments.set(comment.id, { ...comment });
    this.comments.set(comment.postId, comments);
    post.commentsCount = comments.size;
    return Promise.resolve({ ...comment });
  }

  listComments(
    postId: string,
    input: { limit: number; before?: Pick<Comment, 'createdAt' | 'id'> },
  ): Promise<CommentPage | null> {
    if (!this.byId.has(postId)) return Promise.resolve(null);
    const candidates = [...(this.comments.get(postId)?.values() ?? [])]
      .filter(
        (comment) =>
          !input.before ||
          comment.createdAt > input.before.createdAt ||
          (comment.createdAt === input.before.createdAt &&
            comment.id > input.before.id),
      )
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt)
          return a.createdAt < b.createdAt ? -1 : 1;
        if (a.id === b.id) return 0;
        return a.id < b.id ? -1 : 1;
      })
      .slice(0, input.limit + 1);
    return Promise.resolve({
      items: candidates
        .slice(0, input.limit)
        .map((comment) => ({ ...comment })),
      hasMore: candidates.length > input.limit,
    });
  }

  deleteComment(
    postId: string,
    commentId: string,
    authorId: string,
  ): Promise<DeleteCommentResult> {
    const post = this.byId.get(postId);
    if (!post) return Promise.resolve('post_not_found');
    const comments = this.comments.get(postId);
    const comment = comments?.get(commentId);
    if (!comment) return Promise.resolve('comment_not_found');
    if (comment.authorId !== authorId) return Promise.resolve('forbidden');
    comments?.delete(commentId);
    post.commentsCount = comments?.size ?? 0;
    return Promise.resolve('deleted');
  }
}
