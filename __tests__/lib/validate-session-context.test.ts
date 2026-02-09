jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('db-security — validateSessionContext (regressions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ aceita RH que existe em `funcionarios` (não deve checar `entidades_senhas`)', async () => {
    mockGetSession.mockReturnValue({
      cpf: '19477306061',
      nome: 'Jailson do RH',
      perfil: 'rh',
      clinica_id: 49,
    } as any);

    // Mock behavior: consultas internas feitas por queryWithContext
    mockQuery.mockImplementation(async (text: string, params?: any[]) => {
      if (typeof text === 'string' && text.includes('FROM entidades_senhas')) {
        // comportamento antigo: não deve ser chamado para RH — se chamado, retorna vazio
        return { rows: [], rowCount: 0 } as any;
      }

      if (typeof text === 'string' && text.includes('FROM funcionarios')) {
        return {
          rows: [
            {
              cpf: '19477306061',
              perfil: 'rh',
              ativo: true,
              clinica_id: 49,
            },
          ],
          rowCount: 1,
        } as any;
      }

      if (typeof text === 'string' && text.includes('set_config')) {
        return { rows: [], rowCount: 0 } as any;
      }

      // query principal
      return { rows: [{ ok: 42 }], rowCount: 1 } as any;
    });

    const res = await queryWithContext('SELECT 42 as ok');
    expect(res.rows[0].ok).toBe(42);

    // Verificações importantes: foi consultada a tabela de funcionarios
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'FROM funcionarios WHERE cpf = $1 AND perfil = $2'
      ),
      expect.any(Array)
    );

    // set_config deve ter sido chamado para app.current_user_cpf
    expect(mockQuery).toHaveBeenCalledWith('SELECT set_config($1, $2, false)', [
      'app.current_user_cpf',
      '19477306061',
    ]);
  });

  it('✅ aceita RH que existe em `usuarios` (fallback para arquitetura legada)', async () => {
    mockGetSession.mockReturnValue({
      cpf: '55555555055',
      nome: 'RH Legado em Usuarios',
      perfil: 'rh',
      clinica_id: 2,
    } as any);

    mockQuery.mockImplementation(async (text: string, params?: any[]) => {
      // Primeira busca: funcionarios retorna vazio (triggera fallback)
      if (typeof text === 'string' && text.includes('FROM funcionarios')) {
        return { rows: [], rowCount: 0 } as any;
      }

      // Fallback: usuarios retorna o usuário
      if (typeof text === 'string' && text.includes('FROM usuarios')) {
        return {
          rows: [
            {
              cpf: '55555555055',
              perfil: 'rh',
              tipo_usuario: 'rh',
              ativo: true,
            },
          ],
          rowCount: 1,
        } as any;
      }

      if (typeof text === 'string' && text.includes('set_config')) {
        return { rows: [], rowCount: 0 } as any;
      }

      // query principal
      return { rows: [{ ok: 99 }], rowCount: 1 } as any;
    });

    const res = await queryWithContext('SELECT 99 as ok');
    expect(res.rows[0].ok).toBe(99);

    // Verificar que ambas as tabelas foram consultadas (fallback ativado)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'FROM funcionarios WHERE cpf = $1 AND perfil = $2'
      ),
      expect.any(Array)
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'FROM usuarios WHERE cpf = $1 AND tipo_usuario = $2'
      ),
      expect.any(Array)
    );

    // set_config deve ter sido chamado mesmo com fallback
    expect(mockQuery).toHaveBeenCalledWith('SELECT set_config($1, $2, false)', [
      'app.current_user_cpf',
      '55555555055',
    ]);
  });

  it('❌ rejeita RH não encontrado ou inativo em `funcionarios` e `usuarios`', async () => {
    mockGetSession.mockReturnValue({
      cpf: '99999999999',
      nome: 'RH Inexistente',
      perfil: 'rh',
      clinica_id: 1,
    } as any);

    mockQuery.mockImplementation(async (text: string) => {
      if (typeof text === 'string' && text.includes('FROM funcionarios')) {
        return { rows: [], rowCount: 0 } as any;
      }

      if (typeof text === 'string' && text.includes('FROM usuarios')) {
        return { rows: [], rowCount: 0 } as any;
      }

      if (typeof text === 'string' && text.includes('set_config')) {
        return { rows: [], rowCount: 0 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });

    await expect(queryWithContext('SELECT 1')).rejects.toThrow(
      'SEGURANÇA: Contexto de sessão inválido - usuário não encontrado ou inativo'
    );

    // Verificar que ambas as tabelas foram consultadas
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'FROM funcionarios WHERE cpf = $1 AND perfil = $2'
      ),
      expect.any(Array)
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        'FROM usuarios WHERE cpf = $1 AND tipo_usuario = $2'
      ),
      expect.any(Array)
    );
  });
});
