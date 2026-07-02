import { Capacitor } from "@capacitor/core";

let installed = false;

export function installMobileInputDiagnostics() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  installed = true;

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        console.info("[TraXInput] pointerdown", target.type || target.tagName.toLowerCase());
      }
    },
    { capture: true, passive: true },
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        console.info("[TraXInput] focusin", target.type || target.tagName.toLowerCase());
      }
    },
    { capture: true, passive: true },
  );
}