/**
 * Testes adaptados: validação do template canonical `gerarHTMLLaudoCompleto`
 * (antigos testes de geração cliente foram removidos porque a geração de
 * laudos deve ocorrer apenas via emissor e usando o template central).
 */

import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';

describe('templates/laudo-html - gerarHTMLLaudoCompleto', () => {
  const laudoPadronizado = {
    loteId: 999,
    etapa1: {
      clinicaNome: 'Clínica de Saúde Ocupacional',
      clinicaEndereco: 'Rua das Flores, 123 - São Paulo/SP',
      clinicaTelefone: '(11) 1234-5678',
      clinicaEmail: 'contato@clinica.com.br',
      empresaAvaliada: 'Empresa Modelo LTDA',
      cnpj: '12.345.678/0001-90',
      endereco: 'Av. Principal, 456 - São Paulo/SP',
      setorAvaliado: 'Administrativo',
      responsavelTecnico: 'Dr. João Oliveira',
      registroProfissional: 'CRP 06/123456',
      dataAvaliacao: '2025-01-15',
      totalFuncionariosAvaliados: 50,
      percentualConclusao: 100,
      periodoAvaliacoes: {
        dataLiberacao: '01/12/2025',
        dataUltimaConclusao: '10/12/2025',
      },
      amostra: { operacional: 40, gestao: 10 },
    },
    etapa2: [
      {
        grupo: 1,
        dominio: 'Demandas Quantitativas',
        descricao: 'Demandas no Trabalho',
        tipo: 'negativa',
        mediaMenosDP: 40.0,
        media: 45.5,
        mediaMaisDP: 51.0,
        classificacaoSemaforo: 'amarelo',
        categoriaRisco: 'medio',
      },
      {
        grupo: 2,
        dominio: 'Influência e Desenvolvimento',
        descricao: 'Organização do Trabalho',
        tipo: 'positiva',
        mediaMenosDP: 70.0,
        media: 75.0,
        mediaMaisDP: 80.0,
        classificacaoSemaforo: 'verde',
        categoriaRisco: 'baixo',
      },
    ],
    etapa3: {
      conclusao: 'Interpretação exemplo',
      gruposExcelente: [],
      gruposMonitoramento: [
        {
          grupo: 2,
          dominio: 'Organização do Trabalho',
          acaoRecomendada: 'Ação 1',
        },
      ],
      gruposAltoRisco: [],
    },
    etapa4: {
      observacoesLaudo: 'Observação exemplo',
      textoConclusao: 'Conclusão exemplo',
      dataEmissao: '2025-01-20T10:00:00Z',
      assinatura: {
        nome: 'Dr. João Oliveira',
        titulo: 'Psicólogo',
        registro: 'CRP 06/123456',
      },
    },
  };

  it('deve retornar uma string HTML contendo as seções esperadas', () => {
    const html = gerarHTMLLaudoCompleto(laudoPadronizado as any);

    expect(typeof html).toBe('string');
    expect(html).toContain(
      'Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)'
    );
    expect(html).toContain('Empresa Modelo LTDA');
    expect(html).toContain('12.345.678/0001-90');
    expect(html).toContain('Demandas no Trabalho');
    expect(html).toContain('Organização do Trabalho');
    expect(html).toContain('Interpretação exemplo');
    expect(html).toContain('Observação exemplo');
  });

  it('deve lidar com etapas vazias sem lançar erro', () => {
    const copia = JSON.parse(JSON.stringify(laudoPadronizado));
    copia.etapa3 = [];
    copia.etapa2 = [];

    expect(() => gerarHTMLLaudoCompleto(copia)).not.toThrow();
  });

  it('deve incluir título e metadados básicos', () => {
    const html = gerarHTMLLaudoCompleto(laudoPadronizado as any);
    // Ajustado: verifica se o título contém "Laudo de Identificação e Mapeamento de Riscos Psicossociais"
    expect(html).toMatch(/<title>.*Laudo de Identificação e Mapeamento de Riscos Psicossociais.*<\/title>/i);
  });
});
