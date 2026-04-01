/**
 * Teste de Diagnóstico - API Novos Cadastros
 * Verifica se a API está retornando corretamente os pré-cadastros personalizados
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

describe.skip('🔍 Diagnóstico - API Novos Cadastros com Personalizados [LEGADO: contratacao_personalizada removida em migration 1136]', () => {
  it('deve retornar pré-cadastros personalizados pendentes', async () => {
    // \n=== TESTE DIAGNÓSTICO: API NOVOS CADASTROS ===\n

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
      FROM tomadors c
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.tomador_id
      WHERE c.status IN ('pendente', 'aguardando_pagamento', 'em_reanalise')
      ORDER BY c.criado_em DESC
      LIMIT 5
    `);

    // Testar a API
    const { GET } = await import('@/app/api/admin/novos-cadastros/route');

    const request = new NextRequest(
      'http://localhost:3000/api/admin/novos-cadastros'
    );
    const response = await GET(request);
    const data = await response.json();

    // \n📡 RESPOSTA DA API:

    if (data.tomadors && data.tomadors.length > 0) {
      // \n✅ tomadorS RETORNADOS:

      data.tomadors.forEach((c: any) => {
        if (c.contratacao_personalizada_id) {
          console.log(`    🔥 PERSONALIZADO ID: ${c.contratacao_personalizada_id}`);
        }
      });
    }

    // Validações
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tomadors).toBeDefined();
    expect(Array.isArray(data.tomadors)).toBe(true);

    // Verificar se há personalizados
    const personalizados = data.tomadors.filter(
      (c: any) =>
        c.contratacao_personalizada_id &&
        c.contratacao_status === 'aguardando_valor_admin'
    );

    console.log(`\n🔥 Total de personalizados pendentes: ${personalizados.length}`);

    if (personalizados.length > 0) {
      console.log('✅ SUCESSO! API está retornando pré-cadastros personalizados');
    } else {
      console.log('⚠️ ATENÇÃO: Nenhum personalizado pendente encontrado na resposta da API');
    }
  });
});
