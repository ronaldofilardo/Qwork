#!/usr/bin/env node
/**
 * Script para seed de usuários de teste no banco DEV (nr-bps_db)
 *
 * Usuários criados:
 * - Admin: 00000000000 / 0000
 * - Suporte: 11111111111 / 1111
 * - Comercial: 22222222222 / 2222
 * - Emissor: 53051173991 / 5978rdF*
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function seedUsers() {
  // Usar LOCAL_DATABASE_URL se disponível, ou construir manualmente
  const connectionString =
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db';

  const pool = new Pool({
    connectionString,
  });

  try {
    console.log('🔗 Conectando ao banco nr-bps_db...');
    const client = await pool.connect();

    // Preparar usuarios
    const usuarios = [
      {
        cpf: '00000000000',
        nome: 'Admin Dev',
        tipo_usuario: 'admin',
        senha: '0000',
      },
      {
        cpf: '11111111111',
        nome: 'Suporte Dev',
        tipo_usuario: 'suporte',
        senha: '1111',
      },
      {
        cpf: '22222222222',
        nome: 'Comercial Dev',
        tipo_usuario: 'comercial',
        senha: '2222',
      },
      {
        cpf: '53051173991',
        nome: 'Emissor Dev',
        tipo_usuario: 'emissor',
        senha: '5978rdF*',
      },
    ];

    // Set session context
    await client.query(
      "SELECT set_config('app.current_user_cpf', '00000000000', true)"
    );
    await client.query(
      "SELECT set_config('app.current_user_perfil', 'admin', true)"
    );

    // Extensão pgcrypto
    console.log('📦 Criando extensão pgcrypto...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Inserir/atualizar usuarios
    console.log('👥 Inserindo usuários...');
    const results = [];

    for (const usuario of usuarios) {
      const senhaHash = await bcrypt.hash(usuario.senha, 10);

      const query = `
        INSERT INTO usuarios (cpf, nome, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
        VALUES ($1, $2, $3::usuario_tipo_enum, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (cpf) DO UPDATE
        SET nome = EXCLUDED.nome,
            tipo_usuario = EXCLUDED.tipo_usuario,
            senha_hash = EXCLUDED.senha_hash,
            ativo = EXCLUDED.ativo,
            atualizado_em = CURRENT_TIMESTAMP
        RETURNING cpf, nome, tipo_usuario;
      `;

      const result = await client.query(query, [
        usuario.cpf,
        usuario.nome,
        usuario.tipo_usuario,
        senhaHash,
      ]);
      results.push(result.rows[0]);
      console.log(
        `  ✓ ${usuario.tipo_usuario.toUpperCase()}: ${usuario.cpf} (${usuario.nome})`
      );
    }

    // Confirmação final
    console.log('\n📋 Usuários no banco:');
    const verifyQuery = `
      SELECT cpf, nome, tipo_usuario FROM usuarios 
      WHERE cpf IN ('00000000000', '11111111111', '22222222222', '53051173991')
      ORDER BY cpf;
    `;
    const verify = await client.query(verifyQuery);
    console.table(verify.rows);

    client.release();
    console.log('\n✅ Seed concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao fazer seed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedUsers();
