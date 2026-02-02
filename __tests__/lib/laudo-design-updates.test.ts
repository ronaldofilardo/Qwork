/**
 * Testes para validar as alterações de design do laudo:
 * - Remoção de cores laranjas da tabela (substituídas por cinza/preto)
 * - Remoção de backgrounds e bordas dos cards de classificação de risco
 * - Adição de page-break-inside: avoid para evitar títulos órfãos
 * - Manutenção do fundo azul nos boxes informativos
 */

import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';
import { LaudoPadronizado } from '@/lib/laudo-tipos';

describe('Laudo - Alterações de Design', () => {
  const mockLaudoCompleto: LaudoPadronizado = {
    etapa1: {
      clinicaNome: 'Clínica Teste',
      clinicaEndereco: 'Rua Teste, 123',
      clinicaTelefone: '(11) 1234-5678',
      clinicaEmail: 'teste@clinica.com',
      empresaAvaliada: 'Empresa Teste LTDA',
      cnpj: '12.345.678/0001-90',
      endereco: 'Av. Teste, 456',
      setorAvaliado: 'Administrativo',
      responsavelTecnico: 'Dr. Teste',
      registroProfissional: 'CRP 06/123456',
      dataAvaliacao: '2026-01-31',
      totalFuncionariosAvaliados: 100,
      percentualConclusao: 100,
      periodoAvaliacoes: {
        dataLiberacao: '01/01/2026',
        dataUltimaConclusao: '31/01/2026',
      },
      amostra: { operacional: 80, gestao: 20 },
    },
    etapa2: [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        descricao: 'Avaliação das exigências quantitativas',
        tipo: 'negativa',
        mediaMenosDP: 30.0,
        media: 50.0,
        mediaMaisDP: 70.0,
        classificacaoSemaforo: 'amarelo',
        categoriaRisco: 'medio',
      },
      {
        grupo: 10,
        dominio: 'Endividamento Financeiro',
        descricao: 'Avaliação do nível de endividamento',
        tipo: 'negativa',
        mediaMenosDP: 5.0,
        media: 25.0,
        mediaMaisDP: 45.0,
        classificacaoSemaforo: 'verde',
        categoriaRisco: 'baixo',
      },
    ],
    etapa3: {
      conclusao: 'Conclusão geral da avaliação psicossocial',
      gruposExcelente: [
        {
          grupo: 10,
          dominio: 'Endividamento Financeiro',
          acaoRecomendada: 'Manter práticas de educação financeira',
        },
      ],
      gruposMonitoramento: [
        {
          grupo: 1,
          dominio: 'Demandas no Trabalho',
          acaoRecomendada: 'Monitorar cargas de trabalho',
        },
      ],
      gruposAltoRisco: [],
    },
    etapa4: {
      observacoesLaudo: 'Observações adicionais sobre o laudo',
      textoConclusao: 'Conclusão final do laudo',
      dataEmissao: '2026-01-31T12:00:00Z',
      assinatura: {
        nome: 'Dr. Teste Silva',
        titulo: 'Psicólogo',
        registro: 'CRP 06/123456',
      },
    },
  };

  describe('Tabela de Scores - Cores Neutras', () => {
    let html: string;

    beforeAll(() => {
      html = gerarHTMLLaudoCompleto(mockLaudoCompleto);
    });

    it('não deve conter cores laranjas na tabela de scores', () => {
      // Verifica ausência de códigos de cor laranja
      expect(html).not.toMatch(/#fb923c/i);
      expect(html).not.toMatch(/#f97316/i);
      expect(html).not.toMatch(/#ea580c/i);
      expect(html).not.toMatch(/#fed7aa/i);
      expect(html).not.toMatch(/#c2410c/i);
    });

    it('deve usar gradiente cinza escuro no cabeçalho da tabela', () => {
      expect(html).toMatch(
        /background:\s*linear-gradient\(to right,\s*#1f2937,\s*#374151\)/i
      );
    });

    it('deve usar bordas cinza na tabela', () => {
      expect(html).toMatch(/border:\s*1px solid #6b7280/i);
    });

    it('deve usar background cinza claro no badge do grupo', () => {
      expect(html).toMatch(/background-color:\s*#e5e7eb/i);
      expect(html).toMatch(/color:\s*#1f2937/i);
    });

    it('deve usar linhas zebradas com cinza claro', () => {
      expect(html).toMatch(/#f9fafb/i);
    });
  });

  describe('Cards de Classificação de Risco - Sem Background/Bordas', () => {
    let html: string;

    beforeAll(() => {
      html = gerarHTMLLaudoCompleto(mockLaudoCompleto);
    });

    it('não deve ter classes de background nos cards de risco', () => {
      // Verifica que as classes resumo-card-verde/amarelo/vermelho estão vazias
      expect(html).toMatch(/\.resumo-card-verde\s*{\s*}/);
      expect(html).toMatch(/\.resumo-card-amarelo\s*{\s*}/);
      expect(html).toMatch(/\.resumo-card-vermelho\s*{\s*}/);
    });

    it('não deve ter border e border-radius na classe base resumo-card', () => {
      const cssMatch = html.match(/\.resumo-card\s*{[^}]+}/);
      expect(cssMatch).toBeTruthy();
      expect(cssMatch[0]).not.toMatch(/border:/);
      expect(cssMatch[0]).not.toMatch(/border-radius:/);
      expect(cssMatch[0]).toMatch(/padding:\s*18px/);
    });
  });

  describe('Page Break - Evitar Títulos Órfãos', () => {
    let html: string;

    beforeAll(() => {
      html = gerarHTMLLaudoCompleto(mockLaudoCompleto);
    });

    it('deve ter page-break-inside: avoid nos divs dos grupos identificados', () => {
      // Verifica que os divs dos grupos têm a propriedade para evitar quebras
      const grupoMatches = html.match(
        /margin-bottom:\s*8px;\s*page-break-inside:\s*avoid;/g
      );
      expect(grupoMatches).toBeTruthy();
      expect(grupoMatches.length).toBeGreaterThan(0);
    });

    it('deve manter a estrutura de grupos com título e recomendação juntos', () => {
      // Verifica que o grupo 10 (Endividamento Financeiro) está no HTML
      expect(html).toMatch(/10\.\s*Endividamento Financeiro/);
      expect(html).toMatch(/Manter práticas de educação financeira/);
    });
  });

  describe('Boxes Azuis - Mantidos', () => {
    let html: string;

    beforeAll(() => {
      html = gerarHTMLLaudoCompleto(mockLaudoCompleto);
    });

    it('deve manter o background azul nos boxes informativos', () => {
      // Verifica que a classe info-box-azul ainda existe
      expect(html).toMatch(/\.info-box-azul\s*{/);
      expect(html).toMatch(
        /background:\s*linear-gradient\(to right,\s*#dbeafe,\s*#bfdbfe\)/i
      );
      expect(html).toMatch(/border-color:\s*#3b82f6/i);
    });

    it('deve ter o box azul na seção 3 (Interpretação)', () => {
      // Verifica que o box azul está presente na seção 3
      expect(html).toMatch(/<div class="info-box info-box-azul">/);
      expect(html).toMatch(/3\.\s*INTERPRETAÇÃO E RECOMENDAÇÕES/);
    });
  });

  describe('Section Titles - Bordas Cinza', () => {
    let html: string;

    beforeAll(() => {
      html = gerarHTMLLaudoCompleto(mockLaudoCompleto);
    });

    it('deve usar border cinza escuro nos títulos de seção', () => {
      const sectionTitleMatch = html.match(/\.section-title\s*{[^}]+}/);
      expect(sectionTitleMatch).toBeTruthy();
      expect(sectionTitleMatch[0]).toMatch(
        /border-bottom:\s*2px solid #4b5563/i
      );
      expect(sectionTitleMatch[0]).not.toMatch(/#fb923c/i);
    });
  });

  describe('Validação Completa do HTML', () => {
    it('deve gerar HTML válido sem erros', () => {
      expect(() => {
        gerarHTMLLaudoCompleto(mockLaudoCompleto);
      }).not.toThrow();
    });

    it('deve conter todas as seções esperadas', () => {
      const html = gerarHTMLLaudoCompleto(mockLaudoCompleto);

      expect(html).toContain('1. DADOS GERAIS DA EMPRESA AVALIADA');
      expect(html).toContain('2. SCORES MÉDIOS POR GRUPO DE QUESTÕES');
      expect(html).toContain('3. INTERPRETAÇÃO E RECOMENDAÇÕES');
      expect(html).toContain('4. OBSERVAÇÕES E CONCLUSÃO');
    });
  });
});
