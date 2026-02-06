/**
 * IMPORTANTE: Esta rota retorna apenas HTML para o cliente renderizar.
 * Não usa puppeteer - PDF é gerado no cliente via window.print() ou jsPDF.
 * Apenas o emissor (laudos) usa puppeteer para geração server-side.
 */
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gruposCOPSOQ } from '@/lib/laudo-calculos';

// Função para determinar categoria de risco (mesma lógica)
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

    // Buscar funcionários do setor
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
    const funcionarios = funcionariosResult.rows;

    // Calcular médias gerais por grupo
    const mediasGrupos: any[] = [];

    for (let i = 1; i <= 10; i++) {
      const grupoKey = `grupo_${i}`;
      const valores = funcionarios
        .map((f: any) => f[grupoKey])
        .filter((v: any) => v !== null && !isNaN(v))
        .map((v: any) => parseFloat(v));

      if (valores.length > 0) {
        const media =
          valores.reduce((sum: number, v: number) => sum + v, 0) /
          valores.length;
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
    const verde = mediasGrupos.filter(
      (m) => m.classificacao === 'verde'
    ).length;
    const amarelo = mediasGrupos.filter(
      (m) => m.classificacao === 'amarelo'
    ).length;
    const vermelho = mediasGrupos.filter(
      (m) => m.classificacao === 'vermelho'
    ).length;

    // Buscar informações do lote
    const loteInfo = await query(
      `
      SELECT 
        la.titulo,
        ec.nome as empresa_nome,
        c.nome as clinica_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      WHERE la.id = $1
    `,
      [loteId]
    );

    const lote = loteInfo.rows[0] as Record<string, any>;

    // Gerar HTML para o PDF
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório por Setor - ${setor}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 10px; 
      line-height: 1.4;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    .header h1 { font-size: 18px; color: #1e40af; margin-bottom: 5px; }
    .header p { font-size: 11px; color: #64748b; }
    .info-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .info-item label {
      display: block;
      font-size: 9px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-item value {
      display: block;
      font-size: 11px;
      font-weight: bold;
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 4px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: bold;
      color: #1e293b;
      text-align: center;
    }
    td { text-align: center; }
    td:nth-child(1), td:nth-child(2) { text-align: left; }
    .media-row {
      background: #dbeafe;
      font-weight: bold;
    }
    .classificacao-row {
      background: #f1f5f9;
      font-size: 8px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 8px;
      font-weight: bold;
    }
    .badge-verde { background: #dcfce7; color: #166534; }
    .badge-amarelo { background: #fef3c7; color: #854d0e; }
    .badge-vermelho { background: #fee2e2; color: #991b1b; }
    .badge-gestao { background: #e9d5ff; color: #6b21a8; }
    .badge-oper { background: #dbeafe; color: #1e40af; }
    .resumo-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-top: 15px;
    }
    .resumo-box h3 {
      font-size: 13px;
      margin-bottom: 10px;
      color: #1e293b;
    }
    .riscos-indicadores {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      font-size: 14px;
    }
    .risco-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legenda-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 10px;
    }
    .legenda-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9px;
    }
    .metodologia {
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 8px;
      color: #64748b;
    }
    .metodologia h4 { 
      font-size: 9px; 
      margin-bottom: 6px;
      color: #475569;
    }
    .metodologia-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .metodologia ul {
      margin-left: 15px;
      margin-top: 4px;
    }
    .metodologia li {
      margin-bottom: 2px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório por Setor - COPSOQ III</h1>
    <p>Análise Psicossocial por Setor</p>
  </div>

  <div class="info-box">
    <div class="info-grid">
      <div class="info-item">
        <label>Lote</label>
        <value>${lote.id}</value>
      </div>
      <div class="info-item">
        <label>Empresa</label>
        <value>${lote.empresa_nome}</value>
      </div>
      <div class="info-item">
        <label>Setor</label>
        <value>${setor}</value>
      </div>
      <div class="info-item">
        <label>Funcionários</label>
        <value>${funcionarios.length}</value>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 180px;">Nome</th>
        <th style="width: 120px;">Função</th>
        <th style="width: 50px;">Nível</th>
        <th>G1</th>
        <th>G2</th>
        <th>G3</th>
        <th>G4</th>
        <th>G5</th>
        <th>G6</th>
        <th>G7</th>
        <th>G8</th>
        <th>G9</th>
        <th>G10</th>
      </tr>
    </thead>
    <tbody>
      ${funcionarios
        .map(
          (func: any) => `
        <tr>
          <td style="text-align: left;">${func.nome}</td>
          <td style="text-align: left; font-size: 8px;">${func.funcao}</td>
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            .map((i) => {
              const val = func[`grupo_${i}`];
              return `<td>${val ? parseFloat(val).toFixed(1) : '-'}</td>`;
            })
            .join('')}
        </tr>
      `
        )
        .join('')}
      <tr class="media-row">
        <td colspan="3" style="text-align: right;">MÉDIA GERAL DO SETOR →</td>
        ${mediasGrupos
          .map(
            (mg) => `
          <td>
            <div style="font-size: 11px;">${mg.media.toFixed(1)}</div>
            <div style="margin-top: 2px;">
              ${
                mg.classificacao === 'verde'
                  ? '🟢'
                  : mg.classificacao === 'amarelo'
                    ? '🟡'
                    : '🔴'
              }
            </div>
          </td>
        `
          )
          .join('')}
      </tr>
      <tr class="classificacao-row">
        <td colspan="3" style="text-align: right; font-weight: bold;">CLASSIFICAÇÃO DE RISCO →</td>
        ${mediasGrupos
          .map(
            (mg) => `
          <td>
            <span class="badge badge-${mg.classificacao}">
              ${
                mg.categoria_risco === 'baixo'
                  ? 'Baixo'
                  : mg.categoria_risco === 'medio'
                    ? 'Médio'
                    : 'Alto'
              }
            </span>
          </td>
        `
          )
          .join('')}
      </tr>
    </tbody>
  </table>

  <div class="resumo-box">
    <h3>Resumo de Riscos</h3>
    
    <div class="riscos-indicadores">
      <div class="risco-item">
        <strong>${verde}</strong>
        <span>🟢</span>
        <span style="font-size: 10px; color: #64748b;">Baixo Risco</span>
      </div>
      <div class="risco-item">
        <strong>${amarelo}</strong>
        <span>🟡</span>
        <span style="font-size: 10px; color: #64748b;">Médio Risco</span>
      </div>
      <div class="risco-item">
        <strong>${vermelho}</strong>
        <span>🔴</span>
        <span style="font-size: 10px; color: #64748b;">Alto Risco</span>
      </div>
    </div>

    <p style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">Legenda dos Grupos:</p>
    <div class="legenda-grid">
      ${mediasGrupos
        .map(
          (item) => `
        <div class="legenda-item">
          <span style="font-size: 14px;">
            ${
              item.classificacao === 'verde'
                ? '🟢'
                : item.classificacao === 'amarelo'
                  ? '🟡'
                  : '🔴'
            }
          </span>
          <div style="flex: 1;">
            <strong>Grupo ${item.grupo}</strong> - ${item.dominio}
          </div>
          <span class="badge badge-${item.classificacao}">
            ${
              item.categoria_risco === 'baixo'
                ? 'Baixo'
                : item.categoria_risco === 'medio'
                  ? 'Médio'
                  : 'Alto'
            }
          </span>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="metodologia">
      <h4>Metodologia de Classificação (Tercis Fixos 33% e 66%):</h4>
      <div class="metodologia-grid">
        <div>
          <p style="font-weight: bold; margin-bottom: 3px;">Grupos Positivos (maior é melhor):</p>
          <ul>
            <li>🟢 >66% = Baixo Risco (Excelente)</li>
            <li>🟡 33-66% = Médio Risco (Monitorar)</li>
            <li>🔴 <33% = Alto Risco (Atenção Necessária)</li>
          </ul>
        </div>
        <div>
          <p style="font-weight: bold; margin-bottom: 3px;">Grupos Negativos (menor é melhor):</p>
          <ul>
            <li>🟢 <33% = Baixo Risco (Excelente)</li>
            <li>🟡 33-66% = Médio Risco (Monitorar)</li>
            <li>🔴 >66% = Alto Risco (Atenção Necessária)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Relatório gerado em ${new Date().toLocaleDateString(
      'pt-BR'
    )} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    <p>${lote.clinica_nome} - Sistema BPS Brasil</p>
  </div>
</body>
</html>
    `;

    // Retornar HTML para o cliente renderizar
    // O cliente usa window.print() ou jsPDF para gerar PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar HTML do relatório por setor:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
