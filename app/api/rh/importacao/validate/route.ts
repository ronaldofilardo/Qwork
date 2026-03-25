import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import {
  parseSpreadsheetAllRows,
  type ColumnMapping,
} from '@/lib/importacao/dynamic-parser';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import { query } from '@/lib/db';
import { limparCPF } from '@/lib/cpf-utils';
import { normalizeCNPJ } from '@/lib/validators';
import { parseDateCell } from '@/lib/xlsxParser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rh/importacao/validate
 * Recebe arquivo + mapeamento confirmado, valida dados e consulta banco.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mapeamentoRaw = formData.get('mapeamento');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!mapeamentoRaw || typeof mapeamentoRaw !== 'string') {
      return NextResponse.json(
        { error: 'Mapeamento de colunas não enviado' },
        { status: 400 }
      );
    }

    let mapeamento: ColumnMapping[];
    try {
      mapeamento = JSON.parse(mapeamentoRaw);
      if (!Array.isArray(mapeamento) || mapeamento.length === 0) {
        throw new Error('Mapeamento vazio');
      }
    } catch {
      return NextResponse.json(
        { error: 'Mapeamento de colunas inválido' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse com mapeamento
    const parsed = parseSpreadsheetAllRows(buffer, mapeamento);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error ?? 'Erro ao processar arquivo' },
        { status: 400 }
      );
    }

    // Validação de formato
    const validacao = validarDadosImportacao(parsed.data);

    // Consultar banco para duplicidades
    const cpfs = parsed.data
      .map((r) => limparCPF(r.cpf ?? ''))
      .filter((c) => c.length === 11);
    const cpfsUnicos = [...new Set(cpfs)];

    let funcionariosExistentes = 0;
    let funcionariosParaInativar = 0;
    let funcionariosJaInativos = 0;
    let funcionariosAReadmitir = 0;
    const avisosDb: typeof validacao.avisos = [];

    if (cpfsUnicos.length > 0) {
      // Buscar funcionários existentes
      const existResult = await query(
        'SELECT id, cpf FROM funcionarios WHERE cpf = ANY($1)',
        [cpfsUnicos]
      );
      const existingCpfs = new Set(
        existResult.rows.map((r: { cpf: string }) => r.cpf.trim())
      );
      funcionariosExistentes = existingCpfs.size;

      // Buscar vínculos existentes na clínica
      if (funcionariosExistentes > 0) {
        const cpfArray = [...existingCpfs];
        const vinculosResult = await query(
          `SELECT fc.funcionario_id, fc.empresa_id, fc.ativo, fc.data_desvinculo, f.cpf, ec.nome as empresa_nome
           FROM funcionarios_clinicas fc
           JOIN funcionarios f ON f.id = fc.funcionario_id
           JOIN empresas_clientes ec ON ec.id = fc.empresa_id
           WHERE f.cpf = ANY($1) AND fc.clinica_id = $2`,
          [cpfArray, clinicaId]
        );

        for (const vinculo of vinculosResult.rows) {
          const cpfTrim = (vinculo.cpf as string).trim();
          // Encontrar linhas no arquivo com este CPF
          for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            if (limparCPF(row.cpf ?? '') === cpfTrim) {
              const dataDem = row.data_demissao ?? '';
              const dataAdmRaw = row.data_admissao ?? '';

              if (dataDem && dataDem.trim() !== '') {
                if (vinculo.ativo) {
                  funcionariosParaInativar++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'cpf',
                    valor: cpfTrim,
                    mensagem: `Funcionário será inativado na empresa "${vinculo.empresa_nome}"`,
                    severidade: 'aviso',
                  });
                }
              } else if (!vinculo.ativo) {
                // Verificar se é uma readmissão (nova data de admissão > data de desvinculo)
                const dataAdmParsed = dataAdmRaw
                  ? parseDateCell(dataAdmRaw)
                  : null;
                const dataDesvinculo = vinculo.data_desvinculo
                  ? new Date(vinculo.data_desvinculo as string)
                  : null;

                const isReadmissao =
                  dataAdmParsed &&
                  (!dataDesvinculo || new Date(dataAdmParsed) > dataDesvinculo);

                if (isReadmissao) {
                  funcionariosAReadmitir++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'data_admissao',
                    valor: cpfTrim,
                    mensagem: `Funcionário será readmitido na empresa "${vinculo.empresa_nome}" (admissão mais recente que a saída)`,
                    severidade: 'aviso',
                  });
                } else {
                  funcionariosJaInativos++;
                  avisosDb.push({
                    linha: i + 2,
                    campo: 'cpf',
                    valor: cpfTrim,
                    mensagem: `Funcionário já está inativo na empresa "${vinculo.empresa_nome}" — não será reativado automaticamente`,
                    severidade: 'aviso',
                  });
                }
              }
            }
          }
        }
      }
    }

    // Coletar funcoes únicas para o modal de nivel_cargo
    const funcoesUnicas = [
      ...new Set(
        parsed.data.map((r) => (r.funcao ?? '').trim()).filter(Boolean)
      ),
    ].sort();

    // Contar empresas novas vs existentes
    const nomeEmpresas = new Set<string>();
    const cnpjEmpresas = new Set<string>();
    for (const row of parsed.data) {
      if (row.nome_empresa)
        nomeEmpresas.add(row.nome_empresa.trim().toUpperCase());
      if (row.cnpj_empresa) cnpjEmpresas.add(normalizeCNPJ(row.cnpj_empresa));
    }

    let empresasNovas = nomeEmpresas.size;
    let empresasExistentes = 0;

    if (cnpjEmpresas.size > 0) {
      const cnpjArray = [...cnpjEmpresas].filter((c) => c.length > 0);
      if (cnpjArray.length > 0) {
        const existEmpResult = await query(
          'SELECT cnpj FROM empresas_clientes WHERE cnpj = ANY($1) AND clinica_id = $2',
          [cnpjArray, clinicaId]
        );
        empresasExistentes = existEmpResult.rows.length;
        empresasNovas = Math.max(0, nomeEmpresas.size - empresasExistentes);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valido: validacao.valido,
        resumo: {
          ...validacao.resumo,
          empresasNovas,
          empresasExistentes,
          funcionariosExistentes,
          funcionariosNovos:
            validacao.resumo.cpfsUnicos - funcionariosExistentes,
          funcionariosParaInativar,
          funcionariosJaInativos,
          funcionariosAReadmitir,
        },
        funcoesUnicas,
        erros: validacao.erros,
        // Deduplicar: avisos do DB (com nome de empresa) sobrepõem avisos genéricos de data_demissao
        avisos: (() => {
          const linhasComAvisoDb = new Set(avisosDb.map((a) => a.linha));
          const avisosBase = validacao.avisos.filter(
            (a) =>
              !(a.campo === 'data_demissao' && linhasComAvisoDb.has(a.linha))
          );
          return [...avisosBase, ...avisosDb];
        })(),
      },
    });
  } catch (error: unknown) {
    console.error('[importacao/validate] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Clínica não identificada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Clínica inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
