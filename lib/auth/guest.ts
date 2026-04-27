export const GUEST_MODE_STORAGE_KEY = "patternpal_guest_mode";

export function isGuestModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "1";
}

export function enableGuestMode(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, "1");
}

export function clearGuestMode(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
}
