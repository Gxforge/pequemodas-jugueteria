export const BRAND_IDENTITY = {
  commercialName: 'PequeModas-Juguetería',
  ownerName: 'Katia',
  developerName: 'StudioLexair',
  currencyCode: 'CUP',
  currencySymbol: 'CUP',
  organisms: 'Storefront + Admin',
  locale: 'es-CU'
} as const;

export const APP_RELEASE = {
  version: '3.1.2',
  appLabel: 'Aplicación Web (PWA)',
  summary:
    'Panel Admin móvil con botón de hamburguesa y menú lateral desplegable, sin barra inferior de 5 botones; conserva CUP/USD y la corrección de caché PWA.'
} as const;

export const STORAGE_LIMITS = {
  productBucket: 'product-images',
  brandBucket: 'brand-assets',
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxImagesPerProduct: 8,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  fullImageMaxDimension: 1800,
  thumbnailMaxDimension: 640,
  webpQuality: 0.93,
  thumbnailQuality: 0.9
} as const;

export const PAGINATION_DEFAULTS = {
  storefrontPageSize: 12,
  adminPageSize: 15,
  relatedProductsLimit: 4
} as const;
