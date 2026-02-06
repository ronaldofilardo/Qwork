/**
 * Testes unitários para criarEmissorIndependente em lib/db.ts
 * Valida criação de emissores sem clinica_id
 */

import { query, criarEmissorIndependente } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs');

describe('lib/db - criarEmissorIndependente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Limpar emissores de teste (agora armazenados em usuarios)
    await query("DELETE FROM usuarios WHERE cpf LIKE '999%'");
  });

  it('deve criar emissor com clinica_id NULL', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Admin Teste',
      perfil: 'admin' as const,
      clinica_id: null,
    };

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$mockedHash');

    const emissor = await criarEmissorIndependente(
      '99900000001',
      'Emissor Teste 1',
      'emissor1@teste.com',
      undefined,
      mockSession
    );

    expect(emissor.cpf).toBe('99900000001');
    expect(emissor.nome).toBe('Emissor Teste 1');
    expect(emissor.email).toBe('emissor1@teste.com');
    expect(emissor.clinica_id).toBeNull();

    // Verificar que foi inserido no banco (tabela usuarios)
    const result = await query(
      'SELECT cpf, nome, email, role, ativo FROM usuarios WHERE cpf = $1',
      ['99900000001']
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].role).toBe('emissor');
    expect(result.rows[0].ativo).toBe(true);
  });

  it('deve criar emissor com senha customizada', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Admin Teste',
      perfil: 'admin' as const,
      clinica_id: null,
    };

    const senhaCustomizada = 'SenhaSegura@123';

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$customHash');

    await criarEmissorIndependente(
      '99900000002',
      'Emissor Teste 2',
      'emissor2@teste.com',
      senhaCustomizada,
      mockSession
    );

    // Verificar que bcrypt.hash foi chamado com a senha customizada
    expect(bcrypt.hash).toHaveBeenCalledWith(senhaCustomizada, 10);

    // Verificar no banco (usuarios)
    const result = await query(
      'SELECT senha_hash FROM usuarios WHERE cpf = $1',
      ['99900000002']
    );

    expect(result.rows[0].senha_hash).toBe('$2a$10$customHash');
  });

  it('deve usar senha padrão 123456 se não fornecida', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Admin Teste',
      perfil: 'admin' as const,
      clinica_id: null,
    };

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$defaultHash');

    await criarEmissorIndependente(
      '99900000003',
      'Emissor Teste 3',
      'emissor3@teste.com',
      undefined,
      mockSession
    );

    // Verificar que bcrypt.hash foi chamado com senha padrão
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
  });

  it('deve remover formatação do CPF', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Admin Teste',
      perfil: 'admin' as const,
      clinica_id: null,
    };

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$mockedHash');

    const cpfFormatado = '999.000.000-04';

    const emissor = await criarEmissorIndependente(
      cpfFormatado,
      'Emissor Teste 4',
      'emissor4@teste.com',
      undefined,
      mockSession
    );

    // CPF deve estar limpo (sem pontos e traços)
    expect(emissor.cpf).toBe('99900000004');

    // Verificar no banco
    const result = await query('SELECT cpf FROM usuarios WHERE cpf = $1', [
      '99900000004',
    ]);

    expect(result.rows.length).toBe(1);
  });

  it('deve rejeitar se usuário não for admin', async () => {
    const mockSessionRH = {
      cpf: '22222222222',
      nome: 'RH Teste',
      perfil: 'rh' as const,
      clinica_id: 1,
    };

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$mockedHash');

    await expect(
      criarEmissorIndependente(
        '99900000005',
        'Emissor Teste 5',
        'emissor5@teste.com',
        undefined,
        mockSessionRH
      )
    ).rejects.toThrow(
      'Apenas administradores podem criar emissores independentes'
    );
  });

  it('deve rejeitar CPF duplicado', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Admin Teste',
      perfil: 'admin' as const,
      clinica_id: null,
    };

    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$mockedHash');

    // Criar primeiro emissor
    await criarEmissorIndependente(
      '99900000006',
      'Emissor Teste 6',
      'emissor6@teste.com',
      undefined,
      mockSession
    );

    // Tentar criar novamente com mesmo CPF - deve fazer upsert (não lançar)
    await expect(
      criarEmissorIndependente(
        '99900000006',
        'Emissor Duplicado',
        'duplicado@teste.com',
        undefined,
        mockSession
      )
    ).resolves.not.toThrow();

    // Verificar que há apenas um registro na tabela usuarios
    const res = await query(
      'SELECT COUNT(*) as cnt FROM usuarios WHERE cpf = $1',
      ['99900000006']
    );
    expect(parseInt(res.rows[0].cnt, 10)).toBe(1);
  });

  it('deve criar emissor sem session (para scripts)', async () => {
    // Mock do bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$mockedHash');

    // Criar sem session (não validará perfil)
    const emissor = await criarEmissorIndependente(
      '99900000007',
      'Emissor Teste 7',
      'emissor7@teste.com',
      undefined,
      undefined
    );

    expect(emissor.cpf).toBe('99900000007');
    expect(emissor.clinica_id).toBeNull();
  });
});
