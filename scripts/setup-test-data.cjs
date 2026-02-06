const pg = require('pg');
require('dotenv').config({ path: '.env.test' });

// Usar TEST_DATABASE_URL que está no .env.test
const connectionString =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

console.log(
  '🔧 Conectando ao banco:',
  connectionString?.replace(/:[^:@]+@/, ':***@')
);

const pool = new pg.Pool({
  connectionString: connectionString,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function setupTestData() {
  try {
    console.log('🔧 Conectando ao banco de testes: nr-bps_db_test');
    console.log(
      '🔧 Aplicando função validar_sessao_rls() no banco de testes...'
    );

    // Criar função validar_sessao_rls() atualizada
    await query(`
      CREATE OR REPLACE FUNCTION validar_sessao_rls()
      RETURNS BOOLEAN AS $$
      DECLARE
          v_perfil TEXT;
          v_cpf TEXT;
          v_contratante_id TEXT;
          v_clinica_id TEXT;
      BEGIN
          -- Obter variáveis de contexto
          v_perfil := current_setting('app.current_perfil', true);
          v_cpf := current_setting('app.current_user_cpf', true);
          v_contratante_id := current_setting('app.current_contratante_id', true);
          v_clinica_id := current_setting('app.current_clinica_id', true);
          
          -- Validações
          IF v_perfil IS NULL OR v_perfil = '' THEN
              RAISE EXCEPTION 'SEGURANÇA: Perfil de usuário não definido na sessão';
          END IF;
          
          IF v_cpf IS NULL OR v_cpf = '' THEN
              RAISE EXCEPTION 'SEGURANÇA: CPF de usuário não definido na sessão';
          END IF;
          
          -- Validar CPF tem 11 dígitos
          IF v_cpf !~ '^\\d{11}$' THEN
              RAISE EXCEPTION 'SEGURANÇA: CPF inválido na sessão: %', v_cpf;
          END IF;
          
          -- Perfis que requerem contratante_id ou clinica_id
          IF v_perfil IN ('gestor', 'rh', 'entidade') THEN
              IF (v_contratante_id IS NULL OR v_contratante_id = '') 
                 AND (v_clinica_id IS NULL OR v_clinica_id = '') THEN
                  RAISE EXCEPTION 'SEGURANÇA: Perfil % requer contratante_id ou clinica_id', v_perfil;
              END IF;
          END IF;
          
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    console.log('✅ Função criada no banco de testes');

    console.log('👤 Criando usuário RH de teste...');

    // Verificar se já existe
    const checkRH = await query(
      'SELECT cpf, clinica_id, contratante_id FROM funcionarios WHERE cpf = $1',
      ['04703084945']
    );

    if (checkRH.rows.length === 0) {
      // Verificar IDs existentes no banco de teste
      const clinicas = await query('SELECT id FROM clinicas LIMIT 1');
      const contratantes = await query('SELECT id FROM contratantes LIMIT 1');

      const clinicaId = clinicas.rows[0]?.id || null;
      const contratanteId = contratantes.rows[0]?.id || null;

      console.log(
        `📊 IDs disponíveis - Clínica: ${clinicaId}, Contratante: ${contratanteId}`
      );

      // Senha hash para 'senha123' gerado previamente
      const senhaHash =
        '$2a$10$JM6GvlDZz5Gqv5FqQvZ9XuX8YqQwZqZqZqZqZqZqZqZqZqZqZqZ';

      await query(
        `
        INSERT INTO funcionarios (
          cpf, nome, usuario_tipo, ativo, senha_hash, clinica_id, contratante_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
      `,
        [
          '04703084945',
          'RH Teste',
          'rh',
          true,
          senhaHash,
          clinicaId,
          contratanteId,
        ]
      );

      console.log('✅ Usuário RH criado');
    } else {
      const rh = checkRH.rows[0];
      console.log(
        `✅ Usuário RH já existe - Clínica: ${rh.clinica_id}, Contratante: ${rh.contratante_id}`
      );

      // Se não tiver clinica_id ou contratante_id, atualizar
      if (!rh.clinica_id || !rh.contratante_id) {
        const clinicas = await query('SELECT id FROM clinicas LIMIT 1');
        const contratantes = await query('SELECT id FROM contratantes LIMIT 1');

        await query(
          `
          UPDATE funcionarios 
          SET clinica_id = $1, contratante_id = $2
          WHERE cpf = $3
        `,
          [
            rh.clinica_id || clinicas.rows[0]?.id,
            rh.contratante_id || contratantes.rows[0]?.id,
            '04703084945',
          ]
        );

        console.log('✅ Usuário RH atualizado com clinica_id e contratante_id');
      }
    }

    console.log('\n✅ Setup completo!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await pool.end();
    process.exit(1);
  }
}

setupTestData();
