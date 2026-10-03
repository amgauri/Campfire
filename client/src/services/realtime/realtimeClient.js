// STUB. The realtime transport (Socket.IO, WebSocket, ...) is a backend decision.
// This file defines the interface the app will code against. The in-memory
// implementation below lets hooks and UI be built and tested without a server.

export function createRealtimeClient() {
  const handlers = new Map();
  let connected = false;

  return {
    connect() {
      connected = true;
    },
    disconnect() {
      connected = false;
      handlers.clear();
    },
    isConnected() {
      return connected;
    },
    /** @returns {() => void} unsubscribe function */
    subscribe(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(handler);
      return () => handlers.get(event)?.delete(handler);
    },
    emit(event, payload) {
      // Stub: does not send anything. A real transport will replace this.
    },
    // Dev/mock helper: simulate a server push.
    _simulateIncoming(event, payload) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
  };
}

export const realtime = createRealtimeClient();