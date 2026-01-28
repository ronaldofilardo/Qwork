import { POST, GET } from '@/app/api/admin/emissores/route';
import { PATCH } from '@/app/api/admin/emissores/[cpf]/route';
import { query, QueryResult } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis para simular comportamentos diversos (ISSUE #TESTING-001)
// Mocks
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/audit');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockLogAudit = logAudit as jest.MockedFunction<typeof logAudit>;

// Sessão de admin padrão para os testes (é passada como contexto RLS)
const adminSession: Session = {
  cpf: 'admin123',
  nome: 'Admin',
  perfil: 'admin',
} as Session;

describe('/api/admin/emissores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('deve retornar lista de emissores para admin', async () => {
      // requireRole agora retorna a session para ser passada à query (RLS context)
      mockRequireRole.mockResolvedValue(adminSession);

      mockQuery.mockResolvedValue({
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Teste',
            email: 'emissor@teste.com',
            ativo: true,
            criado_em: '2024-01-01T00:00:00.000Z',
            atualizado_em: '2024-01-01T00:00:00.000Z',
            total_laudos_emitidos: 5,
          },
        ],
        rowCount: 1,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emissores).toHaveLength(1);
      expect(data.emissores[0].nome).toBe('Emissor Teste');
      expect(data.emissores[0]).not.toHaveProperty('clinica_id'); // Emissores não têm clinica_id

      // Assegurar que a query recebeu o contexto de sessão (para RLS)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.objectContaining({ perfil: 'admin' })
      );
    });

    it('deve retornar 403 se não for admin', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('POST', () => {
    const validEmissor = {
      cpf: '12345678909',
      nome: 'Novo Emissor',
      email: 'novo@emissor.com',
      senha: '123456',
    };

    it('deve criar emissor com sucesso', async () => {
      mockRequireRole.mockResolvedValue(adminSession);

      const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as any);

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult);
      mockQuery.mockResolvedValueOnce({
        // INSERT emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Novo Emissor',
            email: 'novo@emissor.com',
            ativo: true,
            clinica_id: null, // Emissores têm clinica_id null
            criado_em: '2024-01-01T00:00:00.000Z',
          },
        ],
      } as any);
      mockLogAudit.mockResolvedValue(undefined);

      const request = new Request('http://localhost:3000/api/admin/emissores', {
        method: 'POST',
        body: JSON.stringify(validEmissor),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.emissor.nome).toBe('Novo Emissor');
      expect(data.emissor.clinica_id).toBeNull(); // Confirma que clinica_id é null

      // Verificar que a query foi chamada com contexto de sessão (RLS)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ perfil: 'admin' })
      );
    });

    it('deve rejeitar emissor sem campos obrigatórios', async () => {
      mockRequireRole.mockResolvedValue(adminSession);

      const request = new Request('http://localhost:3000/api/admin/emissores', {
        method: 'POST',
        body: JSON.stringify({ cpf: '12345678909' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatórios');
    });

    it('deve rejeitar CPF inválido', async () => {
      mockRequireRole.mockResolvedValue(adminSession);

      const request = new Request('http://localhost:3000/api/admin/emissores', {
        method: 'POST',
        body: JSON.stringify({
          ...validEmissor,
          cpf: '12345678900', // CPF inválido
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('CPF inválido');
    });

    it('deve rejeitar CPF duplicado', async () => {
      mockRequireRole.mockResolvedValue(adminSession);
      mockQuery.mockResolvedValue({
        rows: [{ cpf: '12345678909' }],
        rowCount: 1,
      });

      const request = new Request('http://localhost:3000/api/admin/emissores', {
        method: 'POST',
        body: JSON.stringify(validEmissor),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('CPF já cadastrado');
    });
  });

  describe('PATCH', () => {
    it('deve atualizar emissor com sucesso', async () => {
      mockRequireRole.mockResolvedValue(adminSession);
      mockQuery.mockResolvedValueOnce({
        // Verificar emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Antigo',
            email: 'antigo@teste.com',
            ativo: true,
            clinica_id: null, // Emissores têm clinica_id null
            perfil: 'emissor',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        // UPDATE emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Atualizado',
            email: 'novo@teste.com',
            ativo: true,
            clinica_id: null,
            atualizado_em: '2024-01-02T00:00:00.000Z',
          },
        ],
      });
      mockLogAudit.mockResolvedValue(undefined);

      const request = new Request(
        'http://localhost:3000/api/admin/emissores/12345678909',
        {
          method: 'PATCH',
          body: JSON.stringify({
            nome: 'Emissor Atualizado',
            email: 'novo@teste.com',
          }),
        }
      );

      const response = await PATCH(request, { params: { cpf: '12345678909' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emissor.nome).toBe('Emissor Atualizado');
      expect(data.emissor.clinica_id).toBeNull(); // Confirma que permanece null

      // Verificar que a query recebeu a sessão (RLS)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ perfil: 'admin' })
      );
    });

    it('deve rejeitar se emissor não existe', async () => {
      mockRequireRole.mockResolvedValue(adminSession);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const request = new Request(
        'http://localhost:3000/api/admin/emissores/12345678909',
        {
          method: 'PATCH',
          body: JSON.stringify({ nome: 'Teste' }),
        }
      );

      const response = await PATCH(request, { params: { cpf: '12345678909' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Emissor não encontrado');
    });

    it('deve rejeitar se usuário não é emissor', async () => {
      mockRequireRole.mockResolvedValue(adminSession);
      mockQuery.mockResolvedValue({
        rows: [
          {
            cpf: '12345678909',
            perfil: 'rh', // Não é emissor
          },
        ],
        rowCount: 1,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/emissores/12345678909',
        {
          method: 'PATCH',
          body: JSON.stringify({ nome: 'Teste' }),
        }
      );

      const response = await PATCH(request, { params: { cpf: '12345678909' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Usuário não é emissor');
    });
  });

  describe('Emissor Global Access', () => {
    it('deve criar emissor sem clinica_id (acesso global)', async () => {
      mockRequireRole.mockResolvedValue(adminSession);

      const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
      mockBcrypt.hash.mockResolvedValue('hashedPassword') as any;

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Verificar CPF
      mockQuery.mockResolvedValueOnce({
        // INSERT emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Global',
            email: 'global@emissor.com',
            ativo: true,
            clinica_id: null,
            criado_em: '2024-01-01T00:00:00.000Z',
          },
        ],
      });
      mockLogAudit.mockResolvedValue(undefined);

      const request = new Request('http://localhost:3000/api/admin/emissores', {
        method: 'POST',
        body: JSON.stringify({
          cpf: '12345678909',
          nome: 'Emissor Global',
          email: 'global@emissor.com',
          senha: '123456',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.emissor.clinica_id).toBeNull();
      expect(data.emissor.perfil).toBeUndefined(); // Não retorna perfil na resposta
    });

    it('deve permitir atualizar emissor mantendo clinica_id null', async () => {
      mockRequireRole.mockResolvedValue(adminSession);
      mockQuery.mockResolvedValueOnce({
        // Verificar emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Global',
            email: 'global@emissor.com',
            ativo: true,
            clinica_id: null,
            perfil: 'emissor',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        // UPDATE emissor
        rows: [
          {
            cpf: '12345678909',
            nome: 'Emissor Global Atualizado',
            email: 'global@emissor.com',
            ativo: true,
            clinica_id: null,
            atualizado_em: '2024-01-02T00:00:00.000Z',
          },
        ],
      });
      mockLogAudit.mockResolvedValue(undefined);

      const request = new Request(
        'http://localhost:3000/api/admin/emissores/12345678909',
        {
          method: 'PATCH',
          body: JSON.stringify({
            nome: 'Emissor Global Atualizado',
          }),
        }
      );

      const response = await PATCH(request, { params: { cpf: '12345678909' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emissor.clinica_id).toBeNull();
    });
  });
});
