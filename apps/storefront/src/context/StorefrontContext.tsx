import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  buildCategoryTree,
  fetchActiveStoreAndSettings,
  fetchCategories,
  isSupabaseConfigured,
  type CategoryRow,
  type CategoryTreeNode,
  type StoreRow,
  type StoreSettingsRow
} from '@pequemodas/shared';
import {
  readOfflineSnapshot,
  writeOfflineSnapshotPatch
} from '../pwa/offlineSnapshot';

interface StorefrontContextValue {
  configured: boolean;
  isLoading: boolean;
  store: StoreRow | null;
  settings: StoreSettingsRow | null;
  categories: CategoryRow[];
  categoryTree: CategoryTreeNode[];
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const cachedSnap = readOfflineSnapshot();

  const storeQuery = useQuery({
    queryKey: ['public-store-settings'],
    queryFn: fetchActiveStoreAndSettings,
    initialData: cachedSnap?.storeBundle,
    enabled: configured
  });

  const categoriesQuery = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => fetchCategories({ includeArchived: false, onlyActive: true }),
    initialData: cachedSnap?.categories,
    enabled: configured
  });

  useEffect(() => {
    if (storeQuery.data && !storeQuery.isStale) {
      writeOfflineSnapshotPatch({ storeBundle: storeQuery.data });
    }
  }, [storeQuery.data, storeQuery.isStale]);

  useEffect(() => {
    if (categoriesQuery.data && !categoriesQuery.isStale) {
      writeOfflineSnapshotPatch({ categories: categoriesQuery.data });
    }
  }, [categoriesQuery.data, categoriesQuery.isStale]);

  const categories = categoriesQuery.data ?? [];
  const categoryTree = buildCategoryTree(categories);

  return (
    <StorefrontContext.Provider
      value={{
        configured,
        isLoading: storeQuery.isLoading || categoriesQuery.isLoading,
        store: storeQuery.data?.store ?? null,
        settings: storeQuery.data?.settings ?? null,
        categories,
        categoryTree
      }}
    >
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront debe usarse dentro de StorefrontProvider.');
  return ctx;
}
