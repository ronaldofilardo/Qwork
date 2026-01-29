import { GET as getAcessosRH } from '@/app/api/admin/auditorias/acessos-rh/route';
import { GET as getAcessosFuncionarios } from '@/app/api/admin/auditorias/acessos-funcionarios/route';
import { GET as getAvaliacoes } from '@/app/api/admin/auditorias/avaliacoes/route';
import { GET as getLotes } from '@/app/api/admin/auditorias/lotes/route';
import { GET as getLaudos } from '@/app/api/admin/auditorias/laudos/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('APIs de Auditoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/admin/auditorias/acessos-rh', () => {
    it('deve retornar acessos de RH para admin', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            cpf_funcionario: '12345678909',
            nome_funcionario: 'Maria RH',
            perfil: 'rh',
            clinica_id: 1,
            clinica_nome: 'Clínica Teste',
            login_timestamp: '2024-01-01T08:00:00.000Z',
            logout_timestamp: '2024-01-01T18:00:00.000Z',
            duracao_sessao: '10:00:00',
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
          },
        ],
        rowCount: 1,
      });

      const response = await getAcessosRH();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.acessos).toHaveLength(1);
      expect(data.acessos[0].nome_funcionario).toBe('Maria RH');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM vw_auditoria_acessos_rh')
      );
    });

    it('deve retornar 403 se não for admin', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const response = await getAcessosRH();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('/api/admin/auditorias/acessos-funcionarios', () => {
    it('deve retornar acessos de funcionários com CPF completo', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 2,
            cpf_anonimizado: '12345678900', // CPF completo (não anonimizado)
            clinica_id: 1,
            clinica_nome: 'Clínica Teste',
            empresa_id: 10,
            empresa_nome: 'Empresa ABC',
            inclusao: '2024-01-01T00:00:00.000Z',
            inativacao: null,
            login_timestamp: '2024-01-02T09:00:00.000Z',
            logout_timestamp: '2024-01-02T17:00:00.000Z',
            session_duration: '08:00:00',
            ip_address: '10.0.0.1',
          },
        ],
        rowCount: 1,
      });

      const response = await getAcessosFuncionarios();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.acessos).toHaveLength(1);
      expect(data.acessos[0].cpf_anonimizado).toBe('12345678900');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM vw_auditoria_acessos_funcionarios')
      );
    });
  });

  describe('/api/admin/auditorias/avaliacoes', () => {
    it('deve retornar auditoria de avaliações', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            avaliacao_id: 100,
            funcionario_cpf: '11111111111',
            funcionario_nome: 'Pedro Teste',
            empresa_id: 5,
            empresa_nome: 'Empresa XYZ',
            clinica_id: 1,
            clinica_nome: 'Clínica Teste',
            status: 'concluida',
            criado_em: '2024-01-01T00:00:00.000Z',
            concluido_em: '2024-01-01T00:30:00.000Z',
            total_perguntas: 80,
            perguntas_respondidas: 80,
            possui_anomalia: false,
            anomalia_tipo: null,
          },
        ],
        rowCount: 1,
      });

      const response = await getAvaliacoes();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.avaliacoes).toHaveLength(1);
      expect(data.avaliacoes[0].status).toBe('concluida');
      expect(data.avaliacoes[0].possui_anomalia).toBe(false);
    });
  });

  describe('/api/admin/auditorias/lotes', () => {
    it('deve retornar auditoria de lotes', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            lote_id: 50,
            lote_nome: 'Lote Janeiro 2024',
            clinica_id: 1,
            clinica_nome: 'Clínica Teste',
            empresa_id: 5,
            empresa_nome: 'Empresa XYZ',
            criado_por_cpf: '12345678909',
            criado_por_nome: 'Maria RH',
            status: 'ativo',
            total_funcionarios: 25,
            avaliacoes_pendentes: 5,
            avaliacoes_em_andamento: 10,
            avaliacoes_concluidas: 10,
            criado_em: '2024-01-01T00:00:00.000Z',
          },
        ],
        rowCount: 1,
      });

      const response = await getLotes();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lotes).toHaveLength(1);
      expect(data.lotes[0].total_funcionarios).toBe(25);
      expect(data.lotes[0].status).toBe('ativo');
    });
  });

  describe('/api/admin/auditorias/laudos', () => {
    it('deve retornar auditoria de laudos', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            laudo_id: 200,
            hash_pdf: 'abc123def456',
            empresa_id: 5,
            empresa_nome: 'Empresa XYZ',
            clinica_id: 1,
            clinica_nome: 'Clínica Teste',
            lote_id: 50,
            lote_nome: 'Lote Janeiro 2024',
            emitido_por_cpf: '99999999999',
            emitido_por_nome: 'Carlos Emissor',
            data_emissao: '2024-01-15T10:00:00.000Z',
            total_funcionarios_analisados: 20,
            possui_pdf: true,
          },
        ],
        rowCount: 1,
      });

      const response = await getLaudos();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.laudos).toHaveLength(1);
      expect(data.laudos[0].hash_pdf).toBe('abc123def456');
      expect(data.laudos[0].possui_pdf).toBe(true);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve retornar erro 500 em caso de falha no banco', async () => {
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await getAvaliacoes();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Erro');
    });
  });
});
