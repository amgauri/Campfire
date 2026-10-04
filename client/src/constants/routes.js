// Central route paths. Static routes are strings; dynamic routes are builders.
// These mirror the files in app/. Never hand-write URLs in screens.
export const ROUTES = Object.freeze({
  home: '/',
  surge: '/surge',
  profile: '/profile',
  createPost: '/create-post',
  chat: (chatId) => `/chat/${chatId}`,

  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',

  notifications: '/notifications',
  settings: '/settings',
  designSystem: '/design-system', // dev-only gallery

  waiting: '/waiting',
  stageHost: '/stage/host',

  post: (postId) => `/post/${postId}`,
  comments: (postId) => `/post/${postId}/comments`,
  user: (userId) => `/user/${userId}`,
  userPosts: (userId) => `/user/${userId}/posts`,
  match: (matchId) => `/match/${matchId}`,
  ghostDm: (matchId) => `/match/${matchId}/chat`,
  matchVideo: (matchId) => `/match/${matchId}/video`,
  stage: (stageId) => `/stage/${stageId}`,
});