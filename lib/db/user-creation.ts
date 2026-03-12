/**
 * lib/db/user-creation.ts
 *
 * Funções de criação de contas de usuário extraídas de lib/db.ts
 * Contém: criarContaResponsavel, criarSenhaInicialEntidade, criarEmissorIndependente
 */

import bcrypt from 'bcryptjs';
import { query } from './query';
import type { Session } from '../session';
import type { Entidade } from './entidade-crud';

const DEBUG_DB =
  !!process.env.DEBUG_DB ||
  process.env.NODE_ENV === 'test' ||
  !!process.env.JEST_WORKER_ID;

/**
 * Criar conta para responsável do tomador
 * @param tomador - ID or object of tomador (entidade ou clinica)
 */
export async function criarContaResponsavel(
  tomador: number | Entidade,
  session?: Session
) {
  let tomadorData: Entidade;
  let tabelaTomadorOrigem = 'entidades';

  if (typeof tomador === 'number') {
    let result = await query(
      'SELECT * FROM clinicas WHERE id = $1',
      [tomador],
      session
    );

    if (result.rows.length > 0) {
      tomadorData = result.rows[0];
      tabelaTomadorOrigem = 'clinicas';
    } else {
      result = await query(
        'SELECT * FROM entidades WHERE id = $1',
        [tomador],
        session
      );
      if (result.rows.length === 0) {
        throw new Error(
          `Tomador ${tomador} não encontrado em entidades ou clinicas`
        );
      }
      tomadorData = result.rows[0] as Entidade;
      tabelaTomadorOrigem = 'entidades';
    }
  } else {
    tomadorData = tomador;
  }

  if (DEBUG_DB) {
    console.debug('[CRIAR_CONTA] Iniciando criação de conta para:', {
      id: tomadorData.id,
      cnpj: tomadorData.cnpj,
      responsavel_cpf: tomadorData.responsavel_cpf,
      tipo: tomadorData.tipo,
      origem: tabelaTomadorOrigem,
    });
  }

  // Se CNPJ não estiver no objeto, buscar do banco
  let cnpj = tomadorData.cnpj;
  if (!cnpj) {
    if (DEBUG_DB)
      console.debug(
        '[CRIAR_CONTA] CNPJ não encontrado no objeto, buscando do banco...'
      );
    const tomadorResult = await query(
      `SELECT cnpj FROM ${tabelaTomadorOrigem} WHERE id = $1`,
      [tomadorData.id],
      session
    );
    if (tomadorResult.rows.length > 0) {
      cnpj = tomadorResult.rows[0].cnpj;
      if (DEBUG_DB)
        console.debug('[CRIAR_CONTA] CNPJ encontrado no banco:', cnpj);
    }
  }

  if (!cnpj) {
    console.error(
      '[CRIAR_CONTA ERROR] CNPJ não encontrado nem no objeto nem no banco:',
      tomadorData
    );
    throw new Error('CNPJ do tomador é obrigatório para criar conta');
  }

  const cleanCnpj = cnpj.replace(/[./-]/g, '');
  const defaultPassword = cleanCnpj.slice(-6);
  const hashed = await bcrypt.hash(defaultPassword, 10);

  const cpfParaUsar = tomadorData.responsavel_cpf || cleanCnpj.slice(-11);

  if (DEBUG_DB) {
    console.debug(`[CRIAR_CONTA] CPF: ${cpfParaUsar}, CNPJ: ${cnpj}`);
  }

  // 1. Determinar tipo de usuário e tabela de senha
  let tipoUsuario: 'gestor' | 'rh' = 'gestor';
  let tabelaSenha = 'entidades_senhas';
  let campoId = 'entidade_id';

  if (tomadorData.tipo === 'clinica') {
    tipoUsuario = 'rh';
    tabelaSenha = 'clinicas_senhas';
    campoId = 'clinica_id';
  } else if (tomadorData.tipo === 'entidade') {
    tipoUsuario = 'gestor';
    tabelaSenha = 'entidades_senhas';
    campoId = 'entidade_id';
  } else {
    if (tabelaTomadorOrigem === 'clinicas') {
      tipoUsuario = 'rh';
      tabelaSenha = 'clinicas_senhas';
      campoId = 'clinica_id';
      tomadorData.tipo = 'clinica';
    } else {
      tipoUsuario = 'gestor';
      tabelaSenha = 'entidades_senhas';
      campoId = 'entidade_id';
      tomadorData.tipo = 'entidade';
    }
  }

  const referenceId = tomadorData.id;

  if (DEBUG_DB) {
    console.debug(
      `[CRIAR_CONTA] tipo=${tomadorData.tipo}, tipoUsuario=${tipoUsuario}, referenceId=${referenceId}, tabelaSenha=${tabelaSenha}, origem=${tabelaTomadorOrigem}`
    );
  }

  // 3. Criar senha na tabela apropriada
  try {
    const upsertQuery = `
      INSERT INTO ${tabelaSenha} (${campoId}, cpf, senha_hash, criado_em, atualizado_em)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (cpf) DO UPDATE
      SET senha_hash = EXCLUDED.senha_hash, atualizado_em = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await query(
      upsertQuery,
      [referenceId, cpfParaUsar, hashed],
      session
    );

    if (result.rows.length > 0) {
      console.log(
        `[CRIAR_CONTA] Senha criada/atualizada em ${tabelaSenha} para CPF ${cpfParaUsar}, campo=${campoId}, id=${referenceId}`
      );
    } else {
      throw new Error('UPSERT retornou sem resultado');
    }
  } catch (err) {
    console.error(
      `[CRIAR_CONTA] Erro ao inserir/atualizar em ${tabelaSenha}:`,
      err
    );
    throw err;
  }

  // Verificar se foi inserido corretamente
  const checkResult = await query(
    `SELECT senha_hash, length(senha_hash) as hash_len FROM ${tabelaSenha} WHERE ${campoId} = $1 AND cpf = $2`,
    [referenceId, cpfParaUsar],
    session
  );

  if (checkResult.rows.length > 0) {
    const stored = checkResult.rows[0];
    if (stored.hash_len !== hashed.length) {
      console.error(
        `[CRIAR_CONTA ERROR] Hash truncado: armazenado ${stored.hash_len} chars (esperado ${hashed.length})`
      );
    }

    const testMatch = await bcrypt.compare(defaultPassword, stored.senha_hash);
    if (DEBUG_DB) {
      console.debug(
        `[CRIAR_CONTA] Teste de senha para CPF ${cpfParaUsar}: ${testMatch ? 'SUCESSO' : 'FALHA'}`
      );
    }
  } else {
    console.error(
      `[CRIAR_CONTA ERROR] Senha não encontrada após inserção para CPF ${cpfParaUsar}`
    );
  }

  // 4. Criar/atualizar registro em USUARIOS
  try {
    let clinicaId = null;
    let usuarioEntidadeId = null;

    if (tipoUsuario === 'rh') {
      clinicaId = referenceId;
    } else {
      usuarioEntidadeId = tomadorData.id;
    }

    const usuarioExistente = await query(
      'SELECT id FROM usuarios WHERE cpf = $1',
      [cpfParaUsar],
      session
    );

    if (usuarioExistente.rows.length > 0) {
      await query(
        `UPDATE usuarios 
         SET nome = $1, email = $2, tipo_usuario = $3, 
             clinica_id = $4, entidade_id = $5, ativo = true, atualizado_em = CURRENT_TIMESTAMP 
         WHERE cpf = $6`,
        [
          tomadorData.responsavel_nome || 'Gestor',
          tomadorData.responsavel_email || null,
          tipoUsuario,
          clinicaId,
          usuarioEntidadeId,
          cpfParaUsar,
        ],
        session
      );
      if (DEBUG_DB) {
        console.debug(
          `[CRIAR_CONTA] Usuário atualizado: CPF=${cpfParaUsar}, tipo=${tipoUsuario}`
        );
      }
    } else {
      await query(
        `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          cpfParaUsar,
          tomadorData.responsavel_nome || 'Gestor',
          tomadorData.responsavel_email || null,
          tipoUsuario,
          clinicaId,
          usuarioEntidadeId,
        ],
        session
      );
      if (DEBUG_DB) {
        console.debug(
          `[CRIAR_CONTA] Usuário criado: CPF=${cpfParaUsar}, tipo=${tipoUsuario}`
        );
      }
    }

    console.log(
      `[CRIAR_CONTA] ✅ Conta criada em 'usuarios' para ${tipoUsuario} (CPF: ${cpfParaUsar}), senha em ${tabelaSenha}`
    );
  } catch (err) {
    console.error('[CRIAR_CONTA] ❌ Erro ao criar/atualizar usuário:', err);
    throw err;
  }

  console.log(
    `Conta processada para responsável ${cpfParaUsar} do tomador ${tomadorData.id} (senha padrão definida)`
  );
}

/**
 * Criar senha inicial para entidade (gestor)
 * Chama a função SQL criar_senha_inicial_entidade
 */
export async function criarSenhaInicialEntidade(
  entidadeId: number,
  session?: Session
): Promise<void> {
  await query('SELECT criar_senha_inicial_entidade($1)', [entidadeId], session);

  console.log(`Senha inicial criada para entidade tomador ${entidadeId}`);
}

/**
 * Criar emissor independente (sem vinculo a clinica_id)
 * Usado por admins para criar emissores globais
 */
export async function criarEmissorIndependente(
  cpf: string,
  nome: string,
  email: string,
  senha?: string,
  session?: Session
): Promise<{ cpf: string; nome: string; email: string; clinica_id: null }> {
  if (session && session.perfil !== 'admin') {
    throw new Error(
      'Apenas administradores podem criar emissores independentes'
    );
  }

  const cpfLimpo = cpf.replace(/\D/g, '');
  const senhaHash = await bcrypt.hash(senha || '123456', 10);

  const result = await query(
    `INSERT INTO usuarios (
      cpf,
      nome,
      email,
      tipo_usuario,
      senha_hash,
      ativo,
      criado_em,
      atualizado_em
    )
    VALUES ($1, $2, $3, 'emissor', $4, true, NOW(), NOW())
    ON CONFLICT (cpf) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      tipo_usuario = EXCLUDED.tipo_usuario,
      senha_hash = EXCLUDED.senha_hash,
      ativo = EXCLUDED.ativo,
      atualizado_em = CURRENT_TIMESTAMP
    RETURNING cpf, nome, email`,
    [cpfLimpo, nome, email, senhaHash],
    session
  );

  if (DEBUG_DB) {
    console.debug(
      `[CRIAR_EMISSOR] Emissor independente criado: ${cpfLimpo} (clinica_id = NULL)`
    );
  }

  // Compatibilidade: atualizar coluna `role` se existir
  try {
    await query(
      `UPDATE usuarios SET role = 'emissor' WHERE cpf = $1`,
      [cpfLimpo],
      session
    );
  } catch (err: any) {
    if (err && err.code && err.code === '42703') {
      if (DEBUG_DB) {
        console.debug(
          '[CRIAR_EMISSOR] Coluna `role` não existe no schema local — ignorando.'
        );
      }
    } else {
      console.warn(
        '[CRIAR_EMISSOR] Falha ao atualizar coluna `role` (não bloqueante):',
        err
      );
    }
  }

  return {
    cpf: result.rows[0].cpf,
    nome: result.rows[0].nome,
    email: result.rows[0].email,
    clinica_id: null,
  };
}
