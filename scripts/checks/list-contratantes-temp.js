#!/usr/bin/env node

// Script para listar tomadors
import { query } from '../lib/db.ts';

async function listtomadors() {
  try {
    console.log('📋 Listando tomadors...');

    const result = await query(`
      SELECT id, nome, tipo, responsavel_cpf, ativa, criado_em
      FROM tomadors
      ORDER BY id
    `);

    console.log(`Encontrados ${result.rows.length} tomadors:\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Nome: ${row.nome}`);
      console.log(`   Tipo: ${row.tipo}`);
      console.log(`   Responsável CPF: ${row.responsavel_cpf}`);
      console.log(`   Ativa: ${row.ativa}`);
      console.log(`   Criado em: ${row.criado_em}`);
      console.log('');
    });
  } catch (error) {
    console.error('Erro ao listar tomadors:', error);
  }
}

listtomadors();
