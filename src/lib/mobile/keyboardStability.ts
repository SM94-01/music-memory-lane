import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

let installed = false;
let keyboardInset = 0;

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

function isEditableElement(target: EventTarget | Element | null): target is HTMLElement {
  return target instanceof HTMLElement && target.matches(EDITABLE_SELECTOR);
}

function keepInputVisible(target: EventTarget | Element | null) {
  if (!isEditableElement(target)) return;

  window.setTimeout(() => {
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }, 120);
}

function setKeyboardOpen(open: boolean) {
  document.documentElement.classList.toggle("keyboard-open", open);
  document.body?.classList.toggle("keyboard-open", open);
  document.documentElement.style.setProperty("--keyboard-inset", open ? `${keyboardInset}px` : "0px");
}

/**
 * Android WebView can lock up when JavaScript repeatedly reacts to viewport
 * resize/scroll events while the IME opens. Keep this intentionally small:
 * native adjustPan owns the keyboard movement, while we only add a safe inset
 * and perform one non-animated scroll after focus.
 */
export async function installAndroidKeyboardStability() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  installed = true;
  document.documentElement.classList.add("capacitor-android");

  await Keyboard.addListener("keyboardWillShow", (info) => {
    keyboardInset = info.keyboardHeight || 0;
    setKeyboardOpen(true);
    keepInputVisible(document.activeElement);
  });

  await Keyboard.addListener("keyboardWillHide", () => {
    keyboardInset = 0;
    setKeyboardOpen(false);
  });

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
}