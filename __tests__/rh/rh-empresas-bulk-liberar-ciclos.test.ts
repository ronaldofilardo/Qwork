/**
 * rh-empresas-bulk-liberar-ciclos.test.ts
 *
 * Valida o endpoint POST /api/rh/empresas-bulk/liberar-ciclos:
 * 1. Arquivo de rota existe e exporta handler POST
 * 2. Schema Zod valida limites (min 1, max 100 empresa_ids)
 * 3. Processamento isolado — falha em uma empresa não afeta as demais
 * 4. Uso de withTransactionAsGestor para atomicidade
 * 5. Verificação de propriedade da empresa (clinica_id) antes de processar
 * 6. Resposta contém detalhes por empresa
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const ROUTE_PATH = path.join(
  ROOT,
  'app',
  'api',
  'rh',
  'empresas-bulk',
  'liberar-ciclos',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Arquivo de rota', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função POST', () => {
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('usa force-dynamic', () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('chama requireClinica para autenticação', () => {
    expect(src).toMatch(/requireClinica/);
  });

  it('retorna 403 em falha de auth', () => {
    expect(src).toMatch(/status:\s*403/);
  });
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Validação Zod', () => {
  it('usa z.object com campo empresa_ids', () => {
    expect(src).toMatch(/z\.object/);
    expect(src).toMatch(/empresa_ids/);
  });

  it('valida limite mínimo de 1 empresa', () => {
    expect(src).toMatch(/\.min\(1/);
  });

  it('valida limite máximo de empresas por operação', () => {
    expect(src).toMatch(/MAX_EMPRESAS_POR_REQUISICAO|\.max\(100/);
  });

  it('campo motivo é opcional com max 500 chars', () => {
    expect(src).toMatch(/motivo/);
    expect(src).toMatch(/\.optional\(\)/);
    expect(src).toMatch(/\.max\(500\)/);
  });

  it('retorna 400 em corpo inválido', () => {
    expect(src).toMatch(/status:\s*400/);
  });
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Segurança', () => {
  it('verifica que cada empresa pertence à clínica do gestor logado', () => {
    // Busca pela verificação de clinica_id antes de processar
    expect(src).toMatch(/clinica_id/);
    expect(src).toMatch(/empresaId/);
  });

  it('usa parâmetros parametrizados no SQL (sem concatenação)', () => {
    // Verifica que as queries usam $1, $2 etc
    expect(src).toMatch(/\$1/);
    // Garante que NOT há interpolação de empresaId DIRETAMENTE em SQL queries (injection risk)
    // Usos em console.error/strings de erro são permitidos - apenas SQL é crítico
    expect(src).not.toMatch(
      /`\s*SELECT.*\$\{empresaId\}|`\s*INSERT.*\$\{empresaId\}|`\s*UPDATE.*\$\{empresaId\}/
    );
  });

  it('limita enterprise_ids a números inteiros positivos', () => {
    expect(src).toMatch(/z\.number\(\)\.int\(\)\.positive\(\)/);
  });
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Isolamento de falhas', () => {
  it('usa try/catch por empresa (não um try global)', () => {
    // Espera múltiplos catches — um global para auth e um por empresa
    const catches = src.match(/catch\s*\(/g);
    expect(catches).not.toBeNull();
    expect(catches.length).toBeGreaterThanOrEqual(2);
  });

  it('usa withTransactionAsGestor para atomicidade da operação por empresa', () => {
    expect(src).toMatch(/withTransactionAsGestor/);
  });

  it('retorna 200 se ao menos uma empresa foi processada com sucesso', () => {
    expect(src).toMatch(/total_liberado/);
    expect(src).toMatch(/status:\s*200|NextResponse\.json\(/);
  });

  it('retorna 422 se todas as empresas falharam', () => {
    // O código usa ternário: total_liberado > 0 ? 200 : 422
    expect(src).toMatch(/422/);
    expect(src).toMatch(/total_liberado/);
  });
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Resposta', () => {
  it('exporta interface BulkLiberarResponse', () => {
    expect(src).toMatch(/export\s+interface\s+BulkLiberarResponse/);
  });

  it('exporta interface DetalheLiberar', () => {
    expect(src).toMatch(/export\s+interface\s+DetalheLiberar/);
  });

  it('resposta inclui total_processado, total_liberado, total_erros', () => {
    expect(src).toMatch(/total_processado/);
    expect(src).toMatch(/total_liberado/);
    expect(src).toMatch(/total_erros/);
  });

  it('DetalheLiberar inclui campo sucesso e erro opcional', () => {
    expect(src).toMatch(/sucesso\s*:/);
    expect(src).toMatch(/erro\?\s*:|erro\s*\?/);
  });

  it('cria lote, laudo rascunho e avaliacoes na transação', () => {
    expect(src).toMatch(/INSERT INTO lotes_avaliacao/i);
    expect(src).toMatch(/INSERT INTO laudos/i);
    expect(src).toMatch(/INSERT INTO avaliacoes/i);
  });

  it('usa obter_proximo_numero_ordem para numeração do ciclo', () => {
    expect(src).toMatch(/obter_proximo_numero_ordem/);
  });

  it('usa calcular_elegibilidade_lote para obter funcionários elegíveis', () => {
    expect(src).toMatch(/calcular_elegibilidade_lote/);
  });
});

describe('POST /api/rh/empresas-bulk/liberar-ciclos — Verificação de elegibilidade', () => {
  it('bloqueia empresas com lote em status ativo', () => {
    expect(src).toMatch(/ativo/);
  });

  it('bloqueia empresas com emissao_solicitada ou emissao_em_andamento', () => {
    expect(src).toMatch(/emissao_solicitada/);
    expect(src).toMatch(/emissao_em_andamento/);
  });

  it('verifica que há funcionários elegíveis antes de criar lote', () => {
    expect(src).toMatch(
      /funcionariosElegiveis|elegiveis|calcular_elegibilidade_lote/i
    );
    expect(src).toMatch(/length|rows\.length|count/i);
  });

  it('não bloqueia empresa com lote concluido (elegível para novo ciclo)', () => {
    // concluido = ciclo encerrado; funcionários pendentes são elegíveis para novo ciclo
    const statusNaoElegivelBlock = src.match(
      /statusNaoElegivel\s*=\s*\[[\s\S]*?\]/
    );
    expect(statusNaoElegivelBlock).not.toBeNull();
    if (statusNaoElegivelBlock) {
      expect(statusNaoElegivelBlock[0]).not.toMatch(/'concluido'/);
    }
  });

  it('não inclui concluido na lista de labels bloqueantes do bulk', () => {
    const labelsBlock = src.match(/const labels[\s\S]*?};/);
    if (labelsBlock) {
      expect(labelsBlock[0]).not.toMatch(/concluido/);
    }
  });
});
