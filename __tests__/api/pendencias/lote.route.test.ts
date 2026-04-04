/**
 * Testes para /api/pendencias/lote
 *
 * Comportamento esperado:
 *  - Apenas funcionários ATIVOS (fc.ativo=true / fe.ativo=true) são incluídos nas pendências
 *  - Exceção: inativos que estejam presentes no lote atual (INATIVADO_NO_LOTE) ainda aparecem
 *  - Inativos que NUNCA participaram de nenhum lote são excluídos pelo filtro SQL
 *  - Lote de referência usa ID real (não numero_ordem)
 *  - Motivos: INATIVADO_NO_LOTE | NUNCA_AVALIADO | ADICIONADO_APOS_LOTE | SEM_CONCLUSAO_VALIDA
 *  - Dois modos: RH (empresa_id + funcionarios_clinicas) e GESTOR (entidade + funcionarios_entidades)
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const { query } = require('@/lib/db');
const mockQuery = query;

const sessionMod = require('@/lib/session');
const mockGetSession = sessionMod.getSession;
const mockRequireRH = sessionMod.requireRHWithEmpresaAccess;
const mockRequireEntity = sessionMod.requireEntity;

function makeRequest(url: string) {
  return new Request(url) as any;
}

const LOTE_REF = {
  id: 1036,
  numero_ordem: 15,
  descricao: 'Lote 15 liberado',
  liberado_em: '2026-02-24T00:00:00.000Z',
  status: 'ativo',
};

const FUNC_ATIVO = {
  cpf: '11111111111',
  nome: 'Funcionario Ativo',
  setor: 'TI',
  funcao: 'Dev',
  email: 'ativo@test.com',
  matricula: null,
  ativo: true,
  criado_em: '2025-01-01T00:00:00.000Z',
  inativado_em: null,
  inativacao_lote_id: null,
  inativacao_lote_numero_ordem: null,
  motivo: 'NUNCA_AVALIADO',
};

const FUNC_INATIVO = {
  cpf: '22222222222',
  nome: 'Funcionario Inativo',
  setor: 'RH',
  funcao: 'Analista',
  email: 'inativo@test.com',
  matricula: null,
  ativo: false,
  criado_em: '2025-01-01T00:00:00.000Z',
  inativado_em: null,
  inativacao_lote_id: null,
  inativacao_lote_numero_ordem: null,
  motivo: 'NUNCA_AVALIADO',
};

describe('/api/pendencias/lote', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────
  describe('autenticação', () => {
    it('deve retornar 401 quando sem sessão', async () => {
      mockGetSession.mockReturnValue(null);
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Autenticação requerida');
    });

    it('deve retornar 403 para perfil admin', async () => {
      mockGetSession.mockReturnValue({ perfil: 'admin', cpf: '00000000000' });
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(403);
    });

    it('deve retornar 403 para perfil funcionario', async () => {
      mockGetSession.mockReturnValue({
        perfil: 'funcionario',
        cpf: '00000000000',
      });
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MODO RH
  // ─────────────────────────────────────────────────────────────────────────
  describe('modo RH', () => {
    beforeEach(() => {
      mockGetSession.mockReturnValue({ perfil: 'rh', cpf: '99999999999' });
      mockRequireRH.mockResolvedValue({ cpf: '99999999999', clinica_id: 10 });
    });

    it('deve retornar 400 quando empresa_id ausente', async () => {
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/empresa_id/i);
    });

    it('deve retornar SEM_LOTE quando nenhum lote liberado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // lote query
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=5')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.situacao).toBe('SEM_LOTE');
      expect(data.lote).toBeNull();
      expect(data.funcionarios).toHaveLength(0);
    });

    it('deve retornar COM_PENDENCIAS com funcionários ativos', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] }) // loteResult
        .mockResolvedValueOnce({ rows: [FUNC_ATIVO] }); // pendentesResult

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=5')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.situacao).toBe('COM_PENDENCIAS');
      expect(data.lote.id).toBe(1036);
      expect(data.funcionarios).toHaveLength(1);
      expect(data.funcionarios[0].ativo).toBe(true);
    });

    it('deve incluir INATIVADO_NO_LOTE quando inativo faz parte do lote atual', async () => {
      const funcInativadoNoLote = {
        ...FUNC_INATIVO,
        motivo: 'INATIVADO_NO_LOTE',
        inativacao_lote_id: 1036,
        inativacao_lote_numero_ordem: 15,
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [FUNC_ATIVO, funcInativadoNoLote] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=5')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      // total = 2: ativo (NUNCA_AVALIADO) + inativo que estava no lote (INATIVADO_NO_LOTE)
      expect(data.total).toBe(2);
      const inativados = data.funcionarios.filter(
        (f: any) => f.motivo === 'INATIVADO_NO_LOTE'
      );
      expect(inativados).toHaveLength(1);
      expect(inativados[0].nome).toBe('Funcionario Inativo');
      expect(inativados[0].inativacao_lote_id).toBe(1036);
    });

    it('deve retornar o ID real do lote (não numero_ordem)', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=5')
      );
      const data = await res.json();
      // lote.id deve ser o ID real (1036), não o numero_ordem (15)
      expect(data.lote.id).toBe(1036);
      expect(data.lote.numero_ordem).toBe(15);
    });

    it('deve calcular contadores por motivo corretamente', async () => {
      const funcs = [
        { ...FUNC_ATIVO, motivo: 'NUNCA_AVALIADO' },
        { ...FUNC_INATIVO, motivo: 'INATIVADO_NO_LOTE', inativacao_lote_id: 1036 },
        { ...FUNC_ATIVO, cpf: '33333333333', motivo: 'SEM_CONCLUSAO_VALIDA' },
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: funcs });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=5')
      );
      const data = await res.json();
      expect(data.contadores.NUNCA_AVALIADO).toBe(1);
      expect(data.contadores.INATIVADO_NO_LOTE).toBe(1);
      expect(data.contadores.SEM_CONCLUSAO_VALIDA).toBe(1);
    });

    it('deve retornar 403 quando requireRH lança erro de acesso', async () => {
      mockRequireRH.mockRejectedValue(new Error('Acesso negado'));
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote?empresa_id=999')
      );
      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MODO GESTOR (ENTIDADE)
  // ─────────────────────────────────────────────────────────────────────────
  describe('modo gestor (entidade)', () => {
    beforeEach(() => {
      mockGetSession.mockReturnValue({ perfil: 'gestor', cpf: '88888888888' });
      mockRequireEntity.mockResolvedValue({
        entidade_id: 77,
        nome: 'Entidade Teste',
      });
    });

    it('deve retornar SEM_LOTE quando nenhum lote liberado via entidade', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.situacao).toBe('SEM_LOTE');
    });

    it('deve retornar COM_PENDENCIAS para entidade com funcionários ativos', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [FUNC_ATIVO] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.situacao).toBe('COM_PENDENCIAS');
      expect(data.lote.id).toBe(1036);
      expect(data.funcionarios).toHaveLength(1);
    });

    it('deve incluir INATIVADO_NO_LOTE para entidade quando inativo faz parte do lote', async () => {
      const funcInativadoNoLote = {
        ...FUNC_INATIVO,
        motivo: 'INATIVADO_NO_LOTE',
        inativacao_lote_id: 1036,
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [FUNC_ATIVO, funcInativadoNoLote] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBe(2);
      expect(
        data.funcionarios.some((f: any) => f.motivo === 'INATIVADO_NO_LOTE')
      ).toBe(true);
    });

    it('deve retornar lote com id real (não numero_ordem)', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      const data = await res.json();
      expect(data.lote.id).toBe(1036);
      expect(data.lote.numero_ordem).toBe(15);
    });

    it('deve retornar 403 quando requireEntity lança erro', async () => {
      mockRequireEntity.mockRejectedValue(new Error('Sem entidade'));
      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      expect(res.status).toBe(403);
    });

    it('deve classificar corretamente funcionários inativados no lote', async () => {
      const funcInativadoNoLote = {
        ...FUNC_ATIVO,
        motivo: 'INATIVADO_NO_LOTE',
        inativacao_lote_id: 1036,
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [funcInativadoNoLote] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      const data = await res.json();
      expect(data.funcionarios[0].motivo).toBe('INATIVADO_NO_LOTE');
      expect(data.funcionarios[0].inativacao_lote_id).toBe(1036);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ESTRUTURA DA RESPOSTA
  // ─────────────────────────────────────────────────────────────────────────
  describe('estrutura da resposta', () => {
    it('SEM_LOTE deve ter campos obrigatórios', async () => {
      mockGetSession.mockReturnValue({ perfil: 'gestor', cpf: '88888888888' });
      mockRequireEntity.mockResolvedValue({ entidade_id: 77 });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      const data = await res.json();
      expect(data).toHaveProperty('situacao', 'SEM_LOTE');
      expect(data).toHaveProperty('lote', null);
      expect(data).toHaveProperty('funcionarios');
      expect(data).toHaveProperty('total', 0);
      expect(data).toHaveProperty('timestamp');
    });

    it('COM_PENDENCIAS deve ter campos obrigatórios', async () => {
      mockGetSession.mockReturnValue({ perfil: 'gestor', cpf: '88888888888' });
      mockRequireEntity.mockResolvedValue({ entidade_id: 77 });
      mockQuery
        .mockResolvedValueOnce({ rows: [LOTE_REF] })
        .mockResolvedValueOnce({ rows: [FUNC_ATIVO] });

      const { GET } = await import('@/app/api/pendencias/lote/route');
      const res = await GET(
        makeRequest('http://localhost:3000/api/pendencias/lote')
      );
      const data = await res.json();
      expect(data).toHaveProperty('situacao', 'COM_PENDENCIAS');
      expect(data.lote).toMatchObject({
        id: expect.any(Number),
        numero_ordem: expect.any(Number),
        liberado_em: expect.any(String),
        status: expect.any(String),
      });
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('contadores');
      expect(data).toHaveProperty('timestamp');
    });
  });
});
