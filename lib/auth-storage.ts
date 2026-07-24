const STORAGE_KEY = 'theta_indigo_auth_remember';

export interface RememberedAuth {
  email: string;
  password: string;
  remember: boolean;
}

export function loadRememberedAuth(): RememberedAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedAuth;
    if (!parsed.remember) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRememberedAuth(data: RememberedAuth): void {
  if (typeof window === 'undefined') return;
  if (!data.remember) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearRememberedAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
