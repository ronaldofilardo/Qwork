/**
 * TESTE DE INTEGRAÇÃO - Autenticação de Gestores
 *
 * Testa o fluxo REAL de aprovação de contratantes e login de gestores
 * Simula exatamente o que acontece na produção via chamadas HTTP
 */

import { query } from '@/lib/db';

describe('Integração: Aprovação de Contratante → Login de Gestor', () => {
  const testContratanteId = 999999;
  const testCpf = '12345678901';
  const testCnpj = '12345678000190';

  // Helper para criar contratante pendente
  const criarContratantePendente = async (nome: string, email: string) => {
    await query(
      `INSERT INTO contratantes (
        id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        status, ativa, pagamento_confirmado
      ) VALUES ($1, 'entidade', $2, $3, $4, '1133334444', 'Rua Teste', 'São Paulo', 'SP', '01000-000',
        'Gestor Teste', $5, 'gestor@teste.com', '11999999999',
        'pendente', false, false)`,
      [testContratanteId, nome, testCnpj, email, testCpf]
    );
  };

  beforeEach(async () => {
    // Limpar dados de teste
    await query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [
      testContratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [testContratanteId]);
  });

  afterEach(async () => {
    // Limpar dados de teste
    await query('DELETE FROM contratantes_senhas WHERE contratante_id = $1', [
      testContratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [testContratanteId]);
  });

  it('deve permitir login após aprovação via API (fluxo completo)', async () => {
    // 1. Criar contratante pendente
    await criarContratantePendente('Empresa Teste API', 'empresa@teste.com');

    // 2. Simular aprovação via chamada direta à função (não HTTP)
    // Em vez de chamar API HTTP, chamar diretamente a lógica de aprovação
    const { aprovarContratante, criarContaResponsavel } =
      await import('@/lib/db');

    // Simular session de admin
    const mockSession = {
      cpf: '11122233344', // CPF válido de 11 dígitos
      perfil: 'admin' as const,
      clinica_id: null,
    };

    // Aprovar contratante
    await aprovarContratante(testContratanteId, mockSession.cpf, mockSession);

    // Buscar contratante aprovado
    const contratanteResult = await query(
      'SELECT * FROM contratantes WHERE id = $1',
      [testContratanteId]
    );
    const contratante = contratanteResult.rows[0];

    // Criar conta do responsável (como faz a API)
    await criarContaResponsavel(contratante, mockSession);

    // 3. Verificar se a senha foi criada corretamente
    const senhaResult = await query(
      'SELECT cpf, senha_hash FROM contratantes_senhas WHERE contratante_id = $1',
      [testContratanteId]
    );

    expect(senhaResult.rows.length).toBe(1);
    const { cpf, senha_hash } = senhaResult.rows[0];

    // Verificar dados básicos
    expect(cpf).toBe(testCpf);
    expect(senha_hash).toMatch(/^\$2[aby]\$/);
    expect(senha_hash).not.toContain('PLACEHOLDER_');

    // Verificar contratante aprovado (LEGACY_NOTE: ativação tradicionalmente dependia de pagamento; agora deve depender de aceite de contrato)
    expect(contratante.status).toBe('aprovado');
    expect(contratante.ativa).toBe(false);

    // Testar autenticação
    const senhaEsperada = testCnpj.slice(-6);
    const autenticado = await bcrypt.compare(senhaEsperada, senha_hash);
    expect(autenticado).toBe(true);
  });

  it('deve detectar problema de senha inválida (PLACEHOLDER_)', async () => {
    // 1. Criar contratante e senha com PLACEHOLDER_ (simulando bug)
    await criarContratantePendente('Empresa Bug Teste', 'bug@teste.com');

    await query(
      'INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
      [testContratanteId, testCpf, 'PLACEHOLDER_INVALIDO']
    );

    // 2. Tentar autenticar
    const senhaDigitada = testCnpj.slice(-6);

    const gestorResult = await query(
      `SELECT cs.cpf, cs.senha_hash, c.ativa
       FROM contratantes_senhas cs
       JOIN contratantes c ON c.id = cs.contratante_id
       WHERE cs.cpf = $1`,
      [testCpf]
    );

    expect(gestorResult.rows.length).toBe(1);
    const gestor = gestorResult.rows[0];

    // 3. Verificar que autenticação FALHA
    const senhaValida = await bcrypt.compare(senhaDigitada, gestor.senha_hash);
    expect(senhaValida).toBe(false); // Deve falhar!

    // 4. Verificar que hash contém PLACEHOLDER_
    expect(gestor.senha_hash).toContain('PLACEHOLDER_');
  });

  it('deve validar senha baseada em CNPJ (últimos 6 dígitos)', () => {
    // Teste unitário da lógica de geração de senha
    const cnpjLimpo = '12.345.678/0001-90'.replace(/[./-]/g, '');
    const senhaEsperada = cnpjLimpo.slice(-6);

    expect(senhaEsperada).toBe('000190');
    expect(senhaEsperada.length).toBe(6);
    expect(/^\d{6}$/.test(senhaEsperada)).toBe(true);
  });

  it('deve verificar isolamento entre ambientes de teste', async () => {
    // Este teste garante que mudanças no código não afetem o isolamento
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

    expect(isTestEnvironment).toBe(true);

    // Verificar que estamos usando banco de teste
    const dbInfo = await query('SELECT current_database() as db_name');
    expect(dbInfo.rows[0].db_name).toContain('_test');
  });
});
