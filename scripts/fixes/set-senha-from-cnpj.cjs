require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { query } = require('../../lib/db');

(async () => {
  try {
    const cpf = '70495096040'; // alterar conforme necessário

    console.log(
      `\n🔄 Sincronizando senha para CPF ${cpf} a partir do CNPJ do contratante`
    );

    // Buscar contratante pelo responsável
    let contratanteRes = await query(
      'SELECT id, cnpj, responsavel_nome FROM contratantes WHERE responsavel_cpf = $1 LIMIT 1',
      [cpf]
    );

    if (contratanteRes.rows.length === 0) {
      // Tentar por vínculo em funcionarios
      const tmp = await query(
        'SELECT c.id, c.cnpj, c.responsavel_nome FROM contratantes c JOIN funcionarios f ON f.contratante_id = c.id WHERE f.cpf = $1 LIMIT 1',
        [cpf]
      );
      contratanteRes = tmp;
    }

    if (contratanteRes.rows.length === 0) {
      console.error('Contratante não encontrado para o CPF', cpf);
      process.exit(1);
    }

    const contratante = contratanteRes.rows[0];
    const digits = (contratante.cnpj || '').replace(/\D/g, '');

    if (!digits || digits.length < 6) {
      console.error(
        'CNPJ inválido ou ausente para contratante',
        contratante.id
      );
      process.exit(1);
    }

    const pass = digits.slice(-6);
    const hash = await bcrypt.hash(pass, 10);

    // Atualizar/Inserir em entidades_senhas
    const upsert = await query(
      `
      INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at)
      VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, contratante_id = EXCLUDED.contratante_id, updated_at = CURRENT_TIMESTAMP
      RETURNING cpf
    `,
      [contratante.id, cpf, hash]
    );

    // Atualizar funcionario (se existir)
    const updFunc = await query(
      'UPDATE funcionarios SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE cpf = $2 RETURNING id, cpf',
      [hash, cpf]
    );

    // Inserir auditoria com hash_operacao gerado pela função auxiliar
    const metadadosContr = JSON.stringify({
      motivo: 'sync_senha_from_cnpj',
      cpf,
    });
    // Gerar hash em JS (seguindo mesma lógica: entidade|id|acao|dados|timestamp) para evitar dependência da função no DB
    const crypto = require('crypto');
    const nowIso = new Date().toISOString();
    const v1 = `contratante|${contratante.id}|liberar_login|${metadadosContr}|${nowIso}`;
    const hash1 = crypto.createHash('sha256').update(v1).digest('hex');
    await query(
      `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados, hash_operacao) VALUES ('contratante', $1, 'liberar_login', NULL, $2::jsonb, $3)`,
      [contratante.id, metadadosContr, hash1]
    );

    if (updFunc.rows.length > 0) {
      const metadadosFunc = JSON.stringify({
        motivo: 'senha_sync_from_cnpj',
        cpf,
      });
      const v2 = `funcionario|${updFunc.rows[0].id}|atualizar|${metadadosFunc}|${nowIso}`;
      const hash2 = crypto.createHash('sha256').update(v2).digest('hex');
      await query(
        `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados, hash_operacao) VALUES ('funcionario', $1, 'atualizar', NULL, $2::jsonb, $3)`,
        [updFunc.rows[0].id, metadadosFunc, hash2]
      );
    }

    console.log(
      '✅ Senha definida para CPF',
      cpf,
      '->',
      pass,
      '(somente visível aqui para dev)'
    );
    console.log('   Upsert entidades_senhas:', upsert.rows);
    console.log('   Funcionario atualizado:', updFunc.rows);
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message || err);
    process.exit(1);
  }
})();
