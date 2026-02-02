/**
 * QWork Typography Configuration
 */

export const QWORK_FONTS = {
  primary: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  heading: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'Courier New', monospace",
} as const;

export const QWORK_FONT_SIZES = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
} as const;

export type QWorkFonts = typeof QWORK_FONTS;
export type QWorkFontSizes = typeof QWORK_FONT_SIZES;
