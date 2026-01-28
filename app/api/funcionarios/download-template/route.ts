import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

/**
 * GET /api/funcionarios/download-template
 * Gera e serve arquivo modelo para importação de funcionários (.xlsx)
 */
export function GET() {
  try {
    // Definir estrutura do modelo
    const _headers = [
      'cpf',
      'nome',
      'data_nascimento',
      'setor',
      'funcao',
      'email',
      'senha',
      'matricula',
      'nivel_cargo',
      'turno',
      'escala',
    ];

    // Dados de exemplo (opcional - facilita entendimento)
    const exemplos = [
      {
        cpf: '12345678901',
        nome: 'João da Silva',
        data_nascimento: '15/04/1985',
        setor: 'Administrativo',
        funcao: 'Analista',
        email: 'joao.silva@empresa.com.br',
        senha: '123456',
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
        senha: '123456',
        matricula: 'MAT002',
        nivel_cargo: 'gestao',
        turno: 'Integral',
        escala: '6x1',
      },
    ];

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(exemplos);

    // Definir largura das colunas
    const colWidths = [
      { wch: 15 }, // cpf
      { wch: 30 }, // nome
      { wch: 15 }, // data_nascimento (dd/mm/aaaa)
      { wch: 20 }, // setor
      { wch: 20 }, // funcao
      { wch: 30 }, // email
      { wch: 12 }, // senha
      { wch: 15 }, // matricula
      { wch: 15 }, // nivel_cargo
      { wch: 12 }, // turno
      { wch: 12 }, // escala
    ];
    worksheet['!cols'] = colWidths;

    // Adicionar notas/validações na primeira linha após os exemplos
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
        ['4. Email deve ser único para cada funcionário'],
        [
          '5. Campos obrigatórios: CPF, Nome, Data de Nascimento, Setor, Função e Email',
        ],
        ['6. Senha padrão será 123456 se não informada'],
        [
          '7. Valores permitidos para nivel_cargo: operacional, gestao, gerencial, diretoria',
        ],
        ['8. Delete estas linhas de instrução e os exemplos antes de importar'],
      ],
      { origin: `A${notasRow}` }
    );

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionários');

    // Adicionar metadados
    workbook.Props = {
      Title: 'Modelo de Importação de Funcionários',
      Subject: 'Template QWork',
      Author: 'QWork Sistema',
      CreatedDate: new Date(),
    };

    // Converter para buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    });

    // Retornar arquivo
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
    console.error('Erro ao gerar template XLSX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar arquivo modelo' },
      { status: 500 }
    );
  }
}
