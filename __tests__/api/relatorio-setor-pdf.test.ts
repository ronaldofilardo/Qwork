/**
 * @fileoverview Testes das rotas de relatório PDF por setor
 * @description Valida autenticação, validação de parâmetros e geração de PDF
 *   para os endpoints /api/entidade/relatorio-setor-pdf e /api/rh/relatorio-setor-pdf
 */

import { NextRequest } from 'next/server';

// Mocks de dependências externas
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
  requireRole: jest.fn(),
}));

jest.mock('@/lib/pdf/relatorio-setor', () => ({
  gerarRelatorioSetorPDF: jest.fn(() => Buffer.from('mock-pdf-content')),
}));

import { GET as entidadeGET } from '@/app/api/entidade/relatorio-setor-pdf/route';
import { GET as rhGET } from '@/app/api/rh/relatorio-setor-pdf/route';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): NextRequest {
  const searchParams = new URLSearchParams(params);
  return new NextRequest(
    `http://localhost/api/test?${searchParams.toString()}`
  );
}

// ── Entidade ─────────────────────────────────────────────────────────────────

describe('GET /api/entidade/relatorio-setor-pdf', () => {
  const { requireEntity } = require('@/lib/session');
  const { query } = require('@/lib/db');

  beforeEach(() => {
    jest.clearAllMocks();
    requireEntity.mockResolvedValue({ entidade_id: 10 });
  });

  it('deve retornar 400 quando lote_id está ausente', async () => {
    const req = makeRequest({ setor: 'TI' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('obrigatórios');
  });

  it('deve retornar 400 quando setor está ausente', async () => {
    const req = makeRequest({ lote_id: '1' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('obrigatórios');
  });

  it('deve retornar 404 quando lote não pertence à entidade', async () => {
    query.mockResolvedValueOnce({ rows: [] }); // lote não encontrado
    const req = makeRequest({ lote_id: '1', setor: 'TI' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(404);
  });

  it('deve retornar 404 quando setor não tem funcionários concluídos', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ empresa_nome: 'Empresa X' }] }) // lote OK
      .mockResolvedValueOnce({ rows: [{ total: 0 }] }); // 0 funcionários
    const req = makeRequest({ lote_id: '1', setor: 'TI' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Nenhum funcionário');
  });

  it('deve retornar 200 com PDF quando tudo está correto', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ empresa_nome: 'Empresa X' }] }) // lote OK
      .mockResolvedValueOnce({ rows: [{ total: 3 }] }) // 3 funcionários
      .mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 25 },
          { grupo: 2, valor: 75 },
        ],
      }); // respostas

    const req = makeRequest({ lote_id: '1', setor: 'TI' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('TI');
  });

  it('deve retornar 500 quando ocorre erro inesperado', async () => {
    query.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest({ lote_id: '1', setor: 'TI' });
    const res = await entidadeGET(req);
    expect(res.status).toBe(500);
  });

  it('deve retornar 401/500 quando sessão não está autenticada', async () => {
    requireEntity.mockRejectedValueOnce(new Error('Unauthorized'));
    const req = makeRequest({ lote_id: '1', setor: 'TI' });
    const res = await entidadeGET(req);
    expect([401, 403, 500]).toContain(res.status);
  });
});

// ── RH ────────────────────────────────────────────────────────────────────────

describe('GET /api/rh/relatorio-setor-pdf', () => {
  const { requireRole } = require('@/lib/session');
  const { query } = require('@/lib/db');

  beforeEach(() => {
    jest.clearAllMocks();
    requireRole.mockResolvedValue({ clinica_id: 5 });
  });

  it('deve retornar 400 quando parâmetros estão ausentes', async () => {
    const req = makeRequest({ lote_id: '1' }); // falta empresa_id e setor
    const res = await rhGET(req);
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando lote não pertence à clínica/empresa', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const req = makeRequest({ lote_id: '1', empresa_id: '2', setor: 'RH' });
    const res = await rhGET(req);
    expect(res.status).toBe(404);
  });

  it('deve retornar 404 quando setor não tem funcionários concluídos', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ empresa_nome: 'Empresa Y' }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });
    const req = makeRequest({ lote_id: '1', empresa_id: '2', setor: 'RH' });
    const res = await rhGET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Nenhum funcionário');
  });

  it('deve retornar 200 com PDF quando tudo está correto', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ empresa_nome: 'Empresa Y' }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 30 },
          { grupo: 3, valor: 70 },
        ],
      });

    const req = makeRequest({
      lote_id: '1',
      empresa_id: '2',
      setor: 'Financeiro',
    });
    const res = await rhGET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('Financeiro');
  });

  it('deve sanitizar o nome do setor no Content-Disposition', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ empresa_nome: 'Empresa Y' }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ grupo: 1, valor: 40 }] });

    const req = makeRequest({
      lote_id: '5',
      empresa_id: '2',
      setor: 'Vendas & Pós-venda',
    });
    const res = await rhGET(req);
    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    // Espaços convertidos em hífen no nome do arquivo
    expect(disposition).toContain('Vendas');
    expect(disposition).toContain('lote5');
  });
});
