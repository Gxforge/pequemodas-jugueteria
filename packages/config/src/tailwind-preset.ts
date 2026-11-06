import { DESIGN_TOKENS } from './design-tokens';

export const pequemodasTailwindPreset = {
  theme: {
    extend: {
      colors: {
        brand: DESIGN_TOKENS.colors.brand,
        sky: DESIGN_TOKENS.colors.sky,
        sunny: DESIGN_TOKENS.colors.sunny,
        mint: DESIGN_TOKENS.colors.mint,
        whatsapp: DESIGN_TOKENS.colors.whatsapp,
        cream: DESIGN_TOKENS.colors.surface.cream
      },
      fontFamily: {
        heading: [DESIGN_TOKENS.typography.fontHeading],
        sans: [DESIGN_TOKENS.typography.fontBody]
      },
      boxShadow: {
        card: DESIGN_TOKENS.shadows.card,
        elevated: DESIGN_TOKENS.shadows.elevated,
        brand: DESIGN_TOKENS.shadows.brandGlow
      }
    }
  }
};
