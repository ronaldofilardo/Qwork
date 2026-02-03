import { gerarRecibo, gerarHtmlRecibo } from '@/lib/receipt-generator';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/pdf-generator', () => ({
  gerarPdfRecibo: jest.fn().mockResolvedValue({
    pdfBuffer: Buffer.from('fake-pdf-content'),
    hash: 'a'.repeat(64),
    localPath: 'storage/recibos/2025/01-janeiro/recibo-TEST.pdf',
    size: 15000,
  }),
}));
// Também mockar o caminho relativo (import usado em lib/receipt-generator.ts)
jest.mock('../../lib/pdf-generator', () => ({
  gerarPdfRecibo: jest.fn().mockResolvedValue({
    pdfBuffer: Buffer.from('fake-pdf-content'),
    hash: 'a'.repeat(64),
    localPath: 'storage/recibos/2025/01-janeiro/recibo-TEST.pdf',
    size: 15000,
  }),
}));

jest.mock('@/lib/audit-logger', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe.skip('receipt-generator', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('gerarRecibo', () => {
    it('deve gerar recibo com dados corretos', async () => {
      // Mock - verificar recibo existente (não existe)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      // Mock - verificar contrato (existe e aceito)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, aceito: true, hash_contrato: 'abc123' }],
        rowCount: 1,
      } as any);

      // Mock - busca contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
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
      } as any);

      // Mock - busca pagamento
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            valor: 1200.0,
            metodo: 'pix',
            numero_parcelas: 1,
            detalhes_parcelas: null,
            plataforma_nome: 'PagBank',
            plataforma_id: 'PAG123',
            data_pagamento: new Date('2025-01-15'),
            plano_id: 1,
            plano_nome: 'Plano Fixo',
            plano_tipo: 'fixo',
            plano_descricao: 'Plano fixo mensal',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock - gerar número do recibo
      mockQuery.mockResolvedValueOnce({
        rows: [{ numero: 'REC-2025-00001' }],
        rowCount: 1,
      } as any);

      // Mock - insert recibo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 123,
            numero_recibo: 'REC-2025-00001',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock - criar notificação
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      } as any);

      // Mock - update pagamento
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      // Garantir mock explícito do PDF (às vezes jest hoisting causa conflito em caminhos relativos)
      const pdfMod = require('@/lib/pdf-generator');
      (pdfMod.gerarPdfRecibo as jest.Mock).mockResolvedValueOnce({
        pdfBuffer: Buffer.from('fake-pdf-content'),
        hash: 'a'.repeat(64),
        localPath: 'storage/recibos/2025/01-janeiro/recibo-TEST.pdf',
        size: 15000,
      });

      const result = await gerarRecibo({
        contratante_id: 3,
        pagamento_id: 2,
        contrato_id: 1,
        emitido_por_cpf: '12345678901',
        ip_emissao: '192.168.1.1',
      });

      expect(result).toHaveProperty('id', 123);
      expect(result).toHaveProperty('numero_recibo', 'REC-2025-00001');
      expect(result).toHaveProperty('pdf');
      expect(result).toHaveProperty('hash_pdf');
      expect(result.hash_pdf).toMatch(/^[a-f0-9]{64}$/);
    });

    it('deve calcular total a partir de valor_por_funcionario × numero_funcionarios', async () => {
      // 1) recibo inexistente
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // 1.1) contrato (aceito)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, aceito: true }],
        rowCount: 1,
      } as any);

      // 2) contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 56,
            nome: 'RELEGERE',
            cnpj: '02494916000170',
            responsavel_cpf: '...',
          },
        ],
        rowCount: 1,
      } as any);

      // 3) pagamento com valor_por_funcionario e numero_funcionarios
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 50,
            valor: 20.0,
            valor_por_funcionario: 20.0,
            numero_funcionarios: 15,
            metodo: 'cartao',
            numero_parcelas: 3,
            detalhes_parcelas: null,
            plataforma_nome: 'FakePay',
            plataforma_id: 'TX123',
            data_pagamento: new Date('2025-12-27'),
          },
        ],
        rowCount: 1,
      } as any);

      // 4) numero do recibo
      mockQuery.mockResolvedValueOnce({
        rows: [{ numero: 'REC-20251231-0001' }],
        rowCount: 1,
      } as any);

      // 5) hash contrato
      mockQuery.mockResolvedValueOnce({
        rows: [{ hash: 'deadbeef' }],
        rowCount: 1,
      } as any);

      // 6) insert recibo
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 8, numero_recibo: 'REC-20251231-0001' }],
        rowCount: 1,
      } as any);

      // 7) criar notificação
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      // 8) update pagamento
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const result = await gerarRecibo({
        contratante_id: 56,
        pagamento_id: 50,
        contrato_id: 1,
      });

      expect(result.valor_total).toBe(300);
      expect(result.valor_por_funcionario).toBe(20);
      expect(result.qtd_funcionarios).toBe(15);
    });
  });

  describe('gerarHtmlRecibo', () => {
    it('deve gerar HTML do recibo', () => {
      const mockReciboData: any = {
        id: 123,
        numero_recibo: 'REC-20250101-0001',
        vigencia_inicio: new Date('2025-01-01'),
        vigencia_fim: new Date('2025-12-31'),
        contratante_nome: 'Empresa Teste',
        contratante_cnpj: '12345678000199',
        valor_total: 1200.0,
        numero_funcionarios_cobertos: 10,
        forma_pagamento: 'pix',
        numero_parcelas: 1,
        valor_parcela: 1200.0,
        plano_nome: 'Plano Fixo',
        plano_tipo: 'fixo',
        emitido_em: new Date(),
        data_inicio_vigencia: new Date('2025-01-01'),
        data_fim_vigencia: new Date('2025-12-31'),
        contrato_hash: 'abc123',
        metodo_pagamento: 'pix',
      };

      const html = gerarHtmlRecibo(mockReciboData);

      expect(html).toContain('REC-20250101-0001');
      expect(html).toContain('Empresa Teste');
      expect(html).toContain('R$');
      expect(html).toContain('1.200');
    });
  });
});
