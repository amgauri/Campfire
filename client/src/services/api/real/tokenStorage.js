import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'campfire.refreshToken';
let webRefreshToken = null;

export function getRefreshToken() {
  return Platform.OS === 'web'
    ? Promise.resolve(webRefreshToken)
    : SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  if (Platform.OS === 'web') {
    webRefreshToken = token;
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export function deleteRefreshToken() {
  if (Platform.OS === 'web') {
    webRefreshToken = null;
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
