"use client";

/**
 * localStorage that cannot take the app down.
 *
 * Touching `localStorage` is not always safe: Safari throws a SecurityError
 * when site data is blocked (and historically in private browsing), Firefox
 * throws when `dom.storage.enabled` is false, and any browser throws on
 * `setItem` once the quota is full. An unguarded read in a provider that wraps
 * the whole tree therefore takes the entire application with it — which is what
 * happened here: the pre-paint bootstrap script was wrapped in try/catch for
 * exactly this reason, while the React path that mirrors it was not.
 *
 * A preference that cannot be persisted is a small loss. Losing the app over it
 * is not a trade worth making, so every access degrades to "no stored value".
 */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preferences stay live for this page; only persistence is lost.
  }
}
