/**
 * QWork Color Palette
 * Preto como base, Verde do logo para ações
 */

export const QWORK_COLORS = {
  // Preto como cor base/institucional
  primary: '#000000',
  primaryHover: '#1a1a1a',
  primaryLight: '#2d2d2d',

  // Verde do logo para botões e ações
  accent: '#9ACD32',
  accentHover: '#7BA428',
  accentLight: '#B5E550',

  // Cinza para elementos secundários
  secondary: '#4A5568',
  secondaryHover: '#2D3748',

  // Estados
  success: '#9ACD32',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Neutros
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export type QWorkColors = typeof QWORK_COLORS;
