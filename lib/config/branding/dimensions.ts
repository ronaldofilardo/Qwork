/**
 * QWork Logo Dimensions for Different Contexts
 * Dimensões em mm para PDFs
 */

export interface LogoDimensions {
  width: number | 'auto';
  height: number;
  x: 'center' | 'left' | 'right' | number;
  y: 'center' | 'top' | 'bottom' | 'after-signature' | number;
  opacity: number;
}

export const QWORK_LOGO_DIMENSIONS = {
  // Laudo Biopsicossocial - abaixo do Coordenador responsável técnico
  laudo: {
    width: 80,
    height: 30,
    x: 'center',
    y: 'after-signature',
    opacity: 1,
  } as LogoDimensions,

  // Relatório por Setor - marca d'água centralizada
  setor: {
    width: 120,
    height: 45,
    x: 'center',
    y: 'center',
    opacity: 0.1,
  } as LogoDimensions,

  // Relatório Individual - primeira página
  relatorioIndividual: {
    width: 100,
    height: 37.5,
    x: 'center',
    y: 'bottom',
    opacity: 0.15,
  } as LogoDimensions,

  // Relatório de Lote - primeira página
  relatorioLote: {
    width: 100,
    height: 37.5,
    x: 'center',
    y: 'bottom',
    opacity: 0.15,
  } as LogoDimensions,

  // Header de PDFs
  header: {
    height: 30,
    width: 'auto',
    x: 'center',
    y: 'top',
    opacity: 1,
  } as LogoDimensions,
} as const;

export const QWORK_SLOGAN = 'AVALIE. PREVINA. PROTEJA.';

export type QWorkLogoDimensions = typeof QWORK_LOGO_DIMENSIONS;
