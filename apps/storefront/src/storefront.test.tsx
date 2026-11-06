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
});
