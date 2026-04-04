import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/funcionarios/download-template
 * Gera e serve arquivo modelo para importação de funcionários da entidade (.xlsx)
 */
export async function GET() {
  try {
    await requireEntity();

    // Dados de exemplo
    const exemplos = [
      {
        cpf: '12345678901',
        nome: 'João da Silva',
        data_nascimento: '15/04/1985',
        setor: 'Administrativo',
        funcao: 'Analista',
        email: 'joao.silva@empresa.com.br',
        matricula: 'MAT001',
        nivel_cargo: 'operacional',
        turno: 'Diurno',
        escala: '5x2',
      },
      {
        cpf: '98765432100',
        nome: 'Maria Santos',
        data_nascimento: '02/02/1990',
        setor: 'Operacional',
        funcao: 'Coordenadora',
        email: 'maria.santos@empresa.com.br',
        matricula: 'MAT002',
        nivel_cargo: 'gestao',
        turno: 'Integral',
        escala: '6x1',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exemplos);

    const colWidths = [
      { wch: 15 }, // cpf
      { wch: 30 }, // nome
      { wch: 15 }, // data_nascimento
      { wch: 20 }, // setor
      { wch: 20 }, // funcao
      { wch: 30 }, // email
      { wch: 15 }, // matricula
      { wch: 15 }, // nivel_cargo
      { wch: 12 }, // turno
      { wch: 12 }, // escala
    ];
    worksheet['!cols'] = colWidths;

    const notasRow = exemplos.length + 2;
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [],
        ['INSTRUÇÕES:'],
        [
          '1. Preencha os dados dos funcionários nas linhas abaixo dos exemplos',
        ],
        [
          '2. Data de Nascimento: dd/mm/aaaa (use texto ou formato dd/mm/aaaa para evitar perda por formatação do Excel)',
        ],
        ['3. CPF deve conter apenas 11 dígitos (sem pontos ou hífen)'],
        [
          '4. Email (opcional) deve ser único para cada funcionário quando preenchido',
        ],
        [
          '5. Campos obrigatórios: CPF, Nome, Data de Nascimento, Setor e Função',
        ],
        [
          '6. Senha será gerada automaticamente a partir da data de nascimento (formato: DDMMYYYY)',
        ],
        [
          '7. Valores permitidos para nivel_cargo: operacional, gestao, gerencial, diretoria',
        ],
        ['8. Delete estas linhas de instrução e os exemplos antes de importar'],
      ],
      { origin: `A${notasRow}` }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionários');

    workbook.Props = {
      Title: 'Modelo de Importação de Funcionários',
      Subject: 'Template QWork',
      Author: 'QWork Sistema',
      CreatedDate: new Date(),
    };

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="modelo_funcionarios_qwork.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar template XLSX para entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao gerar arquivo modelo' },
      { status: 500 }
    );
  }
}
