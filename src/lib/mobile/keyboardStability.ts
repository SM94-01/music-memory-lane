import { Capacitor } from "@capacitor/core";

let installed = false;

/**
 * Android input stability guard.
 * Do not listen to keyboard/focus/viewport events here: real devices can lock
 * the WebView when JS scrolls or mutates layout while the IME opens. Native
 * adjustResize plus normal browser focus handles text entry reliably.
 */
export async function installAndroidKeyboardStability() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  installed = true;
  document.documentElement.classList.add("capacitor-android");
}