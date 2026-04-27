import '@testing-library/jest-dom/vitest';

const testEnv = import.meta.env as unknown as Record<string, string>;
testEnv.VITE_SUPABASE_URL ||= 'http://test.local';
testEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||= 'anon-test-key';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
}
