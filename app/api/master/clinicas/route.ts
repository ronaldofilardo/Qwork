import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT id, nome, cnpj, email, telefone, endereco, ativa, criado_em FROM clinicas ORDER BY criado_em DESC'
    )
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, cnpj, email, telefone, endereco } = await request.json()

    if (!nome) {
      return NextResponse.json({ error: 'Nome da clínica é obrigatório' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome, cnpj, email, telefone, endereco, ativa, criado_em`,
      [nome, cnpj, email, telefone, endereco]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar clínica:', error)
    
    // Verificar se é erro de CNPJ duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'constraint' in error &&
      (error as any).code === '23505' &&
      (error as any).constraint === 'clinicas_cnpj_key'
    ) {
      return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}