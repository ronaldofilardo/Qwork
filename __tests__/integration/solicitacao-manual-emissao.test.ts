/**
 * Testes de Integração: Solicitação Manual de Emissão de Laudos
 *
 * Cobre cenários:
 * - Solicitação bem-sucedida por RH
 * - Solicitação bem-sucedida por Entidade
 * - Bloqueio de solicitação duplicada
 * - Bloqueio de solicitação sem permissão
 * - Validação de status do lote
 */

import { query } from '@/lib/db';

describe('Solicitação Manual de Emissão - Integração', () => {
  let testLoteId: number;
  let rhSession: string;
  let entidadeSession: string;
  let empresaId: number;
  let contratanteId: number;

  beforeAll(async () => {
    // Configurar dados de teste
    empresaId = 1; // Assumindo empresa de teste
    contratanteId = 1; // Assumindo contratante de teste

    // Criar sessões de teste (simplificado)
    rhSession = 'test-rh-session-token';
    entidadeSession = 'test-entidade-session-token';
  });

  beforeEach(async () => {
    // Criar lote de teste em estado 'concluido'
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao 
       (codigo, titulo, tipo, status, empresa_id, clinica_id, liberado_por, liberado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        `TEST-${Date.now()}`,
        'Lote de Teste - Emissão Manual',
        'completo',
        'concluido',
        empresaId,
        1, // clinica_id
        '12345678901', // CPF do RH
      ]
    );

    testLoteId = loteResult.rows[0].id;

    // Criar avaliações concluídas
    await query(
      `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status)
       VALUES 
         ($1, '11111111111', 'concluida'),
         ($1, '22222222222', 'concluida')`,
      [testLoteId]
    );
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (testLoteId) {
      await query('DELETE FROM fila_emissao WHERE lote_id = $1', [testLoteId]);
      await query('DELETE FROM laudos WHERE lote_id = $1', [testLoteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [testLoteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [testLoteId]);
    }
  });

  describe('Solicitação bem-sucedida', () => {
    it('deve permitir RH solicitar emissão de lote concluído', async () => {
      const response = await fetch(
        `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
        {
          method: 'POST',
          headers: {
            Cookie: `session=${rhSession}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('sucesso');

      // Verificar que laudo foi criado
      const laudoCheck = await query(
        'SELECT * FROM laudos WHERE lote_id = $1',
        [testLoteId]
      );
      expect(laudoCheck.rows.length).toBeGreaterThan(0);

      // Verificar que lote foi marcado como emitido
      const loteCheck = await query(
        'SELECT emitido_em FROM lotes_avaliacao WHERE id = $1',
        [testLoteId]
      );
      expect(loteCheck.rows[0].emitido_em).not.toBeNull();
    });

    it('deve permitir Entidade solicitar emissão de lote concluído', async () => {
      // Criar lote de entidade
      const entidadeLoteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (codigo, titulo, tipo, status, contratante_id, liberado_por, liberado_em)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [
          `ENT-TEST-${Date.now()}`,
          'Lote Entidade - Teste',
          'completo',
          'concluido',
          contratanteId,
          '98765432100',
        ]
      );

      const entidadeLoteId = entidadeLoteResult.rows[0].id;

      try {
        const response = await fetch(
          `http://localhost:3000/api/lotes/${entidadeLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: {
              Cookie: `session=${entidadeSession}`,
            },
          }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      } finally {
        // Limpar lote de entidade
        await query('DELETE FROM laudos WHERE lote_id = $1', [entidadeLoteId]);
        await query('DELETE FROM fila_emissao WHERE lote_id = $1', [
          entidadeLoteId,
        ]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [
          entidadeLoteId,
        ]);
      }
    });
  });

  describe('Bloqueios de segurança', () => {
    it('deve bloquear solicitação duplicada', async () => {
      // Primeira solicitação
      await fetch(
        `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
        {
          method: 'POST',
          headers: {
            Cookie: `session=${rhSession}`,
          },
        }
      );

      // Segunda solicitação (duplicada)
      const response = await fetch(
        `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
        {
          method: 'POST',
          headers: {
            Cookie: `session=${rhSession}`,
          },
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já foi emitido');
    });

    it('deve bloquear entidade de solicitar lote de outra entidade', async () => {
      // Criar lote de outra entidade
      const outroLoteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (codigo, titulo, tipo, status, contratante_id, liberado_por, liberado_em)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [
          `OUT-ENT-${Date.now()}`,
          'Lote Outra Entidade',
          'completo',
          'concluido',
          999, // contratante diferente
          '11122233344',
        ]
      );

      const outroLoteId = outroLoteResult.rows[0].id;

      try {
        const response = await fetch(
          `http://localhost:3000/api/lotes/${outroLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: {
              Cookie: `session=${entidadeSession}`, // contratante_id = 1
            },
          }
        );

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain('Sem permissão');
      } finally {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [outroLoteId]);
      }
    });

    it('deve bloquear solicitação de lote não concluído', async () => {
      // Criar lote em estado 'ativo'
      const ativoLoteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (codigo, titulo, tipo, status, empresa_id, clinica_id, liberado_por, liberado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          `ATIVO-${Date.now()}`,
          'Lote Ativo',
          'completo',
          'ativo',
          empresaId,
          1,
          '12345678901',
        ]
      );

      const ativoLoteId = ativoLoteResult.rows[0].id;

      try {
        const response = await fetch(
          `http://localhost:3000/api/lotes/${ativoLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: {
              Cookie: `session=${rhSession}`,
            },
          }
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('não está concluído');
        expect(data.error).toContain('ativo');
      } finally {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [ativoLoteId]);
      }
    });
  });

  describe('Validações de estado', () => {
    it('deve validar que lote existe', async () => {
      const response = await fetch(
        'http://localhost:3000/api/lotes/999999/solicitar-emissao',
        {
          method: 'POST',
          headers: {
            Cookie: `session=${rhSession}`,
          },
        }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve criar notificação de sucesso após emissão', async () => {
      await fetch(
        `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
        {
          method: 'POST',
          headers: {
            Cookie: `session=${rhSession}`,
          },
        }
      );

      // Verificar notificação
      const notifCheck = await query(
        `SELECT * FROM notificacoes 
         WHERE lote_id = $1 
         AND tipo = 'emissao_solicitada_sucesso'`,
        [testLoteId]
      );

      expect(notifCheck.rows.length).toBeGreaterThan(0);
      expect(notifCheck.rows[0].mensagem).toContain('sucesso');
    });
  });

  describe('Testes de Race Condition', () => {
    it('deve prevenir duplicação com requisições simultâneas', async () => {
      // Fazer 3 requisições simultâneas
      const promises = [
        fetch(
          `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: { Cookie: `session=${rhSession}` },
          }
        ),
        fetch(
          `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: { Cookie: `session=${rhSession}` },
          }
        ),
        fetch(
          `http://localhost:3000/api/lotes/${testLoteId}/solicitar-emissao`,
          {
            method: 'POST',
            headers: { Cookie: `session=${rhSession}` },
          }
        ),
      ];

      const responses = await Promise.all(promises);

      // Apenas uma deve ter sucesso
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(1);

      // As outras devem retornar erro de duplicação
      const errorResponses = responses.filter((r) => r.status === 400);
      expect(errorResponses.length).toBe(2);

      // Verificar que só um laudo foi criado
      const laudoCheck = await query(
        'SELECT COUNT(*) as total FROM laudos WHERE lote_id = $1',
        [testLoteId]
      );
      expect(parseInt(laudoCheck.rows[0].total)).toBe(1);
    });
  });
});
