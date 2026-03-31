/**
 * lib/db/index.ts
 *
 * Barrel file que re-exporta todos os submódulos de lib/db/.
 * Permite importar funções tanto de '@/lib/db' (retrocompatível) quanto de '@/lib/db/...'
 */

// Infraestrutura
export * from './connection';
export * from './query';
export * from './transaction';

// Domínio
export * from './entidade-crud';
export * from './entidade-status';
export * from './entidade-funcionarios';
export * from './user-creation';
export * from './admin-queries';

// Comissionamento
export * from './comissionamento';
