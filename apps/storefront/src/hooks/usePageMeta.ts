import { useEffect } from 'react';
import { BRAND_IDENTITY } from '@pequemodas/config';

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} | ${BRAND_IDENTITY.commercialName}`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', description);
      }
    }
  }, [title, description]);
}
