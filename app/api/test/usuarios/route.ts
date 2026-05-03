// API de teste para verificar usuários disponíveis
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  // Só permite execução em ambiente de teste real
  if (process.env.NODE_ENV !== 'test' || !process.env.JEST_WORKER_ID) {
    return NextResponse.json(
      {
        success: false,
        error: 'Esta rota só está disponível durante execução de testes',
      },
      { status: 403 }
    );
  }

  try {
    const result = await query(`
      SELECT cpf, nome, perfil, ativo
      FROM funcionarios
      WHERE perfil IN ('admin', 'rh', 'funcionario')
      ORDER BY perfil, cpf
    `);

    return NextResponse.json({
      success: true,
      usuarios: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar usuários',
      },
      { status: 500 }
    );
  }
}
