export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gruposCOPSOQ } from '@/lib/laudo-calculos';

interface FuncionarioSetor {
  cpf: string;
  nome: string;
  funcao: string;
  matricula: string | null;
  turno: string | null;
  escala: string | null;
  avaliacoes_concluidas: number;
  grupo_1?: number | null;
  grupo_2?: number | null;
  grupo_3?: number | null;
  grupo_4?: number | null;
  grupo_5?: number | null;
  grupo_6?: number | null;
  grupo_7?: number | null;
  grupo_8?: number | null;
  grupo_9?: number | null;
  grupo_10?: number | null;
}

interface MediaGrupo {
  grupo: number;
  dominio: string;
  tipo: 'positiva' | 'negativa';
  media: number;
  categoria_risco: 'baixo' | 'medio' | 'alto';
  classificacao: 'verde' | 'amarelo' | 'vermelho';
}

interface ResumoRiscos {
  verde: number;
  amarelo: number;
  vermelho: number;
  legenda: Array<{ grupo: number; dominio: string; classificacao: string }>;
}

// Função para determinar categoria de risco (mesma lógica do laudo-calculos.ts)
function determinarCategoriaRisco(
  media: number,
  tipo: 'positiva' | 'negativa'
): 'baixo' | 'medio' | 'alto' {
  if (tipo === 'positiva') {
    if (media > 66) return 'baixo';
    if (media >= 33) return 'medio';
    return 'alto';
  } else {
    if (media < 33) return 'baixo';
    if (media <= 66) return 'medio';
    return 'alto';
  }
}

function determinarClassificacao(
  categoria: 'baixo' | 'medio' | 'alto'
): 'verde' | 'amarelo' | 'vermelho' {
  switch (categoria) {
    case 'baixo':
      return 'verde';
    case 'medio':
      return 'amarelo';
    case 'alto':
      return 'vermelho';
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole('rh');
    const searchParams = request.nextUrl.searchParams;
    const loteId = searchParams.get('lote_id');
    const setor = searchParams.get('setor');

    if (!loteId || !setor) {
      return NextResponse.json(
        { error: 'Parâmetros lote_id e setor são obrigatórios' },
        { status: 400 }
      );
    }

    // CORREÇÃO: Usar requireClinica para garantir mapeamento de clinica_id
    const { requireClinica } = await import('@/lib/session');
    const sessionComClinica = await requireClinica();
    const clinicaId = sessionComClinica.clinica_id;

    // Buscar funcionários do setor com suas avaliações concluídas no lote
    const funcionariosQuery = `
      SELECT 
        f.cpf,
        f.nome,
        f.setor,
        f.funcao,
        f.matricula,
        f.turno,
        f.escala,
        COUNT(DISTINCT a.id) as avaliacoes_concluidas,
        -- Médias por grupo para cada funcionário
        AVG(CASE WHEN r.grupo = 1 THEN r.valor END) as grupo_1,
        AVG(CASE WHEN r.grupo = 2 THEN r.valor END) as grupo_2,
        AVG(CASE WHEN r.grupo = 3 THEN r.valor END) as grupo_3,
        AVG(CASE WHEN r.grupo = 4 THEN r.valor END) as grupo_4,
        AVG(CASE WHEN r.grupo = 5 THEN r.valor END) as grupo_5,
        AVG(CASE WHEN r.grupo = 6 THEN r.valor END) as grupo_6,
        AVG(CASE WHEN r.grupo = 7 THEN r.valor END) as grupo_7,
        AVG(CASE WHEN r.grupo = 8 THEN r.valor END) as grupo_8,
        AVG(CASE WHEN r.grupo = 9 THEN r.valor END) as grupo_9,
        AVG(CASE WHEN r.grupo = 10 THEN r.valor END) as grupo_10
      FROM funcionarios f
      JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      LEFT JOIN respostas r ON a.id = r.avaliacao_id
      WHERE f.clinica_id = $1
        AND f.setor = $2
        AND a.lote_id = $3
        AND a.status = 'concluido'
      GROUP BY f.cpf, f.nome, f.setor, f.funcao, f.matricula, f.turno, f.escala
      ORDER BY f.nome
    `;

    const funcionariosResult = await query(funcionariosQuery, [
      clinicaId,
      setor,
      loteId,
    ]);
    const funcionarios: FuncionarioSetor[] = funcionariosResult.rows.map(
      (row: any) => ({
        cpf: row.cpf,
        nome: row.nome,
        funcao: row.funcao,
        matricula: row.matricula,
        turno: row.turno,
        escala: row.escala,
        avaliacoes_concluidas: parseInt(row.avaliacoes_concluidas),
        grupo_1: row.grupo_1 ? parseFloat(row.grupo_1) : null,
        grupo_2: row.grupo_2 ? parseFloat(row.grupo_2) : null,
        grupo_3: row.grupo_3 ? parseFloat(row.grupo_3) : null,
        grupo_4: row.grupo_4 ? parseFloat(row.grupo_4) : null,
        grupo_5: row.grupo_5 ? parseFloat(row.grupo_5) : null,
        grupo_6: row.grupo_6 ? parseFloat(row.grupo_6) : null,
        grupo_7: row.grupo_7 ? parseFloat(row.grupo_7) : null,
        grupo_8: row.grupo_8 ? parseFloat(row.grupo_8) : null,
        grupo_9: row.grupo_9 ? parseFloat(row.grupo_9) : null,
        grupo_10: row.grupo_10 ? parseFloat(row.grupo_10) : null,
      })
    );

    // Calcular médias gerais por grupo para o setor
    const mediasGrupos: MediaGrupo[] = [];

    for (let i = 1; i <= 10; i++) {
      const grupoKey = `grupo_${i}` as keyof FuncionarioSetor;
      const valores = funcionarios
        .map((f) => f[grupoKey] as number | null)
        .filter((v): v is number => v !== null && !isNaN(v));

      if (valores.length > 0) {
        const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
        const grupoInfo = gruposCOPSOQ.find((g) => g.grupo === i)!;
        const categoria = determinarCategoriaRisco(media, grupoInfo.tipo);
        const classificacao = determinarClassificacao(categoria);

        mediasGrupos.push({
          grupo: i,
          dominio: grupoInfo.dominio,
          tipo: grupoInfo.tipo,
          media: parseFloat(media.toFixed(1)),
          categoria_risco: categoria,
          classificacao,
        });
      }
    }

    // Calcular resumo de riscos
    const resumoRiscos: ResumoRiscos = {
      verde: mediasGrupos.filter((m) => m.classificacao === 'verde').length,
      amarelo: mediasGrupos.filter((m) => m.classificacao === 'amarelo').length,
      vermelho: mediasGrupos.filter((m) => m.classificacao === 'vermelho')
        .length,
      legenda: mediasGrupos.map((m) => ({
        grupo: m.grupo,
        dominio: m.dominio,
        classificacao: m.classificacao,
      })),
    };

    // Buscar informações do lote e empresa
    const loteInfo = await query(
      `
      SELECT 
        la.titulo,
        ec.nome as empresa_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.id = $1
    `,
      [loteId]
    );

    return NextResponse.json({
      success: true,
      lote: (loteInfo.rows[0] as Record<string, any>) || null,
      setor,
      total_funcionarios: funcionarios.length,
      funcionarios,
      medias_grupos: mediasGrupos,
      resumo_riscos: resumoRiscos,
    });
  } catch (error) {
    console.error('Erro ao buscar relatório por setor:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório por setor' },
      { status: 500 }
    );
  }
}
