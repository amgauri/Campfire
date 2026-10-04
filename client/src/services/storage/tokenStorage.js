import * as SecureStore from 'expo-secure-store';

const KEY = 'campfire.auth.tokens';

export async function getStoredTokens() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function storeTokens({ accessToken, refreshToken }) {
  await SecureStore.setItemAsync(KEY, JSON.stringify({ accessToken, refreshToken }));
}

export async function clearStoredTokens() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // nothing to clear
  }
}