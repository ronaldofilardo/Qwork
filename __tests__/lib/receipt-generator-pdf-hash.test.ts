/**
 * Testes Unitários: Geração de Recibos com PDF e Hash
 *
 * Foca em:
 * - Geração correta de PDF usando template
 * - Cálculo e inclusão de hash SHA-256
 * - Persistência de BYTEA no banco
 */

import {
  gerarRecibo,
  ReciboData,
  ReciboCompleto,
} from '@/lib/receipt-generator';
import { gerarPdfRecibo } from '@/lib/pdf-generator';
import { gerarHtmlReciboTemplate } from '@/lib/templates/recibo-template';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/pdf-generator');
jest.mock('@/lib/audit-logger');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGerarPdfRecibo = gerarPdfRecibo as jest.MockedFunction<
  typeof gerarPdfRecibo
>;

describe.skip('Receipt Generator - PDF com Hash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarRecibo()', () => {
    it('deve usar gerarHtmlReciboTemplate para gerar HTML', async () => {
      // Setup mocks
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Recibo não existe
        .mockResolvedValueOnce({
          rows: [{ id: 1, aceito: true, hash_contrato: 'abc123def456' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Contratante
          rows: [
            {
              id: 1,
              nome: 'Empresa Teste',
              cnpj: '12345678000199',
              responsavel_cpf: '12345678901',
              endereco: 'Rua Teste, 123',
              cidade: 'São Paulo',
              estado: 'SP',
              cep: '01234-567',
              tipo: 'clinica',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Pagamento
          rows: [
            {
              id: 1,
              valor: '500.00',
              metodo: 'pix',
              numero_parcelas: 1,
              detalhes_parcelas: null,
              plataforma_nome: 'PagBank',
              plataforma_id: 'PAG123',
              data_pagamento: '2025-12-15',
              plano_id: 1,
              plano_nome: 'Plano Fixo',
              plano_tipo: 'fixo',
              plano_descricao: 'Plano para até 50 funcionários',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Gerar número recibo
          rows: [{ numero: 'REC-2025-00001' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Insert recibo
          rows: [
            {
              id: 1,
              numero_recibo: 'REC-2025-00001',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Criar notificação
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Update pagamento

      // Mock geração de PDF
      mockGerarPdfRecibo.mockResolvedValue({
        pdfBuffer: Buffer.from('fake-pdf-data'),
        hash: 'a'.repeat(64), // SHA-256 fake
        localPath: 'storage/recibos/2025/12-dezembro/recibo-REC-2025-00001.pdf',
        size: 15000,
      });

      const reciboData: ReciboData = {
        contratante_id: 1,
        pagamento_id: 1,
        contrato_id: 1,
        emitido_por_cpf: '12345678901',
        ip_emissao: '192.168.1.1',
      };

      const resultado = await gerarRecibo(reciboData);

      // Verificar que gerarPdfRecibo foi chamado
      expect(mockGerarPdfRecibo).toHaveBeenCalledTimes(1);
      expect(mockGerarPdfRecibo).toHaveBeenCalledWith(
        expect.stringContaining('<!DOCTYPE html>'),
        'REC-2025-00001'
      );

      // Verificar que INSERT usou dados do PDF real
      const insertCall = mockQuery.mock.calls.find((call) =>
        call[0].includes('INSERT INTO recibos')
      );
      expect(insertCall).toBeDefined();
      // O segundo argumento do INSERT é um array de parâmetros: usar toContainEqual para objetos/arrays
      expect(insertCall[1]).toContainEqual(Buffer.from('fake-pdf-data')); // PDF BYTEA
      expect(insertCall[1]).toContainEqual('a'.repeat(64)); // Hash
      expect(insertCall[1]).toContainEqual(
        'storage/recibos/2025/12-dezembro/recibo-REC-2025-00001.pdf'
      ); // Backup path
    });

    it('deve gerar HTML com todos os dados do contratante', async () => {
      const dadosRecibo: ReciboCompleto = {
        id: 1,
        numero_recibo: 'REC-2025-00001',
        contratante_nome: 'Empresa Teste Ltda',
        contratante_cnpj: '12345678000199',
        contratante_cpf: undefined,
        contratante_endereco: 'Rua Teste, 123',
        contratante_cidade: 'São Paulo',
        contratante_estado: 'SP',
        contratante_cep: '01234-567',
        plano_nome: 'Plano Fixo',
        plano_tipo: 'fixo',
        plano_descricao: 'Avaliações ilimitadas',
        valor_total: 1500.0,
        valor_por_funcionario: 30.0,
        qtd_funcionarios: 50,
        metodo_pagamento: 'cartao_credito',
        numero_parcelas: 12,
        detalhes_parcelas: null,
        plataforma_pagamento: 'PagBank',
        transacao_id: 'TRX-12345',
        data_inicio_vigencia: new Date('2025-01-01'),
        data_fim_vigencia: new Date('2025-12-30'),
        contrato_hash: 'abc123def456',
        emitido_em: new Date('2025-01-01'),
      };

      const html = gerarHtmlReciboTemplate(dadosRecibo);

      expect(html).toContain('REC-2025-00001');
      expect(html).toContain('Empresa Teste Ltda');
      expect(html).toContain('12.345.678/0001-99'); // CNPJ formatado
      expect(html).toContain('Plano Fixo');
      expect(html).toContain('{{HASH_PDF}}'); // Placeholder para hash
      expect(html).toContain('01/01/2025'); // Data formatada
      expect(html).toContain('R$'); // Valor formatado
    });

    it('deve lançar erro se pagamento já tem recibo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, numero_recibo: 'REC-2025-00001' }],
        rowCount: 1,
      });

      const reciboData: ReciboData = {
        contratante_id: 1,
        pagamento_id: 1,
        contrato_id: 1,
      };

      await expect(gerarRecibo(reciboData)).rejects.toThrow(
        /Recibo já existe para este pagamento/
      );
    });

    it('deve criar notificação após gerar recibo', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Recibo não existe
        .mockResolvedValueOnce({
          rows: [{ id: 1, nome: 'Empresa', responsavel_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, valor: '500', metodo: 'pix', plano_id: 1 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ numero: 'REC-2025-00001' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [{ hash: 'abc123' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // Insert recibo
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Criar notificação
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Update pagamento

      mockGerarPdfRecibo.mockResolvedValue({
        pdfBuffer: Buffer.from('pdf'),
        hash: 'a'.repeat(64),
        localPath: 'storage/test.pdf',
        size: 1000,
      });

      await gerarRecibo({ contratante_id: 1, pagamento_id: 1, contrato_id: 1 });

      // Verificar chamada para criar_notificacao_recibo
      const notifCall = mockQuery.mock.calls.find((call) =>
        call[0].includes('criar_notificacao_recibo')
      );
      expect(notifCall).toBeDefined();
      expect(notifCall[1]).toEqual([1, 1]); // recibo_id, contratante_id
    });
  });

  describe('Template de Recibo', () => {
    it('deve incluir placeholder {{HASH_PDF}} no rodapé', () => {
      const dadosMinimos: ReciboCompleto = {
        id: 1,
        numero_recibo: 'REC-TEST',
        contratante_nome: 'Teste',
        plano_nome: 'Plano',
        plano_tipo: 'fixo',
        valor_total: 100,
        metodo_pagamento: 'pix',
        numero_parcelas: 1,
        data_inicio_vigencia: new Date(),
        data_fim_vigencia: new Date(),
        emitido_em: new Date(),
      };

      const html = gerarHtmlReciboTemplate(dadosMinimos);

      expect(html).toContain('{{HASH_PDF}}');
      // Case-insensitive checks to avoid formatting changes
      expect(html.toLowerCase()).toContain('hash de integridade');
      expect(html.toLowerCase()).toContain('sha-256');
    });

    it('deve formatar valores monetários corretamente', () => {
      const dados: ReciboCompleto = {
        id: 1,
        numero_recibo: 'REC-TEST',
        contratante_nome: 'Teste',
        plano_nome: 'Plano',
        plano_tipo: 'fixo',
        valor_total: 1234.56,
        valor_por_funcionario: 24.69,
        qtd_funcionarios: 50,
        metodo_pagamento: 'pix',
        numero_parcelas: 1,
        data_inicio_vigencia: new Date(),
        data_fim_vigencia: new Date(),
        emitido_em: new Date(),
      };

      const html = gerarHtmlReciboTemplate(dados);

      expect(html).toContain('R$'); // Símbolo de Real
      expect(html).toContain('1.234,56'); // Formato brasileiro
      expect(html).toContain('24,69'); // Valor por funcionário
    });

    it('deve incluir detalhamento de parcelas quando aplicável', () => {
      const dados: ReciboCompleto = {
        id: 1,
        numero_recibo: 'REC-TEST',
        contratante_nome: 'Teste',
        plano_nome: 'Plano',
        plano_tipo: 'fixo',
        valor_total: 1200,
        metodo_pagamento: 'cartao_credito',
        numero_parcelas: 12,
        detalhes_parcelas: [
          { parcela: 1, valor: 100, vencimento: '2025-01-15' },
          { parcela: 2, valor: 100, vencimento: '2025-02-15' },
        ],
        data_inicio_vigencia: new Date(),
        data_fim_vigencia: new Date(),
        emitido_em: new Date(),
      };

      const html = gerarHtmlReciboTemplate(dados);

      expect(html).toContain('Detalhamento das Parcelas');
      expect(html).toContain('15/01/2025'); // Parcela 1
      expect(html).toContain('15/02/2025'); // Parcela 2
    });
  });
});
