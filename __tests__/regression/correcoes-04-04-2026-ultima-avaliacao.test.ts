/**
 * correcoes-04-04-2026-ultima-avaliacao.test.ts
 *
 * Testes para as correções aplicadas em 04/04/2026:
 *
 * 1. FlowStepsExplainer — label "Liberação em massa de Ciclos de Coletas Avaliativas"
 * 2. API /api/entidade/funcionarios — mismatch corrigido: ultimo_lote_numero usa mesmo
 *    filtro/ordem de ultima_avaliacao_status (NOT IN inativada), adicionados campos
 *    lote_ativo_numero e avaliacao_ativa_status
 * 3. API /api/rh/funcionarios — adicionados campos lote_ativo_numero e avaliacao_ativa_status
 * 4. types.ts — tipo Funcionario expandido com novos campos e status corrigidos
 * 5. FuncionarioRow — UltimaAvaliacaoCell redesenhada com prioridade P1→P4
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ─────────────────────────────────────────────────────────────
// 1. FlowStepsExplainer — label atualizado
// ─────────────────────────────────────────────────────────────

describe('1. FlowStepsExplainer — label "Liberação em massa de Ciclos de Coletas Avaliativas"', () => {
  const filePath = path.join(ROOT, 'components', 'FlowStepsExplainer.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve conter o label completo "Liberação em massa de Ciclos de Coletas Avaliativas"', () => {
    expect(src).toContain(
      'Liberação em massa de Ciclos de Coletas Avaliativas'
    );
  });

  it('NÃO deve conter o label antigo "Liberação em massa:" sem o complemento', () => {
    // Garante que o label foi atualizado e não há versão incompleta
    expect(src).not.toMatch(/Liberação em massa:<\/strong> Na tabela/);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. API /api/entidade/funcionarios — mismatch corrigido + campos ativos
// ─────────────────────────────────────────────────────────────

describe('2. GET /api/entidade/funcionarios — mismatch ultimo_lote_numero corrigido', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'entidade',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('ultimo_lote_numero deve usar NOT IN (inativada) — mesmo critério de ultima_avaliacao_status', () => {
    // O alias "ultimo_lote_numero" deve estar precedido de filtro NOT IN inativada
    const loteNumIdx = src.indexOf('as ultimo_lote_numero');
    expect(loteNumIdx).toBeGreaterThan(-1);
    // Extrai contexto da subquery (até 600 chars antes do alias)
    const ctx = src.substring(Math.max(0, loteNumIdx - 600), loteNumIdx);
    expect(ctx).toMatch(/NOT IN\s*\(\s*'inativada'\s*\)/i);
  });

  it('ultimo_lote_numero NÃO deve usar IN (concluida, inativada) — filtra inativada', () => {
    const loteNumIdx = src.indexOf('as ultimo_lote_numero');
    const ctx = src.substring(Math.max(0, loteNumIdx - 600), loteNumIdx);
    // Não deve ter o padrão antigo com inativada inclusa no filtro de status
    expect(ctx).not.toMatch(
      /status\s+IN\s*\(\s*'concluida'\s*,\s*'inativada'\s*\)/i
    );
  });

  it('deve conter subquery lote_ativo_numero', () => {
    expect(src).toMatch(/as\s+lote_ativo_numero/i);
  });

  it('lote_ativo_numero deve filtrar por status IN (iniciada, em_andamento)', () => {
    const loteAtivoIdx = src.indexOf('as lote_ativo_numero');
    expect(loteAtivoIdx).toBeGreaterThan(-1);
    const ctx = src.substring(Math.max(0, loteAtivoIdx - 500), loteAtivoIdx);
    expect(ctx).toMatch(
      /status\s+IN\s*\(\s*'iniciada'\s*,\s*'em_andamento'\s*\)/i
    );
  });

  it('deve conter subquery avaliacao_ativa_status', () => {
    expect(src).toMatch(/as\s+avaliacao_ativa_status/i);
  });

  it('avaliacao_ativa_status deve filtrar por entidade_id = $1', () => {
    const idx = src.indexOf('as avaliacao_ativa_status');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.substring(Math.max(0, idx - 500), idx);
    expect(ctx).toMatch(/entidade_id\s*=\s*\$1/i);
  });

  it('ultimo_lote_numero deve selecionar l.id (não numero_ordem)', () => {
    const idx = src.indexOf('as ultimo_lote_numero');
    const ctx = src.substring(Math.max(0, idx - 400), idx);
    expect(ctx).toMatch(/SELECT\s+l\.id/i);
    expect(ctx).not.toMatch(/numero_ordem/);
  });

  it('lote_ativo_numero deve selecionar l_at.id (não numero_ordem)', () => {
    const idx = src.indexOf('as lote_ativo_numero');
    const ctx = src.substring(Math.max(0, idx - 400), idx);
    expect(ctx).toMatch(/SELECT\s+l_at\.id/i);
    expect(ctx).not.toMatch(/numero_ordem/);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. API /api/rh/funcionarios — campos ativos adicionados
// ─────────────────────────────────────────────────────────────

describe('3. GET /api/rh/funcionarios — campos lote_ativo_numero e avaliacao_ativa_status', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve conter subquery lote_ativo_numero filtrada por empresa_id', () => {
    expect(src).toMatch(/as\s+lote_ativo_numero/i);
    const idx = src.indexOf('as lote_ativo_numero');
    const ctx = src.substring(Math.max(0, idx - 500), idx);
    expect(ctx).toMatch(/empresa_id\s*=\s*\$1/i);
  });

  it('lote_ativo_numero deve filtrar por status IN (iniciada, em_andamento)', () => {
    const idx = src.indexOf('as lote_ativo_numero');
    const ctx = src.substring(Math.max(0, idx - 500), idx);
    expect(ctx).toMatch(
      /status\s+IN\s*\(\s*'iniciada'\s*,\s*'em_andamento'\s*\)/i
    );
  });

  it('deve conter subquery avaliacao_ativa_status filtrada por empresa_id', () => {
    expect(src).toMatch(/as\s+avaliacao_ativa_status/i);
    const idx = src.indexOf('as avaliacao_ativa_status');
    const ctx = src.substring(Math.max(0, idx - 500), idx);
    expect(ctx).toMatch(/empresa_id\s*=\s*\$1/i);
  });

  it('ultimo_lote_numero deve selecionar l.id (não numero_ordem)', () => {
    const idx = src.indexOf('as ultimo_lote_numero');
    const ctx = src.substring(Math.max(0, idx - 400), idx);
    expect(ctx).toMatch(/SELECT\s+l\.id/i);
    expect(ctx).not.toMatch(/numero_ordem/);
  });

  it('lote_ativo_numero deve selecionar l_at.id (não numero_ordem)', () => {
    const idx = src.indexOf('as lote_ativo_numero');
    const ctx = src.substring(Math.max(0, idx - 400), idx);
    expect(ctx).toMatch(/SELECT\s+l_at\.id/i);
    expect(ctx).not.toMatch(/numero_ordem/);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. types.ts — tipo Funcionario expandido
// ─────────────────────────────────────────────────────────────

describe('4. types.ts — interface Funcionario com novos campos', () => {
  const filePath = path.join(ROOT, 'components', 'funcionarios', 'types.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve conter campo lote_ativo_numero opcional', () => {
    expect(src).toContain('lote_ativo_numero');
  });

  it('deve conter campo avaliacao_ativa_status opcional', () => {
    expect(src).toContain('avaliacao_ativa_status');
  });

  it('ultima_avaliacao_status deve incluir "concluida" (feminino) além de "concluido"', () => {
    // Ambas as formas devem estar no tipo union
    expect(src).toMatch(/'concluida'.*'concluido'|'concluido'.*'concluida'/s);
  });

  it('ultima_avaliacao_status deve incluir "iniciada" e "em_andamento"', () => {
    const idx = src.indexOf('ultima_avaliacao_status');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.substring(idx, idx + 200);
    expect(ctx).toContain("'iniciada'");
    expect(ctx).toContain("'em_andamento'");
  });
});

// ─────────────────────────────────────────────────────────────
// 5. FuncionarioRow — UltimaAvaliacaoCell redesenhada
// ─────────────────────────────────────────────────────────────

describe('5. FuncionarioRow — UltimaAvaliacaoCell com lógica de prioridade P1→P4', () => {
  // Arquivo ativo: components/funcionarios/components/FuncionarioRow.tsx
  // (importado por FuncionariosSection.tsx via ./components/FuncionarioRow)
  const filePath = path.join(
    ROOT,
    'components',
    'funcionarios',
    'components',
    'FuncionarioRow.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve verificar avaliacao_ativa_status como P1 (prioridade máxima)', () => {
    expect(src).toContain('avaliacao_ativa_status');
    // O bloco condicional "if (funcionario.avaliacao_ativa_status)" deve aparecer
    // ANTES de "if (isConcluida)" no código — P1 antes de P2
    const p1Idx = src.indexOf('if (funcionario.avaliacao_ativa_status)');
    const p2Idx = src.indexOf('if (isConcluida)');
    expect(p1Idx).toBeGreaterThan(-1);
    expect(p2Idx).toBeGreaterThan(-1);
    expect(p1Idx).toBeLessThan(p2Idx); // bloco P1 precede bloco P2
  });

  it('deve exibir badge "Em andamento" para avaliação ativa', () => {
    expect(src).toContain('Em andamento');
  });

  it('deve verificar TANTO "concluida" quanto "concluido" (feminino e masculino)', () => {
    // isConcluida deve checar ambas as formas
    const isConcluidaIdx = src.indexOf('isConcluida');
    const ctx = src.substring(isConcluidaIdx, isConcluidaIdx + 200);
    expect(ctx).toContain("'concluida'");
    expect(ctx).toContain("'concluido'");
  });

  it('deve exibir badge "Concluída" em verde para avaliação concluída', () => {
    expect(src).toContain('Concluída');
    expect(src).toContain('bg-green-100');
  });

  it('deve exibir badge "Inativada" para P3 (sem avaliação ativa nem concluída)', () => {
    expect(src).toContain('Inativada');
    expect(src).toContain('bg-gray-100');
  });

  it('deve exibir "Nunca avaliado" quando hasAnything é false (P4)', () => {
    expect(src).toContain('Nunca avaliado');
  });

  it('NÃO deve usar (funcionario as any) para campos de avaliação', () => {
    // Garante remoção dos casts inseguros
    expect(src).not.toMatch(
      /\(funcionario as any\)\.(ultima_avaliacao|avaliacoes)/
    );
  });

  it('deve referenciar lote_ativo_numero para exibir o lote ativo', () => {
    expect(src).toContain('lote_ativo_numero');
  });

  it('badges de elegibilidade (<12 meses e >12 meses) devem estar presentes', () => {
    expect(src).toContain('Válida');
    expect(src).toContain('Elegível');
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Alterações de 10/04/2026 — Formatação de dados
// ─────────────────────────────────────────────────────────────

describe('6. Formatação de dados — ImportacaoFlowGuide e FlowStepsExplainer (10/04/2026)', () => {
  describe('ImportacaoFlowGuide', () => {
    const filePath = path.join(ROOT, 'components', 'ImportacaoFlowGuide.tsx');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(filePath, 'utf-8');
    });

    it('deve ter propriedade isClinica com default true', () => {
      expect(src).toContain('isClinica');
      expect(src).toMatch(/isClinica\s*=\s*true/);
    });

    it('deve exibir "Colunas obrigatórias e formatação de dados" no divisor', () => {
      expect(src).toContain('Colunas obrigatórias e formatação de dados');
    });

    it('deve conter informação de Data de Nascimento com formato dd/mm/aaaa', () => {
      expect(src).toContain('Data de Nascimento');
      expect(src).toContain('dd/mm/aaaa');
      // Texto pode estar dividido em linhas JSX
      expect(src).toContain('evitar perda por formata');
      expect(src).toContain('do Excel');
    });

    it('deve conter informação de CPF com 11 dígitos', () => {
      expect(src).toContain('deve conter apenas 11 dígitos');
      expect(src).toContain('sem pontos ou hífen');
    });

    it('deve conter informação sobre Função para determinar versão do questionário', () => {
      expect(src).toContain('Função');
      // Texto pode estar dividido em linhas JSX
      expect(src).toContain('importante para determinar a vers');
      expect(src).toContain('question');
      expect(src).toContain('nivel_cargo');
    });

    it('deve condicionar exibição de CNPJ com isClinica para clínica apenas', () => {
      expect(src).toMatch(/\{isClinica\s*&&\s*\(/);
      expect(src).toContain('<strong>Nome da Empresa:</strong>');
    });
  });

  describe('FlowStepsExplainer — blocos condicionais isClinica', () => {
    const filePath = path.join(ROOT, 'components', 'FlowStepsExplainer.tsx');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(filePath, 'utf-8');
    });

    it('deve ter bloco {isClinica && ( com aviso de cobrança por lote', () => {
      const clinicaBlockIdx = src.indexOf('{isClinica && (');
      expect(clinicaBlockIdx).toBeGreaterThan(-1);
      const ctx = src.substring(clinicaBlockIdx, clinicaBlockIdx + 2000);
      expect(ctx).toContain('cobrado por lote');
    });

    it('deve ter bloco {!isClinica && ( com aviso de cobrança', () => {
      const entidadeBlockIdx = src.indexOf('{!isClinica && (');
      expect(entidadeBlockIdx).toBeGreaterThan(-1);
      const ctx = src.substring(entidadeBlockIdx, entidadeBlockIdx + 1000);
      expect(ctx).toContain('cobrado por lote');
    });

    it('bloco clínica deve conter Liberação em massa de Ciclos', () => {
      const clinicaBlockIdx = src.indexOf('{isClinica && (');
      const ctx = src.substring(clinicaBlockIdx, clinicaBlockIdx + 2000);
      expect(ctx).toContain('Liberação em massa de Ciclos');
    });
  });

  describe('Páginas de importação — uso de props', () => {
    it('app/rh/importacao/page.tsx deve passar isClinica={true}', () => {
      const filePath = path.join(ROOT, 'app', 'rh', 'importacao', 'page.tsx');
      const src = fs.readFileSync(filePath, 'utf-8');
      expect(src).toContain('ImportacaoFlowGuide isClinica={true}');
    });

    it('app/entidade/importacao/page.tsx deve passar isClinica={false}', () => {
      const filePath = path.join(
        ROOT,
        'app',
        'entidade',
        'importacao',
        'page.tsx'
      );
      const src = fs.readFileSync(filePath, 'utf-8');
      expect(src).toContain('ImportacaoFlowGuide isClinica={false}');
    });
  });
});
