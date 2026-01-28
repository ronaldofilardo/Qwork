/**
 * API para exportar listagem de funcionários de um lote em CSV
 * Solução simples para evitar geração de PDFs complexos na Vercel Free
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRH } from '@/lib/auth-require';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação (requireRH aceita entidade e RH)
    const session = requireRH();
    const { id: loteId } = params;

    // Verificar acesso ao lote
    const loteResult = await query(
      `SELECT la.id, la.codigo, la.titulo, la.clinica_id, la.empresa_id
       FROM lotes_avaliacao la
       WHERE la.id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Verificar permissão (entidade ou RH)
    if (session.perfil === 'gestor_entidade') {
      if (lote.clinica_id !== session.clinica_id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    } else if (session.perfil === 'rh') {
      const rhAccessResult = await query(
        `SELECT 1 FROM gestores_rh
         WHERE cpf = $1 AND empresa_id = $2`,
        [session.cpf, lote.empresa_id]
      );

      if (rhAccessResult.rows.length === 0) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Buscar funcionários do lote com status de avaliação
    const funcionariosResult = await query(
      `SELECT 
        f.cpf,
        f.nome,
        f.email,
        f.perfil,
        f.setor,
        f.funcao,
        f.matricula,
        f.status as funcionario_status,
        a.status as avaliacao_status,
        a.concluida_em,
        CASE 
          WHEN a.status = 'concluida' THEN 'Concluída'
          WHEN a.status = 'em_andamento' THEN 'Em Andamento'
          WHEN a.status = 'pendente' THEN 'Pendente'
          WHEN a.status = 'inativa' THEN 'Inativa'
          ELSE 'Não Iniciada'
        END as status_descricao
       FROM funcionarios f
       LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf AND a.lote_id = $1
       WHERE f.empresa_id = $2
       ORDER BY f.nome`,
      [loteId, lote.empresa_id]
    );

    // Gerar CSV
    const headers = [
      'CPF',
      'Nome',
      'Email',
      'Perfil',
      'Setor',
      'Função',
      'Matrícula',
      'Status Funcionário',
      'Status Avaliação',
      'Data Conclusão',
    ];

    const rows = funcionariosResult.rows.map((func) => [
      func.cpf,
      func.nome,
      func.email || '',
      func.perfil === 'operacional' ? 'Operacional' : 'Gestão',
      func.setor || '',
      func.funcao || '',
      func.matricula || '',
      func.funcionario_status === 'ativo' ? 'Ativo' : 'Inativo',
      func.status_descricao,
      func.concluida_em
        ? new Date(func.concluida_em).toLocaleDateString('pt-BR')
        : '',
    ]);

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escapar aspas e adicionar aspas em células com vírgula
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',')
      ),
    ].join('\n');

    // Adicionar BOM UTF-8 para Excel reconhecer acentos
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Retornar CSV
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `funcionarios-lote-${lote.codigo}-${timestamp}.csv`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Lote-Id': String(loteId),
        'X-Total-Funcionarios': String(funcionariosResult.rows.length),
      },
    });
  } catch (error) {
    console.error('Erro ao exportar CSV de funcionários:', error);
    return NextResponse.json(
      {
        error: 'Erro ao exportar CSV de funcionários',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
