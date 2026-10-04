export const queryKeys = {
  health: ['health'],
  surgeStatus: ['surge', 'status'],
  feed: ['feed'],
  chats: ['chats'],
  messages: (chatId) => ['chats', chatId, 'messages'],
};