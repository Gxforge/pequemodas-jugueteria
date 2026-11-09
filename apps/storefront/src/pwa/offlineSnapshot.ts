import type {
  CategoryRow,
  PaginatedProductsResult,
  StoreRow,
  StoreSettingsRow
} from '@pequemodas/shared';

const SNAPSHOT_KEY = 'pequemodas.offline.snapshot.v2';

export interface StorefrontOfflineSnapshot {
  savedAt: string;
  storeBundle?: {
    store: StoreRow | null;
    settings: StoreSettingsRow | null;
  };
  categories?: CategoryRow[];
  catalogFirstPage?: PaginatedProductsResult;
}

export function readOfflineSnapshot(): StorefrontOfflineSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorefrontOfflineSnapshot;
    if (!parsed || typeof parsed.savedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeOfflineSnapshotPatch(
  patch: Partial<Omit<StorefrontOfflineSnapshot, 'savedAt'>>
): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = readOfflineSnapshot() ?? { savedAt: new Date().toISOString() };
    const next: StorefrontOfflineSnapshot = {
      ...prev,
      ...patch,
      savedAt: new Date().toISOString()
    };
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
  } catch {
    // Si localStorage está lleno o restringido, ignorar de forma segura
  }
}
