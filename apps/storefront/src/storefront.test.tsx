import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AnimatedBrandCloudsLogo,
  BrandLogo,
  DesignSystemShowcase
} from '@pequemodas/ui';
import { CartProvider, useCart } from './context/CartContext';
import {
  readOfflineSnapshot,
  writeOfflineSnapshotPatch
} from './pwa/offlineSnapshot';
import {
  peekCachedImageInRam,
  resolveImageById
} from './pwa/imageIdCache';

function CartHarness() {
  const { items, totalQuantity, estimatedTotalCup, addItem, updateQuantity } = useCart();
  return (
    <div>
      <span data-testid="qty">{totalQuantity}</span>
      <span data-testid="total">{estimatedTotalCup}</span>
      <button
        type="button"
        onClick={() =>
          addItem({
            productId: 'p1',
            productSlug: 'conjunto-sol',
            productName: 'Conjunto Sol',
            variantId: 'v1',
            variantName: 'Talla 2',
            attributes: { Talla: '2 años' },
            unitPriceCup: 1500,
            quantity: 2,
            maxQuantity: 3,
            thumbnailUrl: null
          })
        }
      >
        Add
      </button>
      {items[0] && (
        <button type="button" onClick={() => updateQuantity(items[0]!.key, 10)}>
          OverMax
        </button>
      )}
    </div>
  );
}

describe('Storefront UI & Carrito persistente', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renderiza la marca oficial PequeModas-Juguetería y la guía visual', () => {
    render(<BrandLogo />);
    expect(screen.getByText('PequeModas')).toBeInTheDocument();
    expect(screen.getByText('Juguetería')).toBeInTheDocument();

    render(<DesignSystemShowcase />);
    expect(screen.getByText(/Guía visual y demostración/i)).toBeInTheDocument();
  });

  it('gestiona cantidades, límite de stock y total en CUP en el carrito', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    );

    expect(screen.getByTestId('qty')).toHaveTextContent('0');
    await user.click(screen.getByText('Add'));
    expect(screen.getByTestId('qty')).toHaveTextContent('2');
    expect(screen.getByTestId('total')).toHaveTextContent('3000');

    // Respeta maxQuantity = 3 cuando el producto usa control por cantidades
    await user.click(screen.getByText('OverMax'));
    expect(screen.getByTestId('qty')).toHaveTextContent('3');
    expect(screen.getByTestId('total')).toHaveTextContent('4500');
  });

  it('persiste instantánea offline-first y renderiza capas separadas de logo y nubes', () => {
    writeOfflineSnapshotPatch({
      catalogFirstPage: { items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 }
    });
    const snap = readOfflineSnapshot();
    expect(snap).not.toBeNull();
    expect(snap?.catalogFirstPage?.total).toBe(0);

    const { container } = render(<AnimatedBrandCloudsLogo />);
    expect(container.querySelector('.pm-logo-front')).toBeTruthy();
    expect(container.querySelector('.pm-cloud-center')).toBeTruthy();
    expect(container.querySelector('.pm-cloud-left')).toBeTruthy();
    expect(container.querySelector('.pm-cloud-right')).toBeTruthy();
  });

  it('no vuelve a descargar una imagen si su ID no ha cambiado (caché por imageId)', async () => {
    let networkHits = 0;
    const fakeBlob = new Blob(['webp-binary'], { type: 'image/webp' });
    const origFetch = globalThis.fetch;
    const origCaches = window.caches;

    const fakeStore = new Map<string, Response>();
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        open: async () => ({
          match: async (k: string) => fakeStore.get(k)?.clone(),
          put: async (k: string, r: Response) => {
            fakeStore.set(k, r.clone());
          },
          keys: async () => [],
          delete: async () => true
        })
      }
    });
    globalThis.fetch = (async () => {
      networkHits += 1;
      return new Response(fakeBlob, { status: 200 });
    }) as typeof fetch;

    try {
      const firstUrl = await resolveImageById(
        'img-uuid-001',
        'thumb',
        'https://example.com/thumb1.webp'
      );
      const secondUrl = await resolveImageById(
        'img-uuid-001',
        'thumb',
        'https://example.com/thumb1.webp'
      );
      expect(firstUrl).toBe(secondUrl);
      expect(networkHits).toBe(1);
      expect(peekCachedImageInRam('img-uuid-001', 'thumb')).toBe(firstUrl);
    } finally {
      globalThis.fetch = origFetch;
      Object.defineProperty(window, 'caches', { configurable: true, value: origCaches });
    }
  });
});
