/**
 * lib/db/comissionamento/index.ts
 *
 * Barrel file que re-exporta todos os submódulos de comissionamento.
 * Mantém retrocompatibilidade com imports existentes de '@/lib/db/comissionamento'.
 */

export * from './representantes';
export * from './leads';
export * from './vinculos';
export * from './comissoes';
export * from './auditoria';
export * from './nf-rpa';
export * from './utils';
