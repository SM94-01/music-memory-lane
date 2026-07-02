// Browser-safe shim for @tanstack/react-start/server (SPA build only).
export function getRequest(): Request {
  throw new Error("[mobile] getRequest() called in Capacitor SPA build.");
}
export function getHeaders(): Record<string, string> {
  return {};
}
export function setHeader(): void {}
export function setResponseStatus(): void {}
