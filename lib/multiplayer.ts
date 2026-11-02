// Shared editing stays off while the workshop has no account or room permissions.
export function useMultiplayerSync() {
  return { connected: false };
}
