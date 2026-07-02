import { Capacitor } from "@capacitor/core";

let installed = false;

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

function isEditableElement(target: EventTarget | Element | null): target is HTMLElement {
  return target instanceof HTMLElement && target.matches(EDITABLE_SELECTOR);
}

function keepInputVisible(target: EventTarget | Element | null) {
  if (!isEditableElement(target)) return;

  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, 180);

  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  }, 520);
}

function setKeyboardOpen(open: boolean) {
  document.documentElement.classList.toggle("keyboard-open", open);
  document.body?.classList.toggle("keyboard-open", open);
}

/**
 * Android WebView can get stuck when the soft keyboard opens during a dynamic
 * viewport resize. This native-only guard keeps focus on the tapped field and
 * scrolls it into a stable position without changing the visual UI.
 */
export function installAndroidKeyboardStability() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  installed = true;
  document.documentElement.classList.add("capacitor-android");

  window.addEventListener(
    "pointerup",
    (event) => {
      if (!isEditableElement(event.target)) return;
      event.target.focus({ preventScroll: true });
      setKeyboardOpen(true);
      keepInputVisible(event.target);
    },
    { passive: true, capture: true },
  );

  window.addEventListener(
    "focusin",
    (event) => {
      if (!isEditableElement(event.target)) return;
      setKeyboardOpen(true);
      keepInputVisible(event.target);
    },
    true,
  );

  window.addEventListener(
    "focusout",
    () => {
      window.setTimeout(() => {
        setKeyboardOpen(isEditableElement(document.activeElement));
      }, 120);
    },
    true,
  );

  const onViewportChange = () => {
    const activeElement = document.activeElement;
    if (isEditableElement(activeElement)) {
      setKeyboardOpen(true);
      keepInputVisible(activeElement);
    }
  };

  window.visualViewport?.addEventListener("resize", onViewportChange, { passive: true });
  window.visualViewport?.addEventListener("scroll", onViewportChange, { passive: true });
  window.addEventListener("resize", onViewportChange, { passive: true });
}