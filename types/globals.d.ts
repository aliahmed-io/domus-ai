/**
 * Global TypeScript type declarations for Domus
 */

// ─── Puter.js window global ───────────────────────────────────────────────────

interface PuterAuthApi {
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  getUser(): Promise<unknown>;
  isSignedIn(): Promise<boolean>;
}

interface PuterKvApi {
  get(key: string): Promise<unknown>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  list(pattern: string): Promise<unknown[]>;
}

interface PuterFsApi {
  write(path: string, content: Blob | string): Promise<unknown>;
  read(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
}

interface PuterAiApi {
  chat(
    prompt: string,
    options?: { model?: string; maxTokens?: number }
  ): Promise<unknown>;
}

interface PuterJs {
  auth: PuterAuthApi;
  kv: PuterKvApi;
  fs: PuterFsApi;
  ai: PuterAiApi;
}

declare global {
  interface Window {
    puter: PuterJs;
  }
}

export {};
