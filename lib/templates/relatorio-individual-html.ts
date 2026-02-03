/**
 * Template HTML simples para Relatório Individual
 * Usado apenas pela rota HTML (client-side PDF generation)
 * Deve ser compacto e representativo do layout de uma página
 */

export interface RelatorioIndividualData {
  funcionario: {
    nome: string;
    cpf: string;
    perfil?: string;
    empresa?: string;
    setor?: string;
    funcao?: string;
    matricula?: string;
  };
  lote?: {
    id?: string | number;
    codigo?: string;
    titulo?: string;
  };
  envio?: string;
  grupos: Array<{
    id: number;
    titulo: string;
    dominio: string;
    media: string | number;
    classificacao?: string;
    corClassificacao?: string;
  }>;
}

// Pequena função de escape para evitar injeção em templates HTML
function escapeHtml(s: any) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function gerarHTMLRelatorioIndividual(dados: RelatorioIndividualData) {
  const { funcionario, lote, envio, grupos } = dados;

  const grupoHtml = grupos
    .map((g) => {
      const cor = g.corClassificacao || '#000';
      return `
        <div class="grupo">
          <div class="grupo-titulo">${escapeHtml(g.dominio)} - Grupo ${g.id} - ${escapeHtml(
            g.titulo
          )}</div>
          <div class="grupo-media" style="color:${cor}">Média: ${String(
            g.media
          )} - ${(g.classificacao || '').toUpperCase() || ''}</div>
        </div>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório Individual de Avaliação</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color:#111; padding:12px; }
    h1 { text-align:center; font-size:18px; margin-bottom:6px; }
    .section { margin-bottom:8px; }
    .label { font-weight:700; margin-right:6px; }
    .small { font-size:12px; }
    .grupo { margin-bottom:6px; }
    .grupo-titulo { font-weight:700; font-size:12px; }
    .grupo-media { font-size:11px; margin-left:4px; }
    .dados { font-size:12px; }
    footer { position:fixed; bottom:8px; width:100%; text-align:center; font-size:10px; color:#666 }
  </style>
</head>
<body>
  <h1>Relatório Individual de Avaliação</h1>

  <div class="section dados">
    <div><span class="label">Nome:</span>${escapeHtml(funcionario.nome)}</div>
    <div><span class="label">CPF:</span>${escapeHtml(funcionario.cpf)}</div>
    <div><span class="label">Matrícula:</span>${escapeHtml(funcionario.matricula || '-')}</div>
    <div><span class="label">Empresa:</span>${escapeHtml(funcionario.empresa || '-')}</div>
    <div><span class="label">Setor:</span>${escapeHtml(funcionario.setor || '-')}</div>
    <div><span class="label">Função:</span>${escapeHtml(funcionario.funcao || '-')}</div>
    <div><span class="label">Nível:</span>${escapeHtml(funcionario.perfil || '-')}</div>
  </div>

  <div class="section dados">
    <div><span class="label">Código do Lote:</span>${escapeHtml(lote?.codigo || '-')}</div>
    <div><span class="label">Título:</span>${escapeHtml(lote?.titulo || '-')}</div>
    <div><span class="label">Data de Conclusão:</span>${escapeHtml(envio || '-')}</div>
  </div>

  <div class="section">
    <h2 style="font-size:14px; margin-bottom:6px;">Resultados por Domínio</h2>
    ${grupoHtml}
  </div>

  <footer>Gerado em ${new Date().toLocaleString('pt-BR')}</footer>
</body>
</html>`;
}
