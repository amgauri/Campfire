import { sleep } from '@/utils/sleep';
import { http } from './httpClient';

const USE_MOCK = process.env.EXPO_PUBLIC_MOCK_SOCIAL !== 'false';

/**
 * Chat: { id, partner: { id, username, displayName, avatarUrl, auraLevel },
 *         lastMessage: { text, createdAt } | null, unreadCount }
 * Message: { id, chatId, senderId, text, createdAt }   (lists are NEWEST FIRST)
 */

// ---------- REAL (paths PROVISIONAL) ----------
const unwrap = (raw) => raw?.data ?? raw;

async function realListChats(options) {
  return unwrap(await http.get('/chats', options));
}

async function realListMessages({ chatId }, options) {
  return unwrap(await http.get(`/chats/${encodeURIComponent(chatId)}/messages`, options));
}

async function realSendMessage({ chatId, text }, options) {
  return unwrap(await http.post(`/chats/${encodeURIComponent(chatId)}/messages`, { text }, options));
}

// ---------- MOCK ----------
const ME = '__me__'; // swapped for the real user id when returned
const minutesAgo = (n) => new Date(Date.now() - n * 60000).toISOString();

const PEOPLE = {
  c_1: { id: 'u_aarav', username: 'aarav.s', displayName: 'Aarav Sharma', avatarUrl: null, auraLevel: 0 },
  c_2: { id: 'u_meera', username: 'meera_k', displayName: 'Meera K', avatarUrl: null, auraLevel: 1 },
  c_3: { id: 'u_rohan', username: 'rohan.d', displayName: 'Rohan Das', avatarUrl: null, auraLevel: 3 },
};

const messages = new Map();
const unread = new Map([['c_1', 2], ['c_2', 0], ['c_3', 1]]);

const seed = (chatId, lines) =>
  messages.set(
    chatId,
    lines.map(([senderId, text, mins], i) => ({
      id: `${chatId}_${i}`,
      chatId,
      senderId,
      text,
      createdAt: minutesAgo(mins),
    }))
  );

seed('c_1', [['u_aarav', 'are you coming to the hackathon?', 4], [ME, 'maybe, which block?', 9], ['u_aarav', 'hey!', 12]]);
seed('c_2', [[ME, 'thanks for the notes!', 60], ['u_meera', 'sent you the pdf', 75]]);
seed('c_3', [['u_rohan', 'that meme was gold', 300]]);

const REPLIES = ['haha yes', 'lol okay', 'sounds good!', 'wait really?', 'nice 😄'];
const withMe = (m, meId) => (m.senderId === ME ? { ...m, senderId: meId ?? 'me' } : m);

async function mockListChats() {
  await sleep(350);
  return Object.entries(PEOPLE)
    .map(([id, partner]) => {
      const last = messages.get(id)?.[0];
      return {
        id,
        partner,
        lastMessage: last ? { text: last.text, createdAt: last.createdAt } : null,
        unreadCount: unread.get(id) ?? 0,
      };
    })
    .sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''));
}

async function mockListMessages({ chatId, meId }) {
  await sleep(250);
  unread.set(chatId, 0);
  return (messages.get(chatId) ?? []).map((m) => withMe(m, meId));
}

async function mockSendMessage({ chatId, text, meId }) {
  await sleep(200);
  const message = { id: `${chatId}_${Date.now()}`, chatId, senderId: ME, text: text.trim(), createdAt: new Date().toISOString() };
  messages.set(chatId, [message, ...(messages.get(chatId) ?? [])]);

  // Demo only: the partner answers after a moment.
  setTimeout(() => {
    const partner = PEOPLE[chatId];
    if (!partner) return;
    messages.set(chatId, [
      {
        id: `${chatId}_r_${Date.now()}`,
        chatId,
        senderId: partner.id,
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        createdAt: new Date().toISOString(),
      },
      ...(messages.get(chatId) ?? []),
    ]);
  }, 1800);

  return withMe(message, meId);
}

export const listChats = USE_MOCK ? mockListChats : realListChats;
export const listMessages = USE_MOCK ? mockListMessages : realListMessages;
export const sendMessage = USE_MOCK ? mockSendMessage : realSendMessage;