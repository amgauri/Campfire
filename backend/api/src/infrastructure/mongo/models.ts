import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    emailKey: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    usernameKey: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    auraLevel: { type: Number, required: true, min: 0, max: 3 },
    interests: { type: [String], default: [] },
    onboardingComplete: { type: Boolean, required: true },
    role: { type: String, enum: ['user', 'admin'], required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'campfire_users', versionKey: false, strict: 'throw' },
);

const refreshSessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    familyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    verifierHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  {
    collection: 'campfire_refresh_sessions',
    versionKey: false,
    strict: 'throw',
  },
);
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const postSchema = new Schema(
  {
    _id: { type: String, required: true },
    authorId: { type: String, required: true },
    text: { type: String, required: true },
    mediaUrl: { type: String, default: null },
    likesCount: { type: Number, required: true, default: 0, min: 0 },
    commentsCount: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'campfire_posts', versionKey: false, strict: 'throw' },
);
postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ authorId: 1, createdAt: -1, _id: -1 });

const likeSchema = new Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'campfire_post_likes', versionKey: false, strict: 'throw' },
);
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const commentSchema = new Schema(
  {
    _id: { type: String, required: true },
    postId: { type: String, required: true },
    authorId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'campfire_post_comments', versionKey: false, strict: 'throw' },
);
commentSchema.index({ postId: 1, createdAt: 1, _id: 1 });

const surgeStatusSchema = new Schema(
  {
    _id: { type: String, required: true },
    isActive: { type: Boolean, required: true },
  },
  { collection: 'campfire_surge_status', versionKey: false, strict: 'throw' },
);

export const MongoUserModel = model('CampfireUser', userSchema);
export const MongoRefreshSessionModel = model(
  'CampfireRefreshSession',
  refreshSessionSchema,
);
export const MongoPostModel = model('CampfirePost', postSchema);
export const MongoLikeModel = model('CampfirePostLike', likeSchema);
export const MongoCommentModel = model('CampfirePostComment', commentSchema);
export const MongoSurgeStatusModel = model(
  'CampfireSurgeStatus',
  surgeStatusSchema,
);

export async function initializeMongoIndexes(): Promise<void> {
  await Promise.all([
    MongoUserModel.init(),
    MongoRefreshSessionModel.init(),
    MongoPostModel.init(),
    MongoLikeModel.init(),
    MongoCommentModel.init(),
    MongoSurgeStatusModel.init(),
  ]);
}
