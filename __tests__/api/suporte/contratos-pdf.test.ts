import { NextRequest } from 'next/server';
import { GET } from '@/app/api/suporte/contratos/[tomadorId]/pdf/route';
import { requireRole } from '@/lib/session';
import {
  buscarDadosTomador,
  gerarPdfContrato,
} from '@/lib/tomador/gerar-contrato-pdf';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/tomador/gerar-contrato-pdf', () => ({
  buscarDadosTomador: jest.fn(),
  gerarPdfContrato: jest.fn(),
}));

describe('GET /api/suporte/contratos/[tomadorId]/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireRole as jest.Mock).mockResolvedValue({ perfil: 'suporte' });
  });

  it('retorna 400 quando o id do tomador é inválido', async () => {
    const req = new NextRequest(
      'http://localhost/api/suporte/contratos/abc/pdf?tipo=entidade'
    );

    const res = await GET(req, { params: { tomadorId: 'abc' } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('inválido');
  });

  it('retorna 400 quando o tipo informado é inválido', async () => {
    const req = new NextRequest(
      'http://localhost/api/suporte/contratos/10/pdf?tipo=foo'
    );

    const res = await GET(req, { params: { tomadorId: '10' } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('tipo inválido');
  });

  it('retorna 404 quando não existe contrato aceito para o tomador', async () => {
    (buscarDadosTomador as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost/api/suporte/contratos/10/pdf?tipo=entidade'
    );

    const res = await GET(req, { params: { tomadorId: '10' } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('não encontrado');
  });

  it('retorna o PDF quando os dados são válidos', async () => {
    (buscarDadosTomador as jest.Mock).mockResolvedValue({
      tomadorData: { nome: 'Empresa Teste', cnpj: '12345678000199' },
      contrato: { id: 1, aceito: true, data_aceite: null, ip_aceite: null },
    });
    (gerarPdfContrato as jest.Mock).mockReturnValue(Buffer.from('pdf-teste'));

    const req = new NextRequest(
      'http://localhost/api/suporte/contratos/10/pdf?tipo=entidade'
    );

    const res = await GET(req, { params: { tomadorId: '10' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('contrato-10.pdf');
    expect(gerarPdfContrato).toHaveBeenCalledTimes(1);
  });
});
