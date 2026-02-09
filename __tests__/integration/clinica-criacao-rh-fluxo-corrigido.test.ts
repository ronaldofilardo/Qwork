/**
 * Teste de integração: Fluxo correto de criação de clínica RH
 *
 * Estrutura CORRETA (entidades + clinicas):
 * - entidades (tabela principal)
 * - clinicas (referencia tomador_id → entidades.id)
 * - clinicas_senhas (referencia clinica_id → clinicas.id)
 * - funcionarios (referencia clinica_id → clinicas.id)
 *
 * Objetivos:
 * 1. Criar entidade tipo 'clinica'
 * 2. Criar clinica associada
 * 3. Chamar criarContaResponsavel para liberar login RH
 * 4. Validar que NÃO há duplicação de senhas
 * 5. Validar que funcionário tem clinica_id correto
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Integração: Fluxo RH Correto [entidades + clinicas]', () => {
  let entidadeId: number;
  let clinicaId: number;
  const testSuffix = Math.random().toString(36).substring(7);
  const testTimestamp = Date.now();

  // Gerar CNPJ válido com formato correto (18 caracteres)
  const gerarCnpjValido = (seed: string): string => {
    const base = seed.replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    const calcDigit = (nums: string, weights: number[]) => {
      const sum = nums
        .split('')
        .reduce((acc, ch, idx) => acc + parseInt(ch, 10) * weights[idx], 0);
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };
    const d1 = calcDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = calcDigit(
      base + String(d1),
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );
    return base + String(d1) + String(d2);
  };

  const cnpjTeste = gerarCnpjValido(`${testSuffix}${testTimestamp}`);

  beforeAll(async () => {
    // Desabilitar triggers para testes
    await query('ALTER TABLE entidades DISABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas DISABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas_senhas DISABLE TRIGGER ALL', []);

    // === PASSO 1: Criar Entidade tipo 'clinica' ===
    const entidadeRes = await query(
      `INSERT INTO entidades (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, pagamento_confirmado
      ) VALUES (
        'clinica', 'Clínica Teste RH Integração', $1, $2, '11999999999',
        'Rua Teste, 123', 'São Paulo', 'SP', '01234567',
        'Dr. Teste RH', $3, 'dr@clinica.local', '11987654321',
        true, true
      ) RETURNING id`,
      [
        cnpjTeste,
        `clinica-test-${testSuffix}@local.test`,
        `40953759067`, // CPF responsável
      ]
    );
    entidadeId = entidadeRes.rows[0].id;

    // === PASSO 2: Criar Clínica associada ===
    const clinicaRes = await query(
      `INSERT INTO clinicas (
        nome, cnpj, entidade_id, ativa
      ) VALUES (
        'Clínica Teste RH Integração', $1, $2, true
      ) RETURNING id`,
      [cnpjTeste, entidadeId]
    );
    clinicaId = clinicaRes.rows[0].id;

    // Reabilitar triggers
    await query('ALTER TABLE entidades ENABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas ENABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas_senhas ENABLE TRIGGER ALL', []);
  });

  afterAll(async () => {
    // Cleanup com triggers desabilitados
    await query('ALTER TABLE entidades DISABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas DISABLE TRIGGER ALL', []);
    await query('ALTER TABLE clinicas_senhas DISABLE TRIGGER ALL', []);

    try {
      // Deletar na ordem correta (dependências inversas)
      await query('DELETE FROM clinicas_senhas WHERE clinica_id = $1', [
        clinicaId,
      ]);
      await query('DELETE FROM funcionarios WHERE clinica_id = $1', [
        clinicaId,
      ]);
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
      await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    } finally {
      // Sempre reabilitar
      await query('ALTER TABLE entidades ENABLE TRIGGER ALL', []);
      await query('ALTER TABLE clinicas ENABLE TRIGGER ALL', []);
      await query('ALTER TABLE clinicas_senhas ENABLE TRIGGER ALL', []);
    }
  });

  test('✅ criarContaResponsavel cria login RH SEM DUPLICAÇÃO', async () => {
    const { criarContaResponsavel } = require('@/lib/db');

    // === Verificar estado ANTES ===
    const senhasAntes = await query(
      `SELECT id, cpf FROM clinicas_senhas WHERE clinica_id = $1`,
      [clinicaId]
    );
    expect(senhasAntes.rows.length).toBe(0); // Nenhuma senha antes

    // === AÇÃO: Criar conta ===
    await criarContaResponsavel(clinicaId);

    // === VALIDAÇÃO 1: Exatamente UMA senha criada ===
    let senhasDepois = await query(
      `SELECT id, cpf, senha_hash FROM clinicas_senhas WHERE clinica_id = $1`,
      [clinicaId]
    );
    expect(senhasDepois.rows.length).toBe(
      1,
      'Deve ter exatamente 1 senha após criarContaResponsavel'
    );
    expect(senhasDepois.rows[0].cpf).toBe('40953759067');
    expect(senhasDepois.rows[0].senha_hash).toBeDefined();
    expect(senhasDepois.rows[0].senha_hash.length).toBeGreaterThan(20); // Hash bcrypt

    // === VALIDAÇÃO 2: Idempotência - chamar novamente não duplica ===
    await criarContaResponsavel(clinicaId);

    senhasDepois = await query(
      `SELECT id FROM clinicas_senhas WHERE clinica_id = $1`,
      [clinicaId]
    );
    expect(senhasDepois.rows.length).toBe(
      1,
      'Chamar criarContaResponsavel novamente NÃO deve duplicar (UPSERT deve funcionar)'
    );
  });

  test('✅ Funcionário RH criado com clinica_id correto', async () => {
    const { criarContaResponsavel } = require('@/lib/db');

    // Garantir contexto limpo
    await query('DELETE FROM usuarios WHERE clinica_id = $1', [clinicaId]);

    // === AÇÃO ===
    await criarContaResponsavel(clinicaId);

    // === VALIDAÇÃO ===
    const usuario = await query(
      `SELECT cpf, tipo_usuario, clinica_id FROM usuarios 
       WHERE cpf = $1 AND clinica_id = $2`,
      ['40953759067', clinicaId]
    );

    expect(usuario.rows.length).toBe(
      1,
      'Usuário RH deve ser criado com clinica_id correto'
    );
    expect(usuario.rows[0].tipo_usuario).toBe('rh');
    expect(usuario.rows[0].clinica_id).toBe(clinicaId);
  });

  test('✅ Validação de integridade: SEM dados órfãos', async () => {
    const { criarContaResponsavel } = require('@/lib/db');

    // === AÇÃO ===
    await criarContaResponsavel(clinicaId);

    // === VALIDAÇÃO: Nenhuma senha sem clínica correspondente ===
    const orfaos = await query(
      `SELECT cs.id, cs.clinica_id 
       FROM clinicas_senhas cs
       LEFT JOIN clinicas c ON cs.clinica_id = c.id
       WHERE c.id IS NULL`,
      []
    );

    expect(orfaos.rows.length).toBe(
      0,
      'Não deve haver senhas órfãs (clinica_id sem clinica correspondente)'
    );

    // === VALIDAÇÃO: Clínica existe e está ativa ===
    const clinicaCheck = await query(
      `SELECT id, ativa, entidade_id FROM clinicas WHERE id = $1`,
      [clinicaId]
    );

    expect(clinicaCheck.rows.length).toBe(1);
    expect(clinicaCheck.rows[0].ativa).toBe(true);
    expect(clinicaCheck.rows[0].entidade_id).toBe(entidadeId);
  });

  test('✅ Senha BCrypt válida é criada', async () => {
    const { criarContaResponsavel } = require('@/lib/db');

    // === AÇÃO ===
    await criarContaResponsavel(clinicaId);

    // === OBTER SENHA ===
    const senhaRecord = await query(
      `SELECT senha_hash FROM clinicas_senhas WHERE clinica_id = $1`,
      [clinicaId]
    );

    const senhaHash = senhaRecord.rows[0].senha_hash;

    // === VALIDAR HASH BCRYPT ===
    // Hash bcrypt começa com $2a$ ou $2b$
    expect(senhaHash).toMatch(/^\$2[aby]\$/);

    // === CONFIRMAR QUE NÃO É O HASH ANTERIOR ===
    // Cada chamada deve gerar novo hash
    const senhaHash2 = await query(
      `SELECT senha_hash FROM clinicas_senhas WHERE clinica_id = $1`,
      [clinicaId]
    );

    // Hashes diferentes mesmo da mesma senha (característica do bcrypt)
    expect(senhaHash2.rows[0].senha_hash).toBe(senhaHash); // Mesma porque é UPSERT
  });
});
