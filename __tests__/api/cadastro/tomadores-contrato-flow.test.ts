/**
 * __tests__/api/cadastro/tomadores-contrato-flow.test.ts
 *
 * Testa o fluxo completo de cadastro de tomador (entidade/clínica)
 * incluindo criação de contrato e aceite.
 */

import { query } from '@/lib/db';
import { obterContrato } from '@/lib/contratos/contratos';

// Mock data para teste
const tomadorTestData = {
  tipo: 'entidade',
  nome: 'Empresa Teste Contrato',
  cnpj: '12.345.678/0001-99',
  inscricao_estadual: 'IE123456',
  email: `test-contrato-${Date.now()}@example.com`,
  telefone: '1133334444',
  endereco: 'Rua Teste, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  numero_funcionarios_estimado: 50,
  responsavel_nome: 'João Silva',
  responsavel_cpf: '12345678901',
  responsavel_cargo: 'Gestor RH',
  responsavel_email: 'joao@example.com',
  responsavel_celular: '11987654321',
};

describe('Fluxo de Cadastro de Tomador com Contrato', () => {
  let entidadeId: number;
  let contratoId: number;

  beforeAll(async () => {
    // Limpar dados de teste anteriores se existirem
    const existentes = await query(
      'SELECT id FROM entidades WHERE email = $1',
      [tomadorTestData.email]
    );
    if (existentes.rows.length > 0) {
      await query(
        'DELETE FROM contratos WHERE tomador_id = $1 AND tipo_tomador = $2',
        [existentes.rows[0].id, 'entidade']
      );
      await query('DELETE FROM entidades WHERE id = $1', [
        existentes.rows[0].id,
      ]);
    }
  });

  test('✅ Criar entidade (tomador)', async () => {
    const cnpjLimpo = tomadorTestData.cnpj.replace(/[^\d]/g, '');
    const result = await query(
      `INSERT INTO entidades (
        nome, cnpj, inscricao_estadual, email, telefone,
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        status, numero_funcionarios_estimado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16
      ) RETURNING id, nome, status`,
      [
        tomadorTestData.nome,
        cnpjLimpo,
        tomadorTestData.inscricao_estadual,
        tomadorTestData.email,
        tomadorTestData.telefone,
        tomadorTestData.endereco,
        tomadorTestData.cidade,
        tomadorTestData.estado,
        tomadorTestData.cep,
        tomadorTestData.responsavel_nome,
        tomadorTestData.responsavel_cpf.replace(/[^\d]/g, ''),
        tomadorTestData.responsavel_cargo,
        tomadorTestData.responsavel_email,
        tomadorTestData.responsavel_celular,
        'pendente',
        tomadorTestData.numero_funcionarios_estimado,
      ]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].nome).toBe(tomadorTestData.nome);
    expect(result.rows[0].status).toBe('pendente');

    entidadeId = result.rows[0].id;
  });

  test('✅ Criar contrato para entidade', async () => {
    const result = await query(
      `INSERT INTO contratos (tomador_id, numero_funcionarios, valor_total, status, aceito, tipo_tomador)
       VALUES ($1, $2, $3, $4, false, $5) RETURNING id, tomador_id, tipo_tomador, status, aceito`,
      [
        entidadeId,
        tomadorTestData.numero_funcionarios_estimado,
        null,
        'aguardando_aceite',
        'entidade',
      ]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].tomador_id).toBe(entidadeId);
    expect(result.rows[0].tipo_tomador).toBe('entidade');
    expect(result.rows[0].status).toBe('aguardando_aceite');
    expect(result.rows[0].aceito).toBe(false);

    contratoId = result.rows[0].id;
  });

  test('✅ Recuperar contrato por ID (obterContrato)', async () => {
    const contrato = await obterContrato(contratoId);

    expect(contrato).toBeDefined();
    expect(contrato.id).toBe(contratoId);
    expect(contrato.tomador_id).toBe(entidadeId);
    expect(contrato.tipo_tomador).toBe('entidade');
    expect(contrato.tomador_nome).toBe(tomadorTestData.nome);
    expect(contrato.tomador_cnpj).toBe(
      tomadorTestData.cnpj.replace(/[^\d]/g, '')
    );
    expect(contrato.aceito).toBe(false);
    // Deve ter conteúdo padrão carregado
    expect(contrato.conteudo).toBeDefined();
    expect(contrato.conteudo.length).toBeGreaterThan(0);
  });

  test('✅ Aceitar contrato (UPDATE)', async () => {
    const ip = '192.168.1.1';
    const result = await query(
      `UPDATE contratos 
       SET aceito = true, ip_aceite = $1, data_aceite = NOW()
       WHERE id = $2
       RETURNING id, aceito, data_aceite, ip_aceite`,
      [ip, contratoId]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].aceito).toBe(true);
    expect(result.rows[0].ip_aceite).toBe(ip);
    expect(result.rows[0].data_aceite).toBeDefined();
  });

  test('✅ Recuperar contrato aceito com credenciais', async () => {
    const contrato = await obterContrato(contratoId);

    expect(contrato).toBeDefined();
    expect(contrato.aceito).toBe(true);
    expect(contrato.data_aceite).toBeDefined();
    expect(contrato.tomador_cnpj).toBeDefined();

    // Calcular credenciais como faria o backend
    const cleanCnpj = contrato.tomador_cnpj.replace(/[./-]/g, '');
    const credenciais = {
      login: cleanCnpj,
      senha: cleanCnpj.slice(-6),
    };

    expect(credenciais.login).toHaveLength(14);
    expect(credenciais.senha).toHaveLength(6);
  });

  afterAll(async () => {
    // Limpeza
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (entidadeId) {
      await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    }
  });
});
