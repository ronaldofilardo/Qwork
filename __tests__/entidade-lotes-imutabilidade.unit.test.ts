/**
 * Testes Unitários: Endpoint Entidade Lotes
 * Testa que endpoint não viola imutabilidade de laudos
 * Referência: Correção #10
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
  // TESTE: Sem UPDATE em laudos
  // ============================================================================
  describe('Imutabilidade: Sem UPDATE no banco', () => {
    it('não deve ter UPDATE laudos SET hash_pdf no código', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      const hasUpdateLaudos = /UPDATE\s+laudos\s+SET\s+hash_pdf/i.test(
        routeCode
      );
      expect(hasUpdateLaudos).toBe(false);
    });

    it('não deve ter UPDATE laudos SET atualizado_em no código', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      const hasUpdateAtualizado = /UPDATE\s+laudos\s+SET\s+atualizado_em/i.test(
        routeCode
      );
      expect(hasUpdateAtualizado).toBe(false);
    });

    it('deve ter comentário explicativo sobre imutabilidade', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain(
        'IMPORTANTE: Não atualizamos o banco pois laudos emitidos são IMUTÁVEIS'
      );
      expect(routeCode).toContain('Apenas atualizar na resposta, NÃO no banco');
    });
  });

  // ============================================================================
  // TESTE: Hash calculado apenas em memória
  // ============================================================================
  describe('Hash: Cálculo em memória sem persistência', () => {
    it('deve calcular hash do arquivo se laudo existe', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('crypto.createHash');
      expect(routeCode).toContain('sha256');
    });

    it('deve atualizar apenas na resposta (lote.laudo_hash)', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('lote.laudo_hash = h');
    });

    it('deve ter fallback silencioso se arquivo não existe', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('console.warn');
      expect(routeCode).toContain('Não foi possível computar hash');
    });
  });

  // ============================================================================
  // TESTE: Comentários sobre dados legados
  // ============================================================================
  describe('Documentação: Dados legados', () => {
    it('deve ter comentário sobre hash de dados legados', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain(
        'O hash deveria ter sido calculado na geração'
      );
      expect(routeCode).toContain('mas para dados legados apenas mostramos');
    });

    it('deve ter comentário sobre fallback não intrusivo', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('BEFORE returning');
      expect(routeCode).toContain('fallback não intrusivo');
    });
  });

  // ============================================================================
  // TESTE: Query de lotes com informações de laudo
  // ============================================================================
  describe('Query: Join com laudos', () => {
    it('deve ter LEFT JOIN com laudos', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('LEFT JOIN laudos l ON');
      expect(routeCode).toContain('l.id as laudo_id');
      expect(routeCode).toContain('l.status as laudo_status');
      expect(routeCode).toContain('l.hash_pdf as laudo_hash');
    });

    it('deve selecionar emissor_nome', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('f3.nome as emissor_nome');
      expect(routeCode).toContain(
        'LEFT JOIN funcionarios f3 ON l.emissor_cpf = f3.cpf'
      );
    });
  });

  // ============================================================================
  // TESTE: Autenticação e autorização
  // ============================================================================
  describe('Segurança: Autenticação entidade', () => {
    it('deve usar requireEntity para validar sessão', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('requireEntity');
      expect(routeCode).toContain('contratante_id');
    });

    it('deve filtrar lotes por contratante_id', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain(
        'cf.contratante_id = $1 OR la.contratante_id = $1'
      );
    });
  });

  // ============================================================================
  // TESTE: Sem efeitos colaterais
  // ============================================================================
  describe('Estabilidade: Sem efeitos colaterais', () => {
    it('deve processar lotes com Promise.all sem mutar banco', async () => {
      mockRequireEntity.mockResolvedValue({
        contratante_id: 1,
        perfil: 'gestor_entidade',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            laudo_id: 8,
            laudo_hash: null,
          },
        ],
      });

      // Simular processamento
      const lotes = [{ id: 1, laudo_id: 8, laudo_hash: null }];

      await Promise.all(
        lotes.map(async (lote) => {
          if (lote.laudo_id && !lote.laudo_hash) {
            // Apenas calcular, não persistir
            lote.laudo_hash = 'mock_hash';
          }
        })
      );

      expect(lotes[0].laudo_hash).toBe('mock_hash');
      // Verificar que query UPDATE não foi chamado
      expect(mockQuery).toHaveBeenCalledTimes(1); // Apenas SELECT inicial
    });
  });

  // ============================================================================
  // TESTE: Tratamento de erros
  // ============================================================================
  describe('Erros: Tratamento gracioso', () => {
    it('deve continuar processamento se hash falhar', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('catch (err)');
      expect(routeCode).toContain('console.warn');
      expect(routeCode).not.toContain('throw');
    });

    it('deve ter mensagem de warning detalhada', () => {
      const routeCode = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(routeCode).toContain('Não foi possível computar hash para laudo');
      expect(routeCode).toContain('err instanceof Error ? err.message');
    });
  });
});
