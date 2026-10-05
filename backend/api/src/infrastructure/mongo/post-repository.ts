import mongoose from 'mongoose';
import type { Comment, LikeState, Post } from '../../modules/posts/domain.js';
import type {
  CommentPage,
  DeleteCommentResult,
  ListPageInput,
  PostPage,
  PostRepository,
} from '../../modules/posts/port.js';
import { MongoCommentModel, MongoLikeModel, MongoPostModel } from './models.js';

type PostRecord = {
  _id: string;
  authorId: string;
  text: string;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type CommentRecord = {
  _id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: Date;
};

function toPost(record: PostRecord): Post {
  return {
    id: record._id,
    authorId: record.authorId,
    text: record.text,
    mediaUrl: record.mediaUrl,
    likesCount: record.likesCount,
    commentsCount: record.commentsCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toComment(record: CommentRecord): Comment {
  return {
    id: record._id,
    postId: record.postId,
    authorId: record.authorId,
    text: record.text,
    createdAt: record.createdAt.toISOString(),
  };
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

export class MongoPostRepository implements PostRepository {
  async create(post: Post): Promise<void> {
    await MongoPostModel.create({
      _id: post.id,
      authorId: post.authorId,
      text: post.text,
      mediaUrl: post.mediaUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    });
  }

  async findById(id: string): Promise<Post | null> {
    const record = await MongoPostModel.findById(id).lean<PostRecord>().exec();
    return record ? toPost(record) : null;
  }

  async listPage(input: ListPageInput): Promise<PostPage> {
    const filter: Record<string, unknown> = {};
    if (input.authorId) filter.authorId = input.authorId;
    if (input.before) {
      filter.$or = [
        { createdAt: { $lt: new Date(input.before.createdAt) } },
        {
          createdAt: new Date(input.before.createdAt),
          _id: { $lt: input.before.id },
        },
      ];
    }
    const records = await MongoPostModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.limit + 1)
      .lean<PostRecord[]>()
      .exec();
    return {
      items: records.slice(0, input.limit).map(toPost),
      hasMore: records.length > input.limit,
    };
  }

  async deleteOwned(
    id: string,
    authorId: string,
  ): Promise<'deleted' | 'not_found' | 'forbidden'> {
    const session = await mongoose.startSession();
    try {
      let result: 'deleted' | 'not_found' | 'forbidden' = 'not_found';
      await session.withTransaction(async () => {
        const post = await MongoPostModel.findById(id)
          .session(session)
          .lean<PostRecord>()
          .exec();
        if (!post) {
          result = 'not_found';
          return;
        }
        if (post.authorId !== authorId) {
          result = 'forbidden';
          return;
        }
        await MongoPostModel.deleteOne({ _id: id }, { session }).exec();
        await Promise.all([
          MongoLikeModel.deleteMany({ postId: id }, { session }).exec(),
          MongoCommentModel.deleteMany({ postId: id }, { session }).exec(),
        ]);
        result = 'deleted';
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async getLikeState(
    postId: string,
    userId: string,
  ): Promise<LikeState | null> {
    const post = await MongoPostModel.findById(postId)
      .select('_id likesCount')
      .lean<Pick<PostRecord, '_id' | 'likesCount'>>()
      .exec();
    if (!post) return null;
    const liked = Boolean(await MongoLikeModel.exists({ postId, userId }));
    return { postId, liked, likesCount: post.likesCount };
  }

  async like(postId: string, userId: string): Promise<LikeState | null> {
    const session = await mongoose.startSession();
    try {
      let result: LikeState | null = null;
      await session.withTransaction(async () => {
        const post = await MongoPostModel.findById(postId)
          .session(session)
          .lean<PostRecord>()
          .exec();
        if (!post) {
          result = null;
          return;
        }
        const existing = await MongoLikeModel.exists({
          postId,
          userId,
        }).session(session);
        if (!existing) {
          await MongoLikeModel.create(
            [{ postId, userId, createdAt: new Date() }],
            {
              session,
            },
          );
          await MongoPostModel.updateOne(
            { _id: postId },
            { $inc: { likesCount: 1 } },
            { session },
          ).exec();
        }
        const updated = await MongoPostModel.findById(postId)
          .session(session)
          .lean<PostRecord>()
          .exec();
        result = updated
          ? { postId, liked: true, likesCount: updated.likesCount }
          : null;
      });
      return result;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      return this.getLikeState(postId, userId);
    } finally {
      await session.endSession();
    }
  }

  async unlike(postId: string, userId: string): Promise<LikeState | null> {
    const session = await mongoose.startSession();
    try {
      let result: LikeState | null = null;
      await session.withTransaction(async () => {
        const post = await MongoPostModel.findById(postId)
          .session(session)
          .lean<PostRecord>()
          .exec();
        if (!post) {
          result = null;
          return;
        }
        const deleted = await MongoLikeModel.deleteOne(
          { postId, userId },
          { session },
        ).exec();
        if (deleted.deletedCount > 0) {
          await MongoPostModel.updateOne(
            { _id: postId, likesCount: { $gt: 0 } },
            { $inc: { likesCount: -1 } },
            { session },
          ).exec();
        }
        const updated = await MongoPostModel.findById(postId)
          .session(session)
          .lean<PostRecord>()
          .exec();
        result = updated
          ? {
              postId,
              liked: false,
              likesCount: updated.likesCount,
            }
          : null;
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async createComment(comment: Comment): Promise<Comment | null> {
    const session = await mongoose.startSession();
    try {
      let result: Comment | null = null;
      await session.withTransaction(async () => {
        if (
          !(await MongoPostModel.exists({ _id: comment.postId }).session(
            session,
          ))
        ) {
          result = null;
          return;
        }
        await MongoCommentModel.create(
          [
            {
              _id: comment.id,
              postId: comment.postId,
              authorId: comment.authorId,
              text: comment.text,
              createdAt: new Date(comment.createdAt),
            },
          ],
          { session },
        );
        await MongoPostModel.updateOne(
          { _id: comment.postId },
          { $inc: { commentsCount: 1 } },
          { session },
        ).exec();
        result = { ...comment };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async listComments(
    postId: string,
    input: { limit: number; before?: Pick<Comment, 'createdAt' | 'id'> },
  ): Promise<CommentPage | null> {
    if (!(await MongoPostModel.exists({ _id: postId }))) return null;
    const filter: Record<string, unknown> = { postId };
    if (input.before) {
      filter.$or = [
        { createdAt: { $gt: new Date(input.before.createdAt) } },
        {
          createdAt: new Date(input.before.createdAt),
          _id: { $gt: input.before.id },
        },
      ];
    }
    const records = await MongoCommentModel.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(input.limit + 1)
      .lean<CommentRecord[]>()
      .exec();
    return {
      items: records.slice(0, input.limit).map(toComment),
      hasMore: records.length > input.limit,
    };
  }

  async deleteComment(
    postId: string,
    commentId: string,
    authorId: string,
  ): Promise<DeleteCommentResult> {
    const session = await mongoose.startSession();
    try {
      let result: DeleteCommentResult = 'post_not_found';
      await session.withTransaction(async () => {
        const postExists = await MongoPostModel.exists({ _id: postId }).session(
          session,
        );
        if (!postExists) {
          result = 'post_not_found';
          return;
        }
        const comment = await MongoCommentModel.findOne({
          _id: commentId,
          postId,
        })
          .session(session)
          .lean<CommentRecord>()
          .exec();
        if (!comment) {
          result = 'comment_not_found';
          return;
        }
        if (comment.authorId !== authorId) {
          result = 'forbidden';
          return;
        }
        await MongoCommentModel.deleteOne(
          { _id: commentId, postId, authorId },
          { session },
        ).exec();
        await MongoPostModel.updateOne(
          { _id: postId, commentsCount: { $gt: 0 } },
          { $inc: { commentsCount: -1 } },
          { session },
        ).exec();
        result = 'deleted';
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}
