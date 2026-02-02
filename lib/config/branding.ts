/**
 * QWork Branding Configuration
 * Nova identidade visual - Preto como base, Verde do logo para ações
 * Arquivo modularizado - importa de arquivos separados
 */

import { QWORK_LOGO_BASE64 } from './branding/logo';
import { QWORK_COLORS } from './branding/colors';
import { QWORK_FONTS, QWORK_FONT_SIZES } from './branding/fonts';
import { QWORK_LOGO_DIMENSIONS } from './branding/dimensions';

// Re-exporta para manter compatibilidade
export { QWORK_LOGO_BASE64 } from './branding/logo';
export { QWORK_COLORS } from './branding/colors';
export { QWORK_FONTS, QWORK_FONT_SIZES } from './branding/fonts';
export {
  QWORK_LOGO_DIMENSIONS,
  type LogoDimensions,
} from './branding/dimensions';

// Objeto principal para acesso unificado
export const QWORK_BRANDING = {
  colors: QWORK_COLORS,
  logo: {
    base64: QWORK_LOGO_BASE64,
    dimensions: QWORK_LOGO_DIMENSIONS,
  },
  fonts: QWORK_FONTS,
  fontSize: QWORK_FONT_SIZES,
};
