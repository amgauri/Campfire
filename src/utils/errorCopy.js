// Friendly copy for ApiError-like objects ({ code, status }). We deliberately do NOT
// show raw server messages in the UI. Copy is owned by the frontend.
export function getErrorCopy(error) {
  const code = error?.code;
  const status = error?.status ?? 0;

  if (code === 'NETWORK_ERROR') {
    return { icon: 'offline', title: "Can't connect", message: 'Check your internet connection and try again.' };
  }
  if (code === 'TIMEOUT') {
    return { icon: 'offline', title: 'That took too long', message: 'Campfire is slow right now. Try again in a moment.' };
  }
  if (status === 401 || status === 403) {
    return { icon: 'lock', title: "You don't have access", message: 'You may need to sign in again.' };
  }
  if (status === 404) {
    return { icon: 'error', title: 'Not found', message: "We couldn't find what you were looking for." };
  }
  if (status >= 500) {
    return { icon: 'error', title: 'Something broke on our end', message: "We're on it. Please try again shortly." };
  }
  return { icon: 'error', title: 'Something went wrong', message: 'Please try again.' };
}