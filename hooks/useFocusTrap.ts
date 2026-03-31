'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onEscape?: () => void;
}

/**
 * Hook para manter o foco preso dentro de um modal/dialog.
 * - Tab/Shift-Tab circula entre elementos focáveis
 * - Escape chama onEscape (se fornecido)
 * - Restaura foco ao elemento anterior quando fecha
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onEscape,
}: UseFocusTrapOptions) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = ref.current;

    // Auto-focus primeiro elemento focável
    if (container) {
      const focusable =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key === 'Tab' && container) {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onEscape]);

  return ref;
}
