/**
 * @file __tests__/api/pendencias/pendencias-lote-inativos.test.ts
 *
 * Valida que /api/pendencias/lote inclui funcionários INATIVOS com
 * indice_avaliacao = 0 (nunca avaliados) como CRÍTICA:
 *
 * 1. SQL do RH inclui (fc.ativo = false AND fc.indice_avaliacao = 0) no WHERE
 * 2. SQL do RH atribui prioridade CRITICA a funcionários com indice=0
 *    independente de fc.ativo
 * 3. SQL da entidade espelha o mesmo comportamento
 * 4. Estrutura básica: rota exporta GET, usa force-dynamic
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const ROUTE_PATH = path.join(ROOT, 'app', 'api', 'pendencias', 'lote', 'route.ts');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('GET /api/pendencias/lote — Estrutura básica', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('usa force-dynamic', () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('retorna 403 para perfis não autorizados', () => {
    expect(src).toMatch(/status:\s*403/);
  });

  it('retorna situacao COM_PENDENCIAS ou SEM_PENDENCIAS', () => {
    expect(src).toMatch(/COM_PENDENCIAS/);
    expect(src).toMatch(/SEM_PENDENCIAS|sem_lote/i);
  });
});

describe('GET /api/pendencias/lote — RH: inativos nunca avaliados', () => {
  it('WHERE inclui inativos com indice_avaliacao=0 (fc.ativo = false AND indice=0)', () => {
    // A cláusula WHERE deve aceitar fc.ativo = false para nunca avaliados
    expect(src).toMatch(/fc\.ativo\s*=\s*false\s+AND\s+fc\.indice_avaliacao\s*=\s*0/i);
  });

  it('prioridade CRITICA não restringe fc.ativo=true para NUNCA_AVALIADO', () => {
    // Garante que a condição CRITICA para indice=0 não exige fc.ativo=true
    // O padrão errado seria: fc.indice_avaliacao = 0 AND fc.ativo = true
    // O padrão correto: fc.indice_avaliacao = 0 (sem AND fc.ativo)
    // Verifica que após indice_avaliacao = 0 não vem AND fc.ativo = true na linha de prioridade
    const criticaBlock = src.match(
      /WHEN NOT EXISTS[\s\S]*?THEN 'CRITICA'/g
    );
    expect(criticaBlock).not.toBeNull();
    // A condição CRITICA para NUNCA_AVALIADO não deve ter "AND fc.ativo = true" após indice=0
    if (criticaBlock) {
      const hasBadPattern = criticaBlock.some(block =>
        /indice_avaliacao\s*=\s*0\s+AND\s+fc\.ativo\s*=\s*true/i.test(block)
      );
      expect(hasBadPattern).toBe(false);
    }
  });

  it('classificação NUNCA_AVALIADO está presente', () => {
    expect(src).toMatch(/NUNCA_AVALIADO/);
  });

  it('classificação INATIVADO_NO_LOTE está presente e é CRITICA', () => {
    expect(src).toMatch(/INATIVADO_NO_LOTE/);
    // INATIVADO_NO_LOTE deve gerar prioridade CRITICA
    const inativadoBlock = src.match(/INATIVADO_NO_LOTE[\s\S]*?CRITICA/);
    expect(inativadoBlock).not.toBeNull();
  });

  it('usa funcionarios_clinicas (fc) para modo RH', () => {
    expect(src).toMatch(/funcionarios_clinicas\s+fc/i);
  });

  it('usa clinica_id = \$2 no filtro RH', () => {
    expect(src).toMatch(/clinica_id\s*=\s*\$2/);
  });
});

describe('GET /api/pendencias/lote — Entidade: inativos nunca avaliados', () => {
  it('WHERE da entidade inclui inativos com indice=0 (fe.ativo = false AND indice=0)', () => {
    expect(src).toMatch(/fe\.ativo\s*=\s*false\s+AND\s+fe\.indice_avaliacao\s*=\s*0/i);
  });

  it('prioridade CRITICA da entidade não restringe fe.ativo=true para NUNCA_AVALIADO', () => {
    const criticaBlocks = src.match(
      /WHEN NOT EXISTS[\s\S]*?THEN 'CRITICA'/g
    );
    if (criticaBlocks) {
      const hasBadPattern = criticaBlocks.some(block =>
        /indice_avaliacao\s*=\s*0\s+AND\s+fe\.ativo\s*=\s*true/i.test(block)
      );
      expect(hasBadPattern).toBe(false);
    }
  });

  it('usa funcionarios_entidades (fe) para modo entidade', () => {
    expect(src).toMatch(/funcionarios_entidades\s+fe/i);
  });
});

describe('GET /api/pendencias/lote — Consistência de comportamento RH e entidade', () => {
  it('ambos os modos têm SUBQUERIES_INATIVACAO', () => {
    expect(src).toMatch(/SUBQUERIES_INATIVACAO/);
  });

  it('buildResponse é reutilizado por ambos os modos', () => {
    const matches = src.match(/buildResponse\(/g);
    expect(matches).not.toBeNull();
    expect((matches ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('lote de referência é o mais recente com liberado_em IS NOT NULL', () => {
    expect(src).toMatch(/liberado_em\s+IS\s+NOT\s+NULL/i);
  });
});
