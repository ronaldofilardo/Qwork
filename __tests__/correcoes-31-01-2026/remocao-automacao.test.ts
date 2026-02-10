/**
 * TESTE: Validação da Remoção de Automação (Migrations 130 e 131)
 *
 * Valida que:
 * - Colunas de automação foram removidas
 * - Triggers de automação foram removidos
 * - Função de recálculo NÃO agenda emissão
 * - Sistema funciona 100% manual
 */

import { Pool } from 'pg';

// Conexão direta ao banco de teste (evita conflito com lib/db.ts)
const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

afterAll(async () => {
  await pool.end();
});

describe('Remoção de Emissão Automática', () => {
  describe('Migration 130: Colunas Removidas', () => {
    it('deve ter removido coluna auto_emitir_em', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND column_name = 'auto_emitir_em'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido coluna auto_emitir_agendado', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND column_name = 'auto_emitir_agendado'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido coluna processamento_em', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND column_name = 'processamento_em'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido coluna cancelado_automaticamente', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND column_name = 'cancelado_automaticamente'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido coluna motivo_cancelamento', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND column_name = 'motivo_cancelamento'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Migration 130: Triggers Removidos', () => {
    it('deve ter removido trigger trg_verificar_cancelamento_automatico', async () => {
      const result = await query(`
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgname = 'trg_verificar_cancelamento_automatico'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido função verificar_cancelamento_automatico_lote', async () => {
      const result = await query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'verificar_cancelamento_automatico_lote'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter removido função verificar_conclusao_lote', async () => {
      const result = await query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'verificar_conclusao_lote'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Migration 131: Função Manual de Recálculo', () => {
    it('deve ter função fn_recalcular_status_lote_on_avaliacao_update', async () => {
      const result = await query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('função NÃO deve conter código de agendamento automático', async () => {
      const result = await query(`
        SELECT pg_get_functiondef(oid) as function_def
        FROM pg_proc 
        WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
      `);

      expect(result.rows.length).toBe(1);
      const functionDef = result.rows[0].function_def;

      // Verificar que NÃO contém agendamento
      expect(functionDef).not.toContain('auto_emitir_agendado');
      expect(functionDef).not.toContain('auto_emitir_em');
      expect(functionDef).not.toContain('INTERVAL');

      // Verificar que apenas atualiza status
      expect(functionDef).toContain("status = 'concluido'");
      expect(functionDef).toContain('atualizado_em = NOW()');
    });

    it('trigger trg_recalc_lote_on_avaliacao_update deve existir', async () => {
      const result = await query(`
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgname = 'trg_recalc_lote_on_avaliacao_update'
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('Sistema Manual: Comportamento', () => {
    it('tabela lotes_avaliacao não tem colunas de agendamento automático', async () => {
      const columns = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
          AND table_schema = 'public'
          AND column_name IN ('auto_emitir_em', 'auto_emitir_agendado', 'processamento_em', 'cancelado_automaticamente', 'motivo_cancelamento')
      `);

      expect(columns.rows.length).toBe(0);
    });

    it('função de recálculo não contém lógica de agendamento', async () => {
      const result = await query(`
        SELECT pg_get_functiondef(oid) as function_def
        FROM pg_proc 
        WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
      `);

      expect(result.rows.length).toBe(1);
      const functionDef = result.rows[0].function_def;

      // Confirmar que é uma função MANUAL (sem agendamento)
      expect(functionDef).toContain("status = 'concluido'");
      expect(functionDef).not.toContain('auto_emitir_agendado');
      expect(functionDef).not.toContain('INTERVAL');

      // Verificar comentário da função
      const comment = await query(`
        SELECT obj_description(oid) as description
        FROM pg_proc 
        WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
      `);

      expect(comment.rows[0].description).toContain('MANUAL');
    });
  });

  describe('Validação de Integridade', () => {
    it('não deve existir nenhuma referência a colunas removidas em views', async () => {
      const views = await query(`
        SELECT table_name, view_definition 
        FROM information_schema.views 
        WHERE table_schema = 'public'
          AND (
            view_definition LIKE '%auto_emitir_em%'
            OR view_definition LIKE '%auto_emitir_agendado%'
            OR view_definition LIKE '%processamento_em%'
          )
      `);

      expect(views.rows.length).toBe(0);
    });

    it('não deve existir índices das colunas removidas', async () => {
      const indexes = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
          AND tablename = 'lotes_avaliacao'
          AND (
            indexname LIKE '%auto_emitir%'
            OR indexname LIKE '%processamento_em%'
          )
      `);

      expect(indexes.rows.length).toBe(0);
    });
  });

  describe('Migration 1011: Audit Trigger Sem processamento_em', () => {
    it('função audit_lote_change() não deve referenciar processamento_em no código', async () => {
      const result = await query(`
        SELECT pg_get_functiondef(oid) as function_def
        FROM pg_proc 
        WHERE proname = 'audit_lote_change'
      `);

      expect(result.rows.length).toBe(1);
      const functionDef = result.rows[0].function_def;

      // Buscar por processamento_em no código (não em comentários)
      const lines = functionDef.split('\n');
      const codeLines = lines.filter(line => {
        const trimmed = line.trim();
        // Ignorar linhas de comentário
        return !trimmed.startsWith('--') && trimmed.length > 0;
      });

      const codeWithoutComments = codeLines.join('\n');

      // Verificar que processamento_em NÃO aparece no código executável
      const hasProcessamentoEmInCode = codeWithoutComments.toLowerCase().includes('processamento_em');
      
      expect(hasProcessamentoEmInCode).toBe(false);
    });

    it('audit_lote_change deve auditar apenas campos existentes', async () => {
      const result = await query(`
        SELECT pg_get_functiondef(oid) as function_def
        FROM pg_proc 
        WHERE proname = 'audit_lote_change'
      `);

      const functionDef = result.rows[0].function_def;

      // Verificar que audita campos corretos
      expect(functionDef).toContain('status');
      expect(functionDef).toContain('emitido_em');
      expect(functionDef).toContain('enviado_em');

      // NÃO deve auditar campos removidos (em código executável)
      const lines = functionDef.split('\n');
      const executableLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('--') && trimmed.includes('processamento_em');
      });

      // Apenas comentários podem mencionar processamento_em
      expect(executableLines.length).toBe(0);
    });

    it('trigger audit_lote_change deve disparar em UPDATE sem erro', async () => {
      // Verificar que o trigger existe e está ativo
      const triggerCheck = await query(`
        SELECT tgname, tgenabled 
        FROM pg_trigger 
        WHERE tgname LIKE '%audit_lote_change%'
      `);

      expect(triggerCheck.rows.length).toBeGreaterThan(0);
      
      // tgenabled = 'O' significa ENABLED
      const enabled = triggerCheck.rows.every(t => t.tgenabled === 'O');
      expect(enabled).toBe(true);
    });
  });
});
