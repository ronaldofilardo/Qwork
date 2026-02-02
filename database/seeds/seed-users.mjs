import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const { Client } = pg;

// Configuração da conexão com o banco
const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
console.log('Connection string:', connectionString);
console.log('NODE_ENV:', process.env.NODE_ENV);
const client = new Client({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function seedUsers() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // NOTA: Admin e Emissor são perfis INDEPENDENTES e não devem estar vinculados a nenhuma clínica
    // Eles têm acesso global ao sistema

    // Dados dos usuários
    const users = [
      // Criar múltiplos admins para compatibilidade com diferentes testes
      {
        cpf: '00000000000',
        nome: 'Admin',
        email: 'admin@bps.com.br',
        // Senha definida: '123456'
        senha: '123456',
        perfil: 'admin',
        clinica_id: null,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: 'Administracao',
        funcao: 'Administrador do Sistema',
      },

      {
        cpf: '11111111111',
        nome: 'Admin2',
        email: 'admin2@bps.com.br',
        senha: 'admin123',
        perfil: 'admin',
        clinica_id: null,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: 'Administracao',
        funcao: 'Administrador do Sistema',
      },
      {
        cpf: '22222222222',
        nome: 'Emissor de Laudos',
        email: 'emissor@bps.com.br',
        senha: 'rh123',
        perfil: 'rh',
        clinica_id: null,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: 'Emissao',
        funcao: 'Emissor de Laudos',
      },
      {
        cpf: '99999999999',
        nome: 'Emissor',
        email: 'emissor2@bps.com.br',
        senha: '123',
        perfil: 'emissor',
        clinica_id: null,
        empresa_id: null,
        matricula: null,
        nivel_cargo: null,
        turno: null,
        escala: null,
        setor: 'Emissao',
        funcao: 'Emissor de Laudos',
      },
    ];

    // Inserir usuários
    for (const user of users) {
      const senha_hash = await hashPassword(user.senha);

      const query = `
        INSERT INTO funcionarios (
          cpf, nome, email, senha_hash, perfil, clinica_id, empresa_id,
          matricula, nivel_cargo, turno, escala, setor, funcao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (cpf) DO UPDATE SET
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          senha_hash = EXCLUDED.senha_hash,
          perfil = EXCLUDED.perfil,
          clinica_id = EXCLUDED.clinica_id,
          empresa_id = EXCLUDED.empresa_id,
          matricula = EXCLUDED.matricula,
          nivel_cargo = EXCLUDED.nivel_cargo,
          turno = EXCLUDED.turno,
          escala = EXCLUDED.escala,
          setor = EXCLUDED.setor,
          funcao = EXCLUDED.funcao,
          atualizado_em = CURRENT_TIMESTAMP
      `;

      const values = [
        user.cpf,
        user.nome,
        user.email,
        senha_hash,
        user.perfil,
        user.clinica_id,
        user.empresa_id,
        user.matricula,
        user.nivel_cargo,
        user.turno,
        user.escala,
        user.setor,
        user.funcao,
      ];

      await client.query(query, values);
      console.log(`Usuário ${user.nome} (${user.cpf}) inserido/atualizado`);
    }

    console.log('Seed concluído com sucesso!');

    // Verificar usuários inseridos
    const result = await client.query(`
      SELECT cpf, nome, perfil, clinica_id, empresa_id, nivel_cargo
      FROM funcionarios
      ORDER BY perfil, cpf
    `);

    console.log('\nUsuários no banco:');
    result.rows.forEach((user) => {
      console.log(
        `${user.cpf} - ${user.nome} (${user.perfil}) - Clinica: ${user.clinica_id} - Empresa: ${user.empresa_id} - Nivel: ${user.nivel_cargo}`
      );
    });
  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    await client.end();
    console.log('Conexão fechada');
  }
}

// Executar seed
seedUsers();
