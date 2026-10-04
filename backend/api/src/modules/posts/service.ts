import { randomUUID } from 'node:crypto';
import type { Clock } from '../auth/ports.js';
import { encodeCursor } from './cursor.js';
import type { Post } from './domain.js';
import type { PostRepository } from './port.js';
import type { CreatePostInput, ListPostsInput } from './validation.js';

export type PostList = {
  items: Post[];
  nextCursor: string | null;
};

export class PostService {
  constructor(
    private readonly posts: PostRepository,
    private readonly clock: Clock,
  ) {}

  async create(authorId: string, input: CreatePostInput): Promise<Post> {
    const now = this.clock.now().toISOString();
    const post: Post = {
      id: randomUUID(),
      authorId,
      text: input.text,
      mediaUrl: input.mediaUrl ?? null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.posts.create(post);
    return post;
  }

  get(id: string): Promise<Post | null> {
    return this.posts.findById(id);
  }

  async list(input: ListPostsInput): Promise<PostList> {
    const page = await this.posts.listPage({
      limit: input.limit,
      ...(input.authorId ? { authorId: input.authorId } : {}),
      ...(input.cursor ? { before: input.cursor } : {}),
    });
    const last = page.items.at(-1);
    return {
      items: page.items,
      nextCursor: page.hasMore && last ? encodeCursor(last) : null,
    };
  }

  deleteOwned(
    id: string,
    authorId: string,
  ): Promise<'deleted' | 'not_found' | 'forbidden'> {
    return this.posts.deleteOwned(id, authorId);
  }
}
