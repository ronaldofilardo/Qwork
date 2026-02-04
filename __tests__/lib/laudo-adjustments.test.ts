import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';
import { getLogoSignatureTemplate } from '@/lib/pdf/puppeteer-templates';

const laudoPadronizado = {
  loteId: 123,
  etapa1: {
    empresaAvaliada: 'Empresa Teste LTDA',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua Teste, 123',
    periodoAvaliacoes: {
      dataLiberacao: '01/01/2025',
      dataUltimaConclusao: '10/01/2025',
    },
    totalFuncionariosAvaliados: 10,
    percentualConclusao: 100,
    amostra: { operacional: 8, gestao: 2 },
  },
  etapa2: [
    {
      grupo: 1,
      dominio: 'Demandas no Trabalho',
      descricao: 'Descrição exemplo',
      tipo: 'negativa',
      mediaMenosDP: 20,
      media: 40,
      mediaMaisDP: 60,
      classificacaoSemaforo: 'amarelo',
      categoriaRisco: 'medio',
    },
  ],
  etapa3: {
    conclusao:
      'A amostragem foi submetida à avaliação psicossocial utilizando o questionário COPSOQ III (médio).',
    gruposExcelente: [],
    gruposMonitoramento: [
      {
        grupo: 2,
        dominio: 'Organização e Conteúdo do Trabalho',
        acaoRecomendada: 'Ação',
      },
    ],
    gruposAltoRisco: [],
  },
  etapa4: {
    observacoesLaudo: 'Observação de teste',
    textoConclusao: 'Conclusão de teste',
    dataEmissao: 'São Paulo, 01 de janeiro de 2025',
    assinatura: {
      nome: 'Dr. Teste',
      titulo: 'Psicólogo',
      registro: 'CRP 06/000000',
    },
  },
};

describe('Laudo Template Adjustments', () => {
  it('should include compact table class for section 2', () => {
    const html = gerarHTMLLaudoCompleto(laudoPadronizado as any);
    expect(html).toEqual(expect.any(String));
    expect(html).toContain('compact-table');
  });

  it('should not include the legacy "Lista de Avaliações Concluídas" annex', () => {
    const html = gerarHTMLLaudoCompleto(laudoPadronizado as any);
    expect(html).not.toContain('Lista de Avaliações Concluídas');
    expect(html).not.toMatch(/Lista de Avalia/);
  });

  it('should render the interpretation box and place detailed cards on subsequent pages (page-break)', () => {
    const html = gerarHTMLLaudoCompleto(laudoPadronizado as any);
    const boxIndex = html.indexOf(laudoPadronizado.etapa3.conclusao);
    const breakIndex = html.indexOf('page-break-before: always');
    expect(boxIndex).toBeGreaterThan(-1);
    expect(breakIndex).toBeGreaterThan(-1);
    expect(breakIndex).toBeGreaterThan(boxIndex);
  });

  it('logo signature template should not include slogan and should use larger width (180px)', () => {
    const tpl = getLogoSignatureTemplate();
    expect(tpl).toContain('width: 180px');
    expect(tpl).not.toMatch(/AVALIE\s*\.\s*PREVINA\s*\.\s*PROTEJA\.?/i);
  });
});
