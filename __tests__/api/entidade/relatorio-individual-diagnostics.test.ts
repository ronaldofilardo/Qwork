/**
 * Testes para geração de PDF com jsPDF no endpoint relatorio-individual
 * Verifica layout compacto de uma página
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('Relatório Individual - Geração com jsPDF (Uma Página)', () => {
  const routePath = path.join(
    process.cwd(),
    'app/api/entidade/lote/[id]/relatorio-individual/route.ts'
  );

  it('deve importar jsPDF e jspdf-autotable', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toMatch(/import\s+jsPDF\s+from\s+['"]jspdf['"]/);
    expect(content).toMatch(/import\s+{\s*applyPlugin\s*}\s+from\s+['"]jspdf-autotable['"]/);
  });

  it('não deve importar Puppeteer ou módulos HTML', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).not.toContain('getPuppeteerInstance');
    expect(content).not.toContain('gerarHTMLRelatorioIndividual');
    expect(content).not.toContain('@sparticuz/chromium');
    expect(content).not.toContain('puppeteer');
  });

  it('deve aplicar plugin AutoTable ao jsPDF', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('applyPlugin(jsPDF)');
  });

  it('deve declarar tipos estendidos para jsPDF', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('declare module');
    expect(content).toContain('autoTable');
  });

  it('deve gerar PDF diretamente sem HTML', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('new jsPDF()');
    expect(content).toContain('doc.output(');
    expect(content).not.toContain('setContent');
    expect(content).not.toContain('html');
  });

  it('deve usar layout compacto sem tabelas detalhadas de questões', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    // Não deve ter autoTable para respostas detalhadas
    expect(content).not.toContain('respostasData');
    expect(content).not.toContain("head: [['Questão', 'Valor']]");
  });

  it('deve mostrar apenas resumo dos grupos (sem detalhes)', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('Resultados por Domínio');
    expect(content).toContain('grupo.dominio');
    expect(content).toContain('grupo.media');
    expect(content).toContain('classificacaoTexto');
  });

  it('deve converter cores hexadecimais para RGB', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('hexToRgb');
    expect(content).toContain('setTextColor');
  });

  it('deve incluir informações do funcionário e lote', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('Dados do Funcionário');
    expect(content).toContain('Dados da Avaliação');
  });

  it('deve ter rodapé simples (sem número de página)', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('Gerado em');
    expect(content).not.toContain('Página ${i} de ${pageCount}');
  });

  it('deve retornar PDF como NextResponse com headers corretos', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).toContain('application/pdf');
    expect(content).toContain('Content-Disposition');
    expect(content).toContain('attachment');
  });

  it('não deve persistir PDF no banco de dados', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    expect(content).not.toContain('INSERT INTO laudos');
    expect(content).not.toContain('UPDATE laudos');
    expect(content).not.toContain('relatorio_individual');
    expect(content).not.toContain('hash_relatorio_individual');
  });
});
