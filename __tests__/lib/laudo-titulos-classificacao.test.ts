/**
 * Testes para validar a remoção dos números e pontos (1., 2., 3.)
 * dos títulos de classificação de risco na seção de Interpretação e Recomendações.
 */

import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';
import { LaudoPadronizado } from '@/lib/laudo-tipos';

const mockLaudo: LaudoPadronizado = {
  loteId: 1,
  etapa1: {
    clinicaNome: 'Clínica Teste',
    clinicaEndereco: 'Rua Teste, 1',
    clinicaTelefone: '(11) 0000-0000',
    clinicaEmail: 'teste@clinica.com',
    empresaAvaliada: 'Empresa Teste LTDA',
    cnpj: '00.000.000/0001-00',
    endereco: 'Av. Teste, 1',
    setorAvaliado: 'Geral',
    responsavelTecnico: 'Dr. Teste',
    registroProfissional: 'CRP 00/000000',
    dataAvaliacao: '2026-01-01',
    totalFuncionariosAvaliados: 10,
    periodoAvaliacoes: {
      dataLiberacao: '01/01/2026',
      dataUltimaConclusao: '01/01/2026',
    },
    amostra: { operacional: 8, gestao: 2 },
  },
  etapa2: [
    {
      grupo: 1,
      dominio: 'Demandas no Trabalho',
      descricao: 'Desc',
      tipo: 'negativa',
      mediaMenosDP: 70,
      media: 80,
      mediaMaisDP: 90,
      classificacaoSemaforo: 'vermelho',
      categoriaRisco: 'alto',
    },
    {
      grupo: 2,
      dominio: 'Apoio Social',
      descricao: 'Desc',
      tipo: 'positiva',
      mediaMenosDP: 30,
      media: 50,
      mediaMaisDP: 70,
      classificacaoSemaforo: 'amarelo',
      categoriaRisco: 'medio',
    },
    {
      grupo: 3,
      dominio: 'Influência no Trabalho',
      descricao: 'Desc',
      tipo: 'positiva',
      mediaMenosDP: 10,
      media: 20,
      mediaMaisDP: 30,
      classificacaoSemaforo: 'verde',
      categoriaRisco: 'baixo',
    },
  ],
  etapa3: {
    conclusao: 'Conclusão geral de teste.',
    gruposExcelente: [
      {
        grupo: 3,
        dominio: 'Influência no Trabalho',
        acaoRecomendada: 'Manter práticas atuais.',
      },
    ],
    gruposMonitoramento: [
      {
        grupo: 2,
        dominio: 'Apoio Social',
        acaoRecomendada: 'Monitorar apoio entre equipes.',
      },
    ],
    gruposAltoRisco: [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        acaoRecomendada: 'Intervenção imediata necessária.',
      },
    ],
  },
  etapa4: {
    observacoesLaudo: 'Sem observações.',
    textoConclusao: 'Conclusão de teste.',
    dataEmissao: '2026-01-01T00:00:00Z',
    assinatura: {
      nome: 'Dr. Teste',
      titulo: 'Psicólogo',
      registro: 'CRP 00/000000',
    },
  },
};

describe('Laudo - Títulos de classificação de risco sem numeração', () => {
  let html: string;

  beforeAll(() => {
    html = gerarHTMLLaudoCompleto(mockLaudo);
  });

  // --- Ausência dos prefixos numerados ---

  it('não deve conter "1. Risco Psicossocial Baixo" no HTML gerado', () => {
    expect(html).not.toContain('1. Risco Psicossocial Baixo');
  });

  it('não deve conter "2. Risco Psicossocial Moderado" no HTML gerado', () => {
    expect(html).not.toContain('2. Risco Psicossocial Moderado');
  });

  it('não deve conter "3. Risco Psicossocial Elevado" no HTML gerado', () => {
    expect(html).not.toContain('3. Risco Psicossocial Elevado');
  });

  // --- Presença dos títulos corretos (sem numeração) ---

  it('deve conter "Risco Psicossocial Baixo (menor que 33%)" sem número', () => {
    expect(html).toContain('Risco Psicossocial Baixo (menor que 33%)');
  });

  it('deve conter "Risco Psicossocial Moderado (entre 33% e 66%)" sem número', () => {
    expect(html).toContain('Risco Psicossocial Moderado (entre 33% e 66%)');
  });

  it('deve conter "Risco Psicossocial Elevado (maior que 66%)" sem número', () => {
    expect(html).toContain('Risco Psicossocial Elevado (maior que 66%)');
  });

  // --- Integridade do HTML (cores e emojis mantidos) ---

  it('deve manter a cor verde (#15803d) no título de risco baixo', () => {
    expect(html).toMatch(/color: #15803d[^>]*>Risco Psicossocial Baixo/);
  });

  it('deve manter a cor amarela (#a16207) no título de risco moderado', () => {
    expect(html).toMatch(/color: #a16207[^>]*>Risco Psicossocial Moderado/);
  });

  it('deve manter a cor vermelha (#b91c1c) no título de risco elevado', () => {
    expect(html).toMatch(/color: #b91c1c[^>]*>Risco Psicossocial Elevado/);
  });

  it('deve manter os emojis de semáforo nos cards de classificação', () => {
    expect(html).toContain('🟢');
    expect(html).toContain('🟡');
    expect(html).toContain('🔴');
  });

  it('não deve conter padrão genérico de número+ponto antes de "Risco Psicossocial" nos h4', () => {
    // Garante que nenhum h4 começa com dígito seguido de ponto antes do título
    const h4Matches = html.match(/<h4[^>]*>[\s\S]*?<\/h4>/g) || [];
    const h4RiscoComNumero = h4Matches.filter((h4) =>
      />\s*\d+\.\s+Risco Psicossocial/.test(h4)
    );
    expect(h4RiscoComNumero).toHaveLength(0);
  });
});
