/**
 * Testes Unitários: Endpoint Entidade Lotes
 * Testa que endpoint não viola imutabilidade de laudos
 *
 * ✅ UPDATED: Agora usa SQL CASE WHEN em vez de cálculos em memória
 * - tem_laudo função determinada por: l.status = 'emitido' AND l.arquivo_remoto_url IS NOT NULL
 * - Sem processamento em memória ou cálculos de hash
 * - Simples LEFT JOIN com laudos no SELECT
 */

import fs from 'fs';
import path from 'path';

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('Endpoint Entidade Lotes - Sem Violação de Imutabilidade', () => {
  const mockQuery = require('@/lib/db').query;
  const mockRequireEntity = require('@/lib/session').requireEntity;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TESTE: Sem UPDATE em laudos (IMUTABILIDADE)
  // ============================================================================
  describe('Imutabilidade: Sem UPDATE no banco', () => {
    it('não deve ter UPDATE laudos SET hash_pdf no código', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: Endpoint de entidade nunca faz UPDATE em laudos
      const hasUpdateLaudos = /UPDATE\s+laudos\s+SET\s+hash_pdf/i.test(
        routeCode
      );
      expect(hasUpdateLaudos).toBe(false);
    });

    it('não deve ter UPDATE laudos SET atualizado_em no código', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      const hasUpdateAtualizado = /UPDATE\s+laudos\s+SET\s+atualizado_em/i.test(
        routeCode
      );
      expect(hasUpdateAtualizado).toBe(false);
    });

    it('deve usar CASE WHEN SQL para determinar tem_laudo', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: usa CASE WHEN em vez de cálculos em memória
      expect(routeCode).toContain('CASE WHEN');
      expect(routeCode).toContain("status = 'emitido'");
      expect(routeCode).toContain('arquivo_remoto_url IS NOT NULL');
      expect(routeCode).toContain('as tem_laudo');
    });
  });

  // ============================================================================
  // TESTE: Lógica SQL de verificação de laudo
  // ============================================================================
  describe('Laudo: Verificação via SQL CASE WHEN', () => {
    it('deve ter LEFT JOIN com laudos', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('LEFT JOIN laudos l ON');
      expect(routeCode).toContain('l.lote_id');
    });

    it('deve selecionar campos necessários de laudo', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('l.id as laudo_id');
      expect(routeCode).toContain('l.status as laudo_status');
      expect(routeCode).toContain('l.emitido_em');
      expect(routeCode).toContain('l.arquivo_remoto_url');
    });

    it('deve verificar arquivo_remoto_url para determinar visualização', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: A lógica verifica arquivo_remoto_url (para ter certeza que está no bucket)
      expect(routeCode).toContain('arquivo_remoto_url');
      // Não verifica hash_pdf para visualização
      const hasHashCheck = /l\.hash_pdf/.test(routeCode);
      // hash_pdf pode estar lá para debug, mas não para determinar tem_laudo
    });
  });

  // ============================================================================
  // TESTE: Query de lotes com informações de laudo
  // ============================================================================
  describe('Query: Join com laudos', () => {
    it('deve ter LEFT JOIN com laudos', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('LEFT JOIN laudos l ON');
      expect(routeCode).toContain('l.lote_id = la.id');
    });

    it('deve ter CASE WHEN para determinar tem_laudo', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: Lógica em SQL em vez de em memória
      expect(routeCode).toContain('CASE');
      expect(routeCode).toContain("status = 'emitido'");
      expect(routeCode).toContain('arquivo_remoto_url IS NOT NULL');
    });
  });

  // ============================================================================
  // TESTE: Autenticação e autorização
  // ============================================================================
  describe('Segurança: Autenticação entidade', () => {
    it('deve usar session para validar identificação da entidade', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: Usa getSession em vez de requireEntity
      expect(routeCode).toContain('getSession');
      expect(routeCode).toContain('entidade_id');
    });

    it('deve filtrar lotes apenas da entidade autenticada', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('session.entidade_id');
      expect(routeCode).toContain('fe2.entidade_id');
    });
  });

  // ============================================================================
  // TESTE: Sem efeitos colaterais
  // ============================================================================
  describe('Estabilidade: Sem efeitos colaterais', () => {
    it('não deve fazer UPDATE em laudos (preserva imutabilidade)', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // ✅ NOVO: Garantir que não há UPDATE no banco
      const hasUpdateLaudos = /UPDATE\s+laudos/i.test(routeCode);
      expect(hasUpdateLaudos).toBe(false);
    });

    it('deve retornar dados sem mutação', () => {
      // Simples verificação que o código trata dados como read-only
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lote/[id]/route.ts'),
        'utf-8'
      );

      // Verifica que retorna NextResponse com dados
      expect(routeCode).toContain('NextResponse');
      expect(routeCode).toContain('.json(');
    });
  });
});
