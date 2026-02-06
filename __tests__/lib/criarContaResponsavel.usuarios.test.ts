/**
 * Testes para criarContaResponsavel - validar criação em USUARIOS
 * Data: 05/02/2026
 * Descrição: Garantir que gestores são criados em usuarios (não em funcionarios)
 */

import { query } from '@/lib/db';
import * as db from '@/lib/db';

describe('criarContaResponsavel - criação em usuarios', () => {
  beforeAll(async () => {
    // Garantir que tabela usuarios existe
    const tableCheck = await query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') AS existe"
    );
    if (!tableCheck.rows[0].existe) {
      throw new Error(
        'Tabela usuarios não existe. Execute migração 300 primeiro.'
      );
    }
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await query(
      "DELETE FROM usuarios WHERE cpf IN ('11122233344', '55566677788')"
    );
    // Usar função segura para deletar senhas (trigger de proteção pode bloquear DELETE direto)
    await query('SELECT fn_delete_senha_autorizado($1, $2)', [
      9001,
      'limpeza testes',
    ]).catch(() => {});
    await query('SELECT fn_delete_senha_autorizado($1, $2)', [
      9002,
      'limpeza testes',
    ]).catch(() => {});
    await query('DELETE FROM contratantes WHERE id IN (9001, 9002)');
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query(
      "DELETE FROM usuarios WHERE cpf IN ('11122233344', '55566677788')"
    );
    // Usar função segura para deletar senhas
    await query('SELECT fn_delete_senha_autorizado($1, $2)', [
      9001,
      'limpeza testes',
    ]).catch(() => {});
    await query('SELECT fn_delete_senha_autorizado($1, $2)', [
      9002,
      'limpeza testes',
    ]).catch(() => {});
    await query('DELETE FROM contratantes WHERE id IN (9001, 9002)');
  });

  test('deve criar usuario gestor para contratante tipo entidade', async () => {
    // Arrange: criar contratante entidade
    await query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, 
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES (9001, 'entidade', 'Empresa Teste Ltda', '11222333000144', 'contato@empresa.com', 
        '11999990001', 'Rua Teste, 123', 'São Paulo', 'SP', '01000-000',
        'João Silva', '11122233344', 'joao@empresa.com', '11999990002', 'aprovado', true)`,
      []
    );

    const contratante = {
      id: 9001,
      tipo: 'entidade',
      responsavel_cpf: '11122233344',
      responsavel_nome: 'João Silva',
      responsavel_email: 'joao@empresa.com',
      cnpj: '11222333000144',
    } as any;

    // Act
    await db.criarContaResponsavel(contratante);

    // Assert: verificar que foi criado em usuarios
    const usuario = await query('SELECT * FROM usuarios WHERE cpf = $1', [
      '11122233344',
    ]);

    expect(usuario.rows.length).toBe(1);
    expect(usuario.rows[0].tipo_usuario).toBe('gestor');
    expect(usuario.rows[0].contratante_id).toBe(9001);
    expect(usuario.rows[0].clinica_id).toBeNull();
    expect(usuario.rows[0].ativo).toBe(true);
    expect(usuario.rows[0].nome).toBe('João Silva');
    expect(usuario.rows[0].email).toBe('joao@empresa.com');

    // Verificar senha em entidades_senhas
    const senha = await query(
      'SELECT * FROM entidades_senhas WHERE cpf = $1 AND contratante_id = $2',
      ['11122233344', 9001]
    );
    expect(senha.rows.length).toBe(1);
  });

  test('deve criar usuario rh para contratante tipo clinica', async () => {
    // Arrange: criar contratante clinica
    await query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES (9002, 'clinica', 'Clínica Teste Ltda', '55666777000188', 'contato@clinica.com',
        '11999990003', 'Av Teste, 456', 'São Paulo', 'SP', '02000-000',
        'Maria Santos', '55566677788', 'maria@clinica.com', '11999990004', 'aprovado', true)`,
      []
    );

    const contratante = {
      id: 9002,
      tipo: 'clinica',
      responsavel_cpf: '55566677788',
      responsavel_nome: 'Maria Santos',
      responsavel_email: 'maria@clinica.com',
      cnpj: '55666777000188',
    } as any;

    // Act
    await db.criarContaResponsavel(contratante);

    // Assert: verificar que foi criado em usuarios
    const usuario = await query('SELECT * FROM usuarios WHERE cpf = $1', [
      '55566677788',
    ]);

    expect(usuario.rows.length).toBe(1);
    expect(usuario.rows[0].tipo_usuario).toBe('rh');
    expect(usuario.rows[0].contratante_id).toBeNull();
    expect(usuario.rows[0].clinica_id).not.toBeNull(); // deve ter vinculado a clinica
    expect(usuario.rows[0].ativo).toBe(true);
    expect(usuario.rows[0].nome).toBe('Maria Santos');
    expect(usuario.rows[0].email).toBe('maria@clinica.com');

    // Verificar senha em entidades_senhas
    const senha = await query(
      'SELECT * FROM entidades_senhas WHERE cpf = $1 AND contratante_id = $2',
      ['55566677788', 9002]
    );
    expect(senha.rows.length).toBe(1);
  });

  test('deve atualizar usuario existente ao invés de criar duplicado', async () => {
    // Arrange: criar contratante
    await query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES (9001, 'entidade', 'Empresa Teste Ltda', '11222333000144', 'contato@empresa.com',
        '11999990001', 'Rua Teste, 123', 'São Paulo', 'SP', '01000-000',
        'João Silva', '11122233344', 'joao@empresa.com', '11999990002', 'aprovado', true)`,
      []
    );

    // Criar usuario previamente
    await query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, contratante_id, ativo)
       VALUES ('11122233344', 'João Antigo', 'joao.antigo@email.com', 'hash_antigo', 'gestor', 9001, false)`,
      []
    );

    const contratante = {
      id: 9001,
      tipo: 'entidade',
      responsavel_cpf: '11122233344',
      responsavel_nome: 'João Silva Atualizado',
      responsavel_email: 'joao.novo@empresa.com',
      cnpj: '11222333000144',
    } as any;

    // Act
    await db.criarContaResponsavel(contratante);

    // Assert: verificar que foi atualizado (não duplicado)
    const usuarios = await query('SELECT * FROM usuarios WHERE cpf = $1', [
      '11122233344',
    ]);

    expect(usuarios.rows.length).toBe(1); // não duplicou
    expect(usuarios.rows[0].nome).toBe('João Silva Atualizado'); // atualizado
    expect(usuarios.rows[0].email).toBe('joao.novo@empresa.com'); // atualizado
    expect(usuarios.rows[0].ativo).toBe(true); // reativado
  });

  test('NÃO deve criar registro em funcionarios para gestores', async () => {
    // Arrange
    await query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES (9001, 'entidade', 'Empresa Teste Ltda', '11222333000144', 'contato@empresa.com',
        '11999990001', 'Rua Teste, 123', 'São Paulo', 'SP', '01000-000',
        'João Silva', '11122233344', 'joao@empresa.com', '11999990002', 'aprovado', true)`,
      []
    );

    const contratante = {
      id: 9001,
      tipo: 'entidade',
      responsavel_cpf: '11122233344',
      responsavel_nome: 'João Silva',
      responsavel_email: 'joao@empresa.com',
      cnpj: '11222333000144',
    } as any;

    // Act
    await db.criarContaResponsavel(contratante);

    // Assert: verificar que NÃO foi criado em funcionarios
    const funcionario = await query(
      "SELECT * FROM funcionarios WHERE cpf = $1 AND usuario_tipo IN ('gestor', 'rh')",
      ['11122233344']
    );

    expect(funcionario.rows.length).toBe(0); // NÃO deve existir em funcionarios
  });
});
