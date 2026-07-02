// Browser-safe shim for @tanstack/react-start used only in the Capacitor
// SPA build. Server-only APIs become no-ops or client-side callable stubs;
// createServerFn calls throw so mobile code paths that hit them fail loudly
// instead of silently doing nothing.

function chainable() {
  const api: Record<string, (...args: unknown[]) => unknown> = {};
  const fn = () => api;
  api.middleware = () => api;
  api.inputValidator = () => api;
  api.validator = () => api;
  api.type = () => api;
  api.client = () => api;
  api.server = () => api;
  api.handler = () => {
    return async () => {
      throw new Error(
        "[mobile] Server function invoked in Capacitor SPA build. Wire a REST/edge alternative for mobile.",
      );
    };
  };
  return fn();
}

export function createServerFn(_opts?: unknown) {
  return chainable();
}

export function createMiddleware(_opts?: unknown) {
  return chainable();
}

export function createStart(_factory?: unknown) {
  return { startInstance: {} };
}

export function useServerFn<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}
