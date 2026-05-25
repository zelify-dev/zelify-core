const DEMO_PREFIX = "zelify_demo_";

export const DEMO_STORAGE_KEYS = {
  lim: `${DEMO_PREFIX}lim_state`,
  credit: `${DEMO_PREFIX}credit_state`,
  seeded: `${DEMO_PREFIX}lim_seeded`,
  lccInboundCustomers: `${DEMO_PREFIX}lcc_inbound_customers`,
} as const;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readDemoJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeDemoJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeDemoKey(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

export function resetLimDemoStorage(): void {
  removeDemoKey(DEMO_STORAGE_KEYS.lim);
  removeDemoKey(DEMO_STORAGE_KEYS.seeded);
}
