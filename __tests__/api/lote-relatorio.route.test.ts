import { POST } from '@/app/api/entidade/lote/[id]/relatorio/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

const { query } = require('@/lib/db');
const { getSession } = require('@/lib/session');
const fsPromises = require('fs/promises');

describe('API: relatorio de lote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockReturnValue({
      perfil: 'gestor',
      tomador_id: 42,
    });
  });

  it('deve buscar laudo, ler hash e filtrar funcionários concluídos até a emissão', async () => {
    const loteId = 123;
    const laudoId = 999;
    const emitidoEm = new Date('2025-12-01T10:00:00Z').toISOString();

    // Mock das consultas SQL com comportamento por padrão
    query.mockImplementation(async (sql: string, params: any[]) => {
      if (/FROM lotes_avaliacao/i.test(sql)) {
        return {
          rows: [
            {
              id: loteId,
              titulo: 'Teste Lote',
              tipo: 'padrao',
              status: 'finalizado',
              criado_em: new Date().toISOString(),
              liberado_em: new Date().toISOString(),
            },
          ],
        };
      }

      if (/FROM laudos/i.test(sql)) {
        return { rows: [{ id: laudoId, emitido_em: emitidoEm }] };
      }

      if (/FROM funcionarios/i.test(sql)) {
        // Verificar que foi passado o cutoff (param[2]) igual ao emitidoEm
        expect(params[2]).toBe(new Date(emitidoEm).toISOString());
        return {
          rows: [
            {
              nome: 'João',
              cpf: '11111111111',
              setor: 'A',
              funcao: 'T',
              nivel_cargo: 'N1',
              avaliacao_status: 'concluida',
              data_conclusao: emitidoEm,
            },
          ],
        };
      }

      return { rows: [] };
    });

    // Mock do arquivo de metadados do laudo
    fsPromises.readFile.mockResolvedValue(
      JSON.stringify({
        arquivo: `laudo-${laudoId}.pdf`,
        hash: 'abcdef1234567890',
      })
    );

    // Chamar rota
    const response = await POST(
      new Request('https://test', { method: 'POST' }),
      { params: { id: String(loteId) } }
    );

    // Verificar que retornou PDF
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'relatorio-lote-L-001.pdf'
    );

    // Garantir que leu metadados
    expect(fsPromises.readFile).toHaveBeenCalledTimes(1);

    // Verificar que não houve chamada à antiga query de estatísticas (que usava COUNT(DISTINCT))
    for (const call of query.mock.calls) {
      const sql = call[0] as string;
      expect(/COUNT\(DISTINCT/i.test(sql)).toBe(false);
    }
  });
});
