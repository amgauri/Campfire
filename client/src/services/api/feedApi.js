import { sleep } from '@/utils/sleep';
import { http } from './httpClient';

// Mock until the backend is ready. Set EXPO_PUBLIC_MOCK_SOCIAL=false in .env.local to use the real calls.
const USE_MOCK = process.env.EXPO_PUBLIC_MOCK_SOCIAL !== 'false';

/**
 * Post shape the UI expects (camelCase). Map backend fields to this in the REAL section.
 * { id, author: { id, username, displayName, avatarUrl, auraLevel }, caption, mediaUrl|null,
 *   createdAt (ISO), likesCount, commentsCount, liked, saved }
 */

// ---------- REAL (paths PROVISIONAL: confirm with backend, then move to endpoints.js) ----------
const unwrap = (raw) => raw?.data ?? raw;

async function realListPosts(options) {
  return unwrap(await http.get('/feed', options));
}

// TODO: image upload method is undecided, so only the caption is sent for now.
async function realCreatePost({ caption }, options) {
  return unwrap(await http.post('/posts', { caption }, options));
}

async function realSetLiked({ postId, liked }, options) {
  const path = `/posts/${encodeURIComponent(postId)}/like`;
  if (liked) await http.put(path, undefined, options);
  else await http.delete(path, options);
}

async function realSetSaved({ postId, saved }, options) {
  const path = `/posts/${encodeURIComponent(postId)}/save`;
  if (saved) await http.put(path, undefined, options);
  else await http.delete(path, options);
}

// ---------- MOCK ----------
const minutesAgo = (n) => new Date(Date.now() - n * 60000).toISOString();
const USERS = [
  { id: 'u_aarav', username: 'aarav.s', displayName: 'Aarav Sharma', avatarUrl: null, auraLevel: 0 },
  { id: 'u_meera', username: 'meera_k', displayName: 'Meera K', avatarUrl: null, auraLevel: 1 },
  { id: 'u_rohan', username: 'rohan.d', displayName: 'Rohan Das', avatarUrl: null, auraLevel: 3 },
  { id: 'u_isha', username: 'isha.v', displayName: 'Isha Verma', avatarUrl: null, auraLevel: 2 },
];
const CAPTIONS = [
  'Library vibes at 2am',
  'Who else is surviving finals?',
  'New meme just dropped',
  'Sunset from the hostel roof',
  'Cafeteria review: 3/10',
  'Hackathon night!',
];

let posts = Array.from({ length: 12 }, (_, i) => ({
  id: `p_${i + 1}`,
  author: USERS[i % USERS.length],
  caption: CAPTIONS[i % CAPTIONS.length],
  mediaUrl: i % 4 === 3 ? null : `https://picsum.photos/seed/campfire${i + 1}/600/750`,
  createdAt: minutesAgo((i + 1) * 41),
  likesCount: (i * 7) % 40,
  commentsCount: (i * 3) % 9,
  liked: false,
  saved: false,
}));

const clone = (v) => JSON.parse(JSON.stringify(v));

async function mockListPosts() {
  await sleep(400);
  return clone(posts);
}

async function mockCreatePost({ caption, imageUri, author }) {
  await sleep(500);
  const post = {
    id: `p_new_${Date.now()}`,
    author: {
      id: author?.id ?? 'u_me',
      username: author?.username ?? 'me',
      displayName: author?.displayName ?? 'Me',
      avatarUrl: author?.avatarUrl ?? null,
      auraLevel: author?.auraLevel ?? 0,
    },
    caption: caption?.trim() ?? '',
    mediaUrl: imageUri ?? null,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    liked: false,
    saved: false,
  };
  posts = [post, ...posts];
  return clone(post);
}

async function mockSetLiked({ postId, liked }) {
  await sleep(200);
  posts = posts.map((p) =>
    p.id === postId && p.liked !== liked
      ? { ...p, liked, likesCount: Math.max(0, p.likesCount + (liked ? 1 : -1)) }
      : p
  );
}

async function mockSetSaved({ postId, saved }) {
  await sleep(200);
  posts = posts.map((p) => (p.id === postId ? { ...p, saved } : p));
}

export const listPosts = USE_MOCK ? mockListPosts : realListPosts;
export const createPost = USE_MOCK ? mockCreatePost : realCreatePost;
export const setLiked = USE_MOCK ? mockSetLiked : realSetLiked;
export const setSaved = USE_MOCK ? mockSetSaved : realSetSaved;