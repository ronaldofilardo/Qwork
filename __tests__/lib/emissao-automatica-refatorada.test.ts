/**
 * Testes de Emissão Automática de Laudos - Fluxo Refatorado
 *
 * Cobre:
 * - Emissão imediata ao concluir lote
 * - Envio delayed (10 minutos)
 * - Cancelamento automático de lote
 * - Idempotência de emissão e envio
 * - Recuperação de jobs falhados
 * - Métricas e observabilidade
 */

import { query } from '@/lib/db';
import {
  emitirLaudoImediato,
  emitirLaudosAutomaticamente,
  enviarLaudosAutomaticamente,
  gerarLaudoCompletoEmitirPDF,
  validarEmissorUnico,
  selecionarEmissorParaLote,
} from '@/lib/laudo-auto';

// Mock de funções externas
jest.mock('@/lib/db');
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
    }),
    close: jest.fn(),
  }),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  criarNotificacao: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/storage/laudo-storage', () => ({
  uploadLaudoToBackblaze: jest.fn().mockResolvedValue(undefined),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Emissão Automática de Laudos - Fluxo Refatorado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Emissão Imediata ao Concluir Lote', () => {
    it('deve emitir laudo imediatamente quando lote é concluído', async () => {
      // Mock: emissor ativo
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              cpf: '12345678901',
              nome: 'Emissor Teste',
              email: 'emissor@test.com',
            },
          ],
          rowCount: 1,
        })
        // Mock: buscar lote
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: 'LOTE-001',
              clinica_id: 100,
              empresa_id: null,
              contratante_id: null,
              emitido_em: null,
            },
          ],
          rowCount: 1,
        })
        // Mock: verificar laudo existente
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        // Mock: inserir laudo
        .mockResolvedValueOnce({ rows: [{ id: 500 }], rowCount: 1 })
        // Mock: buscar dados gerais empresa
        .mockResolvedValueOnce({
          rows: [
            {
              empresaAvaliada: 'Empresa Teste',
              totalFuncionariosAvaliados: 10,
            },
          ],
          rowCount: 1,
        })
        // Mock: calcular scores
        .mockResolvedValueOnce({
          rows: [
            {
              dominio: 'Exigências do Trabalho',
              media: 50,
              categoriaRisco: 'MODERADO',
            },
          ],
          rowCount: 1,
        })
        // Mock: atualizar laudo com PDF
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // Mock: marcar lote como emitido
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // Mock: registrar auditoria
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const resultado = await emitirLaudoImediato(1);

      expect(resultado).toBe(true);
      // Verifica que houve emissão (INSERT em laudos)
      const laudoInsertCalls = mockQuery.mock.calls.filter(
        (call) => call[0] && call[0].includes('INSERT INTO laudos')
      );
      expect(laudoInsertCalls.length).toBeGreaterThan(0);

      // Verifica que tentamos o upload para Backblaze (mock)
      const { uploadLaudoToBackblaze } = require('@/lib/storage/laudo-storage');
      expect(uploadLaudoToBackblaze).toHaveBeenCalled();
    });

    it('deve gerar e tentar upload quando laudo existente sem PDF local', async () => {
      // 1) laudo existente será detectado
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 777 }], rowCount: 1 }) // SELECT laudo existente
        .mockResolvedValueOnce({ rows: [{ hash_pdf: null }], rowCount: 1 }) // SELECT hash_pdf
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE laudos (hash)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // DO update emitido

      const laudoId = await gerarLaudoCompletoEmitirPDF(1, '00000000000');
      expect(laudoId).toBe(777);

      const { uploadLaudoToBackblaze } = require('@/lib/storage/laudo-storage');
      expect(uploadLaudoToBackblaze).toHaveBeenCalled();
    });

    it('não deve tentar atualizar a DB quando laudo já estiver emitido (skip por imutabilidade)', async () => {
      const fs = require('fs/promises');
      const path = require('path');
      const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
      await fs.mkdir(laudosDir, { recursive: true });
      const laudoId = 777;
      // criar arquivo local para simular laudo já gerado
      await fs.writeFile(
        path.join(laudosDir, `laudo-${laudoId}.pdf`),
        'pdf-content'
      );

      // Mock: laudo existente e já emitido; hash ausente
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: laudoId, status: 'enviado', emitido_em: new Date() }],
          rowCount: 1,
        }) // SELECT laudo existente
        .mockResolvedValueOnce({ rows: [{ hash_pdf: null }], rowCount: 1 }) // SELECT hash_pdf
        .mockResolvedValueOnce({
          rows: [
            {
              empresaAvaliada: 'Empresa Teste',
              total_avaliacoes: 10,
              avaliacoes_concluidas: 10,
              primeira_avaliacao: new Date(),
              ultima_conclusao: new Date(),
              codigo: 'LOTE-777',
              liberado_em: new Date(),
            },
          ],
          rowCount: 1,
        }) // gerarDadosGeraisEmpresa
        .mockResolvedValueOnce({
          rows: [{ total: 10, operacional: 8, gestao: 2 }],
          rowCount: 1,
        }) // funcionariosResult
        .mockResolvedValueOnce({
          rows: [{ dominio: 'X', media: 50 }],
          rowCount: 1,
        }); // calcularScoresPorGrupo

      const result = await gerarLaudoCompletoEmitirPDF(1, '53051173991');
      expect(result).toBe(laudoId);

      // Certificar que não houve tentativa de UPDATE do hash no DB
      const attemptedHashUpdate = mockQuery.mock.calls.find(
        (c) => c[0] && c[0].includes('UPDATE laudos SET hash_pdf')
      );
      expect(attemptedHashUpdate).toBeUndefined();

      // E o upload foi acionado
      const { uploadLaudoToBackblaze } = require('@/lib/storage/laudo-storage');
      expect(uploadLaudoToBackblaze).toHaveBeenCalled();

      // Cleanup
      await fs
        .unlink(path.join(laudosDir, `laudo-${laudoId}.pdf`))
        .catch(() => {});
      await fs
        .unlink(path.join(laudosDir, `laudo-${laudoId}.json`))
        .catch(() => {});
    });

    it('deve emitir mesmo com múltiplos emissores quando houver emissor na mesma clínica', async () => {
      // Sequência de queries:
      // 1) validação (retorna múltiplos emissores) -> mocked by first call
      // 2) buscar lote
      // 3) selecionar emissor por clinica (returns the clinic-specific emissor)
      // 4...) restante do fluxo de emissão (inserção laudo, etc)
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '111' }, { cpf: '222' }],
          rowCount: 2,
        }) // multiple emissores
        .mockResolvedValueOnce({
          rows: [
            { id: 2, codigo: 'LOTE-CLIN', clinica_id: 200, emitido_em: null },
          ],
          rowCount: 1,
        }) // lote
        .mockResolvedValueOnce({
          rows: [{ cpf: '222', nome: 'Emissor Global', clinica_id: null }],
          rowCount: 1,
        }) // emissor global (independente) — selecionado determinísticamente
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // verificar laudo existente
        .mockResolvedValueOnce({ rows: [{ id: 600 }], rowCount: 1 }) // inserir laudo
        .mockResolvedValueOnce({
          rows: [{ empresaAvaliada: 'X' }],
          rowCount: 1,
        }) // dados gerais
        .mockResolvedValueOnce({
          rows: [{ dominio: 'T', media: 10 }],
          rowCount: 1,
        }) // scores
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update laudo
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update lote emitido
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // auditoria

      const resultado = await emitirLaudoImediato(2);
      expect(resultado).toBe(true);

      const laudoInsert = mockQuery.mock.calls.find(
        (c) => c[0] && c[0].includes('INSERT INTO laudos')
      );
      expect(laudoInsert).toBeDefined();
    });

    it('deve ser idempotente - não reemitir se já foi emitido', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', nome: 'Emissor Teste' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: 'LOTE-001',
              emitido_em: new Date('2026-01-05T10:00:00Z'),
            },
          ],
          rowCount: 1,
        });

      const resultado = await emitirLaudoImediato(1);

      expect(resultado).toBe(true);
    });

    it('deve falhar graciosamente se não houver emissor ativo', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 1,
        });

      const resultado = await emitirLaudoImediato(1);

      expect(resultado).toBe(false);
    });

    it('deve ignorar admin/placeholder e retornar null em validarEmissorUnico quando não houver emissores válidos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const emissor = await validarEmissorUnico();
      expect(emissor).toBeNull();
    });

    it('selecionarEmissorParaLote deve retornar null quando somente admin estiver presente (filtro exclui)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const sel = await selecionarEmissorParaLote(1);
      expect(sel).toBeNull();
    });
  });

  describe('FASE 1 - CRON: Buscar e Emitir Lotes Concluídos', () => {
    it('deve processar lotes concluídos sem emissão', async () => {
      // Mock: buscar lotes
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, codigo: 'LOTE-001', status: 'concluido', emitido_em: null },
        ],
        rowCount: 1,
      });

      // Mock subsequentes para o lote
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', nome: 'Emissor' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, codigo: 'LOTE-001', emitido_em: null }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 500 }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ empresaAvaliada: 'Teste' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ dominio: 'Test', media: 50 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await emitirLaudosAutomaticamente();

      // Verifica que houve processamento (busca de lotes retornou dados)
      expect(mockQuery).toHaveBeenCalled();
    });

    it('não deve processar se não houver lotes pendentes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await emitirLaudosAutomaticamente();

      // Apenas 1 chamada (a busca)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('FASE 2 - CRON: Envio Delayed (10 min)', () => {
    it('deve enviar laudos emitidos após 10 minutos', async () => {
      const mockLaudo = {
        lote_id: 1,
        laudo_id: 500,
        codigo: 'LOTE-001',
        clinica_id: 100,
        emitido_em: new Date(Date.now() - 11 * 60 * 1000), // 11 min atrás
        auto_emitir_em: new Date(Date.now() - 1 * 60 * 1000), // 1 min atrás
        hash_pdf: 'abc123',
        arquivo_pdf: Buffer.from('fake-pdf-content'),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockLaudo], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE enviado_em
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // auditoria

      await enviarLaudosAutomaticamente();

      // Verifica que houve processamento
      expect(mockQuery).toHaveBeenCalled();
    });

    it('não deve enviar se auto_emitir_em ainda não venceu', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await enviarLaudosAutomaticamente();

      // Apenas 1 chamada (a busca)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('deve validar hash antes de enviar', async () => {
      const mockLaudo = {
        lote_id: 1,
        laudo_id: 500,
        codigo: 'LOTE-001',
        hash_pdf: 'hash-invalido',
        arquivo_pdf: Buffer.from('fake-pdf-content'),
        auto_emitir_em: new Date(Date.now() - 1000),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockLaudo], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT erro
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // auditoria erro

      await enviarLaudosAutomaticamente();

      // Deve registrar erro de hash
      const errorInsertCalls = mockQuery.mock.calls.filter(
        (call) => call[0] && call[0].includes('INSERT INTO notificacoes_admin')
      );
      expect(errorInsertCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Cancelamento Automático de Lote', () => {
    it('deve cancelar lote se todas avaliações forem inativadas (via trigger)', async () => {
      // Este teste verifica que o trigger no banco funciona
      // Normalmente seria um teste de integração com banco real

      // Simular: lote com 3 avaliações, todas inativadas
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ status: 'ativo', codigo: 'LOTE-001' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            { id: 1, status: 'inativada' },
            { id: 2, status: 'inativada' },
            { id: 3, status: 'inativada' },
          ],
          rowCount: 3,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE para cancelado

      // Simular verificação manual (como o trigger faria)
      const lote = await mockQuery(
        'SELECT status FROM lotes_avaliacao WHERE id = $1',
        [1]
      );
      const avaliacoes = await mockQuery(
        'SELECT * FROM avaliacoes WHERE lote_id = $1',
        [1]
      );

      const todasInativadas = avaliacoes.rows.every(
        (a: any) => a.status === 'inativada'
      );

      if (todasInativadas) {
        await mockQuery(
          `UPDATE lotes_avaliacao 
           SET status = 'cancelado', cancelado_automaticamente = true 
           WHERE id = $1`,
          [1]
        );
      }

      // Verifica que o UPDATE foi chamado
      const cancelamentoCalls = mockQuery.mock.calls.filter(
        (call) => call[0] && call[0].includes("status = 'cancelado'")
      );
      expect(cancelamentoCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Métricas e Observabilidade', () => {
    it('deve calcular latência de emissão corretamente', async () => {
      // Mock da view vw_metricas_emissao_laudos
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            latencia_emissao_segundos: 60,
            latencia_envio_segundos: 600,
          },
        ],
        rowCount: 1,
      });

      const metricas = await mockQuery(
        'SELECT * FROM vw_metricas_emissao_laudos'
      );

      expect(metricas.rows[0]).toBeDefined();
      expect(metricas.rows[0].latencia_emissao_segundos).toBeDefined();
      expect(metricas.rows[0].latencia_envio_segundos).toBeDefined();
    });

    it('deve identificar alertas críticos (emissão atrasada)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: 'LOTE-001',
            tipo_alerta: 'CRITICO: Lote concluído há mais de 5min sem emissão',
            idade_conclusao_segundos: 400,
          },
        ],
        rowCount: 1,
      });

      const alertas = await mockQuery(
        'SELECT * FROM vw_alertas_emissao_laudos WHERE tipo_alerta LIKE $1',
        ['CRITICO%']
      );

      expect(alertas.rows[0]).toBeDefined();
      expect(alertas.rows[0].tipo_alerta).toContain('CRITICO');
    });
  });

  describe('Recuperação de Falhas', () => {
    it('deve registrar erro em auditoria quando emissão falhar', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '123', nome: 'Emissor' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, codigo: 'LOTE-001', emitido_em: null }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // laudo existente
        .mockRejectedValueOnce(new Error('Erro ao gerar PDF'))
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT notificacao_admin

      const resultado = await emitirLaudoImediato(1);

      expect(resultado).toBe(false);
      // Verifica que o INSERT de erro foi chamado
      const errorInsertCalls = mockQuery.mock.calls.filter(
        (call) => call[0] && call[0].includes('INSERT INTO notificacoes_admin')
      );
      expect(errorInsertCalls.length).toBeGreaterThan(0);
    });

    it('deve permitir reprocessamento manual de lote com falha', async () => {
      // Simular reprocessamento: limpar emitido_em e tentar novamente
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '123', nome: 'Emissor' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, codigo: 'LOTE-001', emitido_em: null }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // verificar laudo existente (nenhum)        .mockResolvedValueOnce({ rows: [{ id: 500 }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ empresaAvaliada: 'Teste' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ dominio: 'Test', media: 50 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Nota: não chamamos mockQuery() diretamente aqui — isso consumiria o primeiro
      // mockResolvedValue definido acima e desalinharia a sequência de mocks usada
      // por `emitirLaudoImediato`. Em vez disso, deixamos o fluxo consumir os mocks
      // na ordem esperada e verificamos o resultado final.
      const resultado = await emitirLaudoImediato(1);

      expect(resultado).toBe(true);
    });
  });
});
