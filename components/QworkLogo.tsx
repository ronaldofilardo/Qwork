'use client';

import Image from 'next/image';
import { QWORK_BRANDING } from '@/lib/config/branding';

interface QworkLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'huge';
  showSlogan?: boolean;
  className?: string;
}

/**
 * Componente de logo reutilizável do QWork
 * Pode ser usado em qualquer parte da aplicação
 */
export default function QworkLogo({
  size = 'md',
  showSlogan = false,
  className = '',
}: QworkLogoProps) {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    huge: 'w-48 h-48',
  };

  const sloganSize = {
    sm: 'text-[8px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    '2xl': 'text-lg',
    huge: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${dimensions[size]} flex items-center justify-center`}>
        <Image
          src={QWORK_BRANDING.logo.base64}
          alt="QWork"
          width={48}
          height={48}
          className="w-full h-full object-contain"
        />
      </div>
      {showSlogan && (
        <span
          className={`${sloganSize[size]} text-gray-600 font-medium mt-1 text-center tracking-wide`}
          style={{ letterSpacing: '0.05em' }}
        >
          Avaliação de Saúde e Bem-Estar
        </span>
      )}
    </div>
  );
}

/**
 * Logo para uso em PDFs gerados via Puppeteer
 * Retorna HTML string pronto para ser injetado
 */
export function getLogoHTMLForPDF(options: {
  size?: 'small' | 'medium' | 'large';
  showSlogan?: boolean;
  opacity?: number;
  position?: 'center' | 'left' | 'right';
  className?: string;
}): string {
  const {
    size = 'medium',
    showSlogan = false,
    opacity = 1,
    position = 'center',
    className = '',
  } = options;

  const widths = {
    small: '60px',
    medium: '100px',
    large: '140px',
  };

  const sloganSizes = {
    small: '8px',
    medium: '10px',
    large: '12px',
  };

  const alignments = {
    center: 'center',
    left: 'flex-start',
    right: 'flex-end',
  };

  return `
    <div class="qwork-logo ${className}" style="
      display: flex;
      flex-direction: column;
      align-items: ${alignments[position]};
      justify-content: center;
      opacity: ${opacity};
      margin: 10px 0;
    ">
      <img 
        src="${QWORK_BRANDING.logo.base64}" 
        alt="QWork"
        style="
          width: ${widths[size]};
          height: auto;
          object-fit: contain;
        "
      />
      ${
        showSlogan
          ? `
        <p style="
          font-size: ${sloganSizes[size]};
          color: #4B5563;
          font-weight: 500;
          margin-top: 4px;
          text-align: ${position};
          letter-spacing: 0.05em;
        ">
          Avaliação de Saúde e Bem-Estar
        </p>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Logo como marca d'água para PDFs
 * Posicionamento absoluto centralizado
 */
export function getWatermarkLogoHTML(options: {
  width?: string;
  opacity?: number;
}): string {
  const { width = '400px', opacity = 0.1 } = options;

  return `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: -1;
      opacity: ${opacity};
      pointer-events: none;
    ">
      <img 
        src="${QWORK_BRANDING.logo.base64}" 
        alt="QWork Watermark"
        style="
          width: ${width};
          height: auto;
          object-fit: contain;
        "
      />
    </div>
  `;
}
