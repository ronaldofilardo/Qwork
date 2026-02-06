require('../load-env.cjs').loadEnv();
const { query } = require('../../lib/db');

async function migrarClinicasOrfas() {
  try {
    console.log('\n🔧 MIGRAÇÃO: Criar clínicas faltantes\n');
    console.log('='.repeat(70));

    // Identificar contratantes órfãos
    const orfaos = await query(`
      SELECT 
        c.id,
        c.responsavel_nome,
        c.responsavel_email,
        c.responsavel_celular,
        c.telefone,
        c.endereco,
        c.cnpj,
        c.responsavel_cpf
      FROM contratantes c
      WHERE c.tipo = 'clinica'
        AND c.ativa = true
        AND c.pagamento_confirmado = true
        AND NOT EXISTS (
          SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id
        )
      ORDER BY c.id
    `);

    if (orfaos.rows.length === 0) {
      console.log('✅ Nenhum contratante órfão encontrado. Banco em ordem!');
      console.log('='.repeat(70) + '\n');
      return;
    }

    console.log(
      `\n📋 ${orfaos.rows.length} contratante(s) sem clínica encontrado(s):\n`
    );
    orfaos.rows.forEach((c) => {
      console.log(
        `   - ID ${c.id}: ${c.responsavel_nome} (CPF: ${c.responsavel_cpf})`
      );
    });

    console.log('\n🚀 Iniciando correção...\n');

    let clinicasCriadas = 0;
    let funcionariosAtualizados = 0;

    for (const contratante of orfaos.rows) {
      console.log(
        `\n📍 Processando contratante ${contratante.id} (${contratante.responsavel_nome})...`
      );

      // Criar clínica
      const result = await query(
        `
        INSERT INTO clinicas (
          nome,
          cnpj,
          email,
          telefone,
          endereco,
          contratante_id,
          ativa,
          criado_em,
          atualizado_em
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `,
        [
          contratante.responsavel_nome,
          contratante.cnpj,
          contratante.responsavel_email,
          contratante.responsavel_celular || contratante.telefone,
          contratante.endereco,
          contratante.id,
        ]
      );

      const novaClinicaId = result.rows[0].id;
      clinicasCriadas++;
      console.log(`   ✓ Clínica ${novaClinicaId} criada`);

      // Atualizar funcionários RH
      // 1) Atualizar por CPF do responsável quando presente
      const updateByCpf = await query(
        `
        UPDATE funcionarios
        SET clinica_id = $1,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE cpf = $2
          AND clinica_id IS NULL
        RETURNING id, cpf
      `,
        [novaClinicaId, contratante.responsavel_cpf]
      );

      if (updateByCpf.rows.length > 0) {
        funcionariosAtualizados += updateByCpf.rowCount;
        console.log(
          `   ✓ ${updateByCpf.rowCount} funcionário(s) atualizado(s) por CPF com clinica_id = ${novaClinicaId}`
        );

        // Registrar auditoria para atualização de funcionario(s)
        for (const r of updateByCpf.rows) {
          await query(
            `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados) VALUES ('funcionario', $1, 'atualizar', NULL, $2::jsonb)`,
            [
              r.id,
              JSON.stringify({
                motivo: 'associacao_clinica_por_migracao',
                clinica_id: novaClinicaId,
              }),
            ]
          );
        }
      }

      // 2) Atualizar RHs registrados por contratante onde perfil='rh' e clinica_id is null
      const updateByContratante = await query(
        `
        UPDATE funcionarios
        SET clinica_id = $1,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE contratante_id = $2
          AND perfil = 'rh'
          AND clinica_id IS NULL
        RETURNING id, cpf
      `,
        [novaClinicaId, contratante.id]
      );

      if (updateByContratante.rows.length > 0) {
        funcionariosAtualizados += updateByContratante.rowCount;
        console.log(
          `   ✓ ${updateByContratante.rowCount} funcionário(s) RH atualizado(s) por contratante com clinica_id = ${novaClinicaId}`
        );

        for (const r of updateByContratante.rows) {
          await query(
            `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados) VALUES ('funcionario', $1, 'atualizar', NULL, $2::jsonb)`,
            [
              r.id,
              JSON.stringify({
                motivo: 'associacao_clinica_por_migracao',
                clinica_id: novaClinicaId,
              }),
            ]
          );
        }
      }

      // 3) Se não atualizamos ninguém, criar um funcionário gestor RH para o responsável
      if (updateByCpf.rowCount === 0 && updateByContratante.rowCount === 0) {
        console.log(
          '   ⚠️ Nenhum funcionário existente encontrado para o responsável. Criando um registro RH...'
        );
        const crypto = require('crypto');
        const bcrypt = require('bcryptjs');
        // Gerar senha com os 6 últimos dígitos do CNPJ quando disponível (requisito de negócio)
        let generatedPass = null;
        if (contratante.cnpj) {
          const digits = contratante.cnpj.replace(/\D/g, '');
          if (digits.length >= 6) generatedPass = digits.slice(-6);
        }
        if (!generatedPass) {
          generatedPass = crypto.randomBytes(4).toString('hex');
          console.warn(
            '   ⚠️ CNPJ ausente ou inválido; usando senha aleatória de fallback'
          );
        }
        const senhaHash = await bcrypt.hash(generatedPass, 10);

        const insertRes = await query(
          `
          INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, contratante_id, clinica_id, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, 'rh', $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, cpf
        `,
          [
            contratante.responsavel_cpf,
            contratante.responsavel_nome,
            contratante.responsavel_email,
            senhaHash,
            contratante.id,
            novaClinicaId,
          ]
        );

        if (insertRes.rows.length > 0) {
          funcionariosAtualizados += 1;
          const novoFuncionarioId = insertRes.rows[0].id;
          const novoFuncionarioCpf = insertRes.rows[0].cpf;
          console.log(
            `   ✓ Funcionário RH criado com CPF ${novoFuncionarioCpf} e clinica_id=${novaClinicaId}. (senha temporária gerada)`
          );

          await query(
            `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados) VALUES ('funcionario', $1, 'criar', NULL, $2::jsonb)`,
            [
              novoFuncionarioId,
              JSON.stringify({
                motivo: 'criado_por_migracao',
                clinica_id: novaClinicaId,
              }),
            ]
          );

          // 4) Sincronizar senha com entidades_senhas (upsert)
          const upsert = await query(
            `
            INSERT INTO entidades_senhas (cpf, senha_hash, criado_em, atualizado_em)
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, atualizado_em = CURRENT_TIMESTAMP
            RETURNING cpf
          `,
            [novoFuncionarioCpf, senhaHash]
          );

          if (upsert.rows.length > 0) {
            console.log(
              `   ✓ Senha do contratante sincronizada em entidades_senhas para CPF ${novoFuncionarioCpf}`
            );
            await query(
              `INSERT INTO auditoria (entidade_tipo, entidade_id, acao, usuario_cpf, metadados) VALUES ('contratante', $1, 'liberar_login', NULL, $2::jsonb)`,
              [
                contratante.id,
                JSON.stringify({
                  motivo: 'sync_senha_por_migracao',
                  cpf: novoFuncionarioCpf,
                }),
              ]
            );
          }

          // Opcional: log da senha gerada em console para uso temporário (somente local)
          console.log('     • Senha gerada (apenas para dev):', generatedPass);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRAÇÃO CONCLUÍDA');
    console.log('   - Clínicas criadas:', clinicasCriadas);
    console.log('   - Funcionários atualizados:', funcionariosAtualizados);
    console.log('='.repeat(70));

    // Verificação pós-migração
    console.log('\n🔍 Verificação pós-migração:\n');

    const verif1 = await query(`
      SELECT COUNT(*) as total
      FROM contratantes c
      WHERE c.tipo = 'clinica'
        AND c.ativa = true
        AND c.pagamento_confirmado = true
        AND NOT EXISTS (SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id)
    `);

    const verif2 = await query(`
      SELECT COUNT(*) as total
      FROM funcionarios
      WHERE perfil = 'rh'
        AND ativo = true
        AND contratante_id IS NOT NULL
        AND clinica_id IS NULL
    `);

    console.log(
      `   - Contratantes tipo 'clinica' SEM clínica: ${verif1.rows[0].total}`
    );
    console.log(`   - RHs SEM clinica_id: ${verif2.rows[0].total}`);

    if (verif1.rows[0].total === '0' && verif2.rows[0].total === '0') {
      console.log('\n   ✅ Todos os dados corrigidos!\n');
    } else {
      console.log('\n   ⚠️ Ainda há dados pendentes de correção\n');
    }
  } catch (err) {
    console.error('\n❌ ERRO na migração:', err.message);
    console.error(err);
    process.exit(1);
  }
}

migrarClinicasOrfas();
