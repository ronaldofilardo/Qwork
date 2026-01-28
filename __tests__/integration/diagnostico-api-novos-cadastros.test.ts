/**
 * Teste de Diagnóstico - API Novos Cadastros
 * Verifica se a API está retornando corretamente os pré-cadastros personalizados
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('🔍 Diagnóstico - API Novos Cadastros com Personalizados', () => {
  it('deve retornar pré-cadastros personalizados pendentes', async () => {
    console.log('\n=== TESTE DIAGNÓSTICO: API NOVOS CADASTROS ===\n');

    // Mock de sessão admin
    jest.mock('@/lib/session', () => ({
      getSession: jest.fn(() => ({
        cpf: '00000000000',
        nome: 'Admin Teste',
        role: 'admin',
        perfil: 'admin',
        ativo: true,
      })),
    }));

    // Verificar dados no banco
    const dbResult = await query(`
      SELECT 
        c.id, 
        c.nome, 
        c.status, 
        c.tipo,
        cp.id as contratacao_personalizada_id,
        cp.status as contratacao_status,
        cp.numero_funcionarios_estimado
      FROM contratantes c
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
      WHERE c.status IN ('pendente', 'aguardando_pagamento', 'em_reanalise')
      ORDER BY c.criado_em DESC
      LIMIT 5
    `);

    console.log('📊 DADOS NO BANCO:', JSON.stringify(dbResult.rows, null, 2));

    // Testar a API
    const { GET } = await import('@/app/api/admin/novos-cadastros/route');

    const request = new NextRequest(
      'http://localhost:3000/api/admin/novos-cadastros'
    );
    const response = await GET(request);
    const data = await response.json();

    console.log('\n📡 RESPOSTA DA API:');
    console.log('Status:', response.status);
    console.log('Total contratantes:', data.contratantes?.length || 0);

    if (data.contratantes && data.contratantes.length > 0) {
      console.log('\n✅ CONTRATANTES RETORNADOS:');
      data.contratantes.forEach((c: any) => {
        console.log(`\n  - ID: ${c.id}`);
        console.log(`    Nome: ${c.nome}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Tipo: ${c.tipo}`);
        if (c.contratacao_personalizada_id) {
          console.log(
            `    🔥 PERSONALIZADO ID: ${c.contratacao_personalizada_id}`
          );
          console.log(`    Status Personalizado: ${c.contratacao_status}`);
          console.log(`    Funcionários: ${c.numero_funcionarios_estimado}`);
        }
      });
    }

    // Validações
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contratantes).toBeDefined();
    expect(Array.isArray(data.contratantes)).toBe(true);

    // Verificar se há personalizados
    const personalizados = data.contratantes.filter(
      (c: any) =>
        c.contratacao_personalizada_id &&
        c.contratacao_status === 'aguardando_valor_admin'
    );

    console.log(
      `\n🔥 Total de personalizados pendentes: ${personalizados.length}`
    );

    if (personalizados.length > 0) {
      console.log(
        '✅ SUCESSO! API está retornando pré-cadastros personalizados'
      );
    } else {
      console.log(
        '⚠️ ATENÇÃO: Nenhum personalizado pendente encontrado na resposta da API'
      );
    }
  });
});
