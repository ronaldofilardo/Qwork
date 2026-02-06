import { GET as getAcessosRH } from '@/app/api/admin/auditorias/acessos-rh/route';
import { GET as getAcessosFuncionarios } from '@/app/api/admin/auditorias/acessos-funcionarios/route';
import { GET as getAvaliacoes } from '@/app/api/admin/auditorias/avaliacoes/route';
// REMOVIDO: import { GET as getLotes } from '@/app/api/admin/auditorias/lotes/route';
// REMOVIDO: import { GET as getLaudos } from '@/app/api/admin/auditorias/laudos/route';
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
            status: 'concluido',
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
      expect(data.avaliacoes[0].status).toBe('concluido');
      expect(data.avaliacoes[0].possui_anomalia).toBe(false);
    });
  });

  // REMOVIDO: Testes de /api/admin/auditorias/lotes
  // Admin não deve ter acesso a dados operacionais (lotes, laudos)

  // REMOVIDO: Testes de /api/admin/auditorias/laudos
  // Admin não deve ter acesso a dados operacionais (lotes, laudos)

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

