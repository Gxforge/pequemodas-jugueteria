export const BRAND_IDENTITY = {
  commercialName: 'PequeModas-Juguetería',
  ownerName: 'Katia',
  developerName: 'StudioLexair',
  currencyCode: 'CUP',
  currencySymbol: 'CUP',
  locale: 'es-CU'
} as const;

export const STORAGE_LIMITS = {
  productBucket: 'product-images',
  brandBucket: 'brand-assets',
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxImagesPerProduct: 8,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  fullImageMaxDimension: 1280,
  thumbnailMaxDimension: 400,
  webpQuality: 0.82
} as const;

export const PAGINATION_DEFAULTS = {
  storefrontPageSize: 12,
  adminPageSize: 15,
  relatedProductsLimit: 4
} as const;
