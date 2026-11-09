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
  version: '3.1.3',
  appLabel: 'Aplicación Web (PWA)',
  summary:
    'Instalación guiada en iPhone y iPad con etiquetas Apple, icono de 180 px y guía paso a paso; Android conserva su instalación automática y el Panel Admin su menú hamburguesa.'
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
