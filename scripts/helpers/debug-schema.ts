import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const clinicaId = 140;

    // 1. Funcionários vinculados (todos os perfis)
    console.log('Funcionários vinculados à clínica 140:\n');
    const funcRes = await pool.query(
      `
      SELECT f.id, f.cpf, f.nome, f.perfil, f.usuario_tipo, fc.ativo, fc.funcionario_id
      FROM funcionarios f
      JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
      WHERE fc.clinica_id = $1
      ORDER BY f.perfil, f.cpf;
    `,
      [clinicaId]
    );

    funcRes.rows.forEach((r) => {
      console.log(
        `  CPF: ${r.cpf} | Perfil: ${r.perfil} | Tipo: ${r.usuario_tipo} | Ativo: ${r.ativo}`
      );
    });

    // 2. Senhas cadastradas para a clínica (usuários que PODEM logar)
    console.log('\n\nclinicas_senhas para clínica 140:\n');
    const senhasRes = await pool.query(
      `
      SELECT id, clinica_id, cpf, primeira_senha_alterada, created_at
      FROM clinicas_senhas
      WHERE clinica_id = $1;
    `,
      [clinicaId]
    );

    senhasRes.rows.forEach((r) => {
      console.log(
        `  CPF: ${r.cpf} | primeira_senha_alterada: ${r.primeira_senha_alterada}`
      );
    });

    // 3. Contrato da clínica
    console.log('\nContratos para a clínica 140:\n');
    const contratoRes = await pool.query(
      `
      SELECT id, aceito, status, numero_funcionarios FROM contratos
      WHERE tipo_tomador = 'clinica' AND tomador_id = $1;
    `,
      [clinicaId]
    );
    contratoRes.rows.forEach((r) => {
      console.log(`  ID ${r.id}: aceito=${r.aceito}, status=${r.status}`);
    });

    await pool.end();
  } catch (e) {
    console.error('Erro:', e instanceof Error ? e.message : e);
    await pool.end();
    process.exit(1);
  }
})();
