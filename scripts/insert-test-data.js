#!/usr/bin/env node

// Script para inserir dados de teste no banco de testes
import { query } from "../lib/db.ts";

async function insertTestData() {
  try {
    console.log("🔧 Inserindo dados de teste no banco...");

    // Inserir usuário RH de teste (22222222222) que está faltando
    await query(`
      INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        senha_hash = EXCLUDED.senha_hash,
        perfil = EXCLUDED.perfil,
        clinica_id = EXCLUDED.clinica_id,
        ativo = EXCLUDED.ativo
    `, [
      '22222222222',
      'RH Gestor Teste',
      'rh@teste.com',
      '$2a$10$qFf73.uHvCCBGdBXS64LNeMsNXorsmRqfIyXFACTY733BlIRleOiy', // hash para 'rh123'
      'rh',
      1,
      true
    ]);

    // Verificar se os usuários foram inseridos
    const result = await query(`
      SELECT cpf, nome, perfil, ativo
      FROM funcionarios
      WHERE cpf IN ('11111111111', '22222222222', '33333333333')
      ORDER BY cpf
    `);

    console.log("✅ Usuários de teste inseridos:");
    console.table(result.rows);

    console.log("🎉 Dados de teste inseridos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir dados de teste:", error.message);
    process.exit(1);
  }
}

insertTestData();