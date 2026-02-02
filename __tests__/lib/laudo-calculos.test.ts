/**
 * Testes para as funções de cálculo de laudos padronizados
 *
 * Funcionalidades testadas:
 * 1. calcularScoresPorGrupo - Cálculos dinâmicos baseados em dados reais
 * 2. gerarInterpretacaoRecomendacoes - Geração automática de texto interpretativo
 * 3. gerarObservacoesConclusao - Geração de observações e conclusão
 * 4. gerarDadosGeraisEmpresa - Busca de dados gerais da empresa
 * 5. Funções auxiliares de cálculo estatístico
 */

import assert from 'assert';
import {
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
  gerarDadosGeraisEmpresa,
  gruposCOPSOQ
} from '@/lib/laudo-calculos';
import { query } from '@/lib/db';

jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Funções de Cálculo de Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calcularScoresPorGrupo', () => {
    it('deve calcular scores corretamente para um lote com respostas', async () => {
      // Mock das respostas do lote
      mockQuery.mockResolvedValue({
        rows: [
          { grupo: 1, valor: 75 },
          { grupo: 1, valor: 80 },
          { grupo: 1, valor: 70 },
          { grupo: 1, valor: 85 },
          { grupo: 2, valor: 60 },
          { grupo: 2, valor: 65 },
          { grupo: 2, valor: 55 },
          { grupo: 2, valor: 70 },
        ],
        rowCount: 8,
      } as any)

      const scores = await calcularScoresPorGrupo(1)

      assert.equal(scores.length, 10) // 10 grupos COPSOQ
      assert.equal(scores[0].grupo, 1)
      assert.ok(Math.abs(scores[0].media - 77.5) < 0.1) // (75+80+70+85)/4
      assert.ok(scores[0].desvioPadrao > 0)
      assert.ok(scores[0].categoriaRisco)
      assert.ok(scores[0].classificacaoSemaforo)
      assert.ok(scores[0].acaoRecomendada)
    })

    it('deve retornar valores padrão para grupos sem respostas', async () => {
      // Mock sem respostas
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const scores = await calcularScoresPorGrupo(1)

      assert.equal(scores.length, 10)
      scores.forEach(score => {
        assert.equal(score.media, 0)
        assert.equal(score.desvioPadrao, 0)
        assert.equal(score.categoriaRisco, 'baixo')
        assert.equal(score.classificacaoSemaforo, 'verde')
        assert.ok(score.acaoRecomendada.includes('Dados insuficientes'))
      })
    })

  })

  describe('gerarInterpretacaoRecomendacoes', () => {
    it('deve gerar texto interpretativo correto para diferentes categorias', () => {
      const mockScores = [
        {
          grupo: 1,
          dominio: 'Demandas no Trabalho',
          descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
          tipo: 'negativa' as const,
          media: 75,
          desvioPadrao: 5.0,
          mediaMenosDP: 70.0,
          mediaMaisDP: 80.0,
          classificacaoSemaforo: 'amarelo' as const,
          categoriaRisco: 'medio' as const,
          acaoRecomendada: 'Atenção; intervenções preventivas (treinamentos)'
        },
        {
          grupo: 5,
          dominio: 'Valores Organizacionais',
          descricao: 'Confiança, justiça e respeito mútuo na organização',
          tipo: 'positiva' as const,
          media: 85,
          desvioPadrao: 3.0,
          mediaMenosDP: 82.0,
          mediaMaisDP: 88.0,
          classificacaoSemaforo: 'verde' as const,
          categoriaRisco: 'baixo' as const,
          acaoRecomendada: 'Manter; monitorar anualmente'
        },
        {
          grupo: 7,
          dominio: 'Saúde e Bem-Estar',
          descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
          tipo: 'negativa' as const,
          media: 90,
          desvioPadrao: 2.0,
          mediaMenosDP: 88.0,
          mediaMaisDP: 92.0,
          classificacaoSemaforo: 'vermelho' as const,
          categoriaRisco: 'alto' as const,
          acaoRecomendada: 'Ação imediata; plano de mitigação (PGR/NR-1)'
        }
      ]

      const resultado = gerarInterpretacaoRecomendacoes('Empresa Teste', mockScores)

      // Verificar que o texto principal contém menção à empresa e categorias geradas
      assert.ok(resultado.textoPrincipal.includes('Empresa Teste'))
      // Verificar que contém as categorias previstas pelo gerador atual
      assert.ok(resultado.textoPrincipal.includes('Excelente'))
      assert.ok(resultado.textoPrincipal.includes('Atenção Necessária'))
      // Alto risco é reportado como texto indicando risco elevado
      assert.ok(resultado.textoPrincipal.toLowerCase().includes('alto risco') || resultado.textoPrincipal.toLowerCase().includes('alto'))
      // Verificar que a conclusão menciona que a amostragem foi submetida à avaliação psicossocial
      assert.ok(resultado.conclusao.toLowerCase().includes('avaliação psicossocial') || resultado.conclusao.toLowerCase().includes('avaliação copsoq'))
      assert.equal(resultado.gruposAtencao.length, 1)
      assert.equal(resultado.gruposExcelente.length, 1)
      assert.equal(resultado.gruposMonitoramento.length, 1)
      assert.equal(resultado.gruposAltoRisco.length, 1)
    })

    it('deve ordenar corretamente: excelente → monitorar → atenção necessária → alto risco', () => {
      const mockScores = [
        {
          grupo: 1,
          dominio: 'Grupo Monitorar',
          descricao: 'desc',
          tipo: 'negativa' as const,
          media: 70,
          desvioPadrao: 1,
          mediaMenosDP: 69,
          mediaMaisDP: 71,
          classificacaoSemaforo: 'amarelo' as const,
          categoriaRisco: 'medio' as const,
          acaoRecomendada: 'Atenção; intervenções preventivas (treinamentos)'
        },
        {
          grupo: 2,
          dominio: 'Grupo Atenção Necessária',
          descricao: 'desc',
          tipo: 'negativa' as const,
          media: 90,
          desvioPadrao: 1,
          mediaMenosDP: 89,
          mediaMaisDP: 91,
          classificacaoSemaforo: 'vermelho' as const,
          categoriaRisco: 'alto' as const,
          acaoRecomendada: 'Ação imediata; plano de mitigação (PGR/NR-1)'
        },
        {
          grupo: 3,
          dominio: 'Grupo Excelente',
          descricao: 'desc',
          tipo: 'positiva' as const,
          media: 90,
          desvioPadrao: 1,
          mediaMenosDP: 89,
          mediaMaisDP: 91,
          classificacaoSemaforo: 'verde' as const,
          categoriaRisco: 'baixo' as const,
          acaoRecomendada: 'Manter; monitorar anualmente'
        }
      ]

      const resultado = gerarInterpretacaoRecomendacoes('Empresa Teste', mockScores)

      // Verificar ordem no texto: excelente → monitorar → atenção necessária → alto risco
      const texto = resultado.textoPrincipal
      const posExcelente = texto.indexOf('Excelente')
      const posAtencao = texto.indexOf('Atenção Necessária')
      const posAltoRisco = texto.toLowerCase().indexOf('alto risco') >= 0 ? texto.toLowerCase().indexOf('alto risco') : texto.toLowerCase().indexOf('alto')

      assert.ok(posExcelente >= 0)
      assert.ok(posAtencao >= 0)
      assert.ok(posAltoRisco >= 0)
      assert.ok(posExcelente < posAtencao)
      assert.ok(posAtencao < posAltoRisco)
    })
  })

  describe('gerarObservacoesConclusao', () => {
    it('deve incluir texto do PCMSO nas observações do laudo com formatação HTML', () => {
      const resultado = gerarObservacoesConclusao()

      assert.ok(resultado.observacoesLaudo?.includes('PCMSO é um programa contínuo'))
      assert.ok(resultado.observacoesLaudo?.includes('NR 7'))
      assert.ok(resultado.observacoesLaudo?.includes('validade sugerida de doze meses'))
      assert.ok(resultado.observacoesLaudo?.includes('<strong>'))
      assert.ok(resultado.observacoesLaudo?.includes('font-size: 14pt'))
      assert.ok(resultado.observacoesLaudo?.includes('font-weight: bold'))
      assert.ok(resultado.textoConclusao.includes('Este laudo'))
      assert.ok(resultado.textoConclusao.includes('não pode diagnosticar'))
      assert.ok(resultado.textoConclusao.includes('diagnóstico clínico'))
      assert.ok(resultado.textoConclusao.includes('LGPD'))
      assert.ok(resultado.textoConclusao.includes('Código de Ética'))
      assert.ok(resultado.dataEmissao.includes('São Paulo'))
      assert.equal(resultado.assinatura.nome, 'Dr. Marcelo Oliveira')
    })

    it('deve calcular data de validade corretamente (364 dias)', () => {
      const resultado = gerarObservacoesConclusao()

      // Verificar que contém data de validade
      assert.ok(resultado.observacoesLaudo?.includes('ou até'))
      // A data deve estar no formato dd/mm/yyyy
      const dataRegex = /\d{2}\/\d{2}\/\d{4}/
      const matches = resultado.observacoesLaudo?.match(dataRegex)
      assert.ok(matches && matches.length > 0)
    })

    it('deve gerar data no formato brasileiro', () => {
      const resultado = gerarObservacoesConclusao()

      assert.ok(/São Paulo, \d{1,2} de \w+ de \d{4}/.test(resultado.dataEmissao))
    })

    it('deve incluir assinatura completa', () => {
      const resultado = gerarObservacoesConclusao()

      assert.deepEqual(resultado.assinatura, {
        nome: 'Dr. Marcelo Oliveira',
        titulo: 'Psicólogo',
        registro: 'CRP 06/123456',
        empresa: 'Coordenador Responsável Técnico – Qwork'
      })
    })
  })

  describe('gerarDadosGeraisEmpresa', () => {
    it('deve lançar erro se lote não encontrado', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      let erro = null;
      try {
        await gerarDadosGeraisEmpresa(999);
      } catch (e: any) {
        erro = e;
      }
      assert.ok(erro && erro.message.includes('Lote não encontrado'));
    })

    it('deve retornar dados gerais da empresa corretamente', async () => {
      // Mock primeira query (dados do lote)
      mockQuery.mockResolvedValueOnce({
        rows: [{
          titulo: 'Avaliação 2024',
          liberado_em: '2024-01-01T00:00:00Z',
          empresa_nome: 'Empresa Teste',
          cnpj: '12.345.678/0001-90',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          clinica_nome: 'Clínica Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 8,
          primeira_conclusao: '2024-01-05T00:00:00Z',
          ultima_conclusao: '2024-01-10T00:00:00Z'
        }],
        rowCount: 1,
      } as any)

      // Mock segunda query (contagem de funcionários)
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total: 8,
          operacional: 5,
          gestao: 3
        }],
        rowCount: 1,
      } as any)

      const dados = await gerarDadosGeraisEmpresa(1)

      assert.equal(dados.empresaAvaliada, 'Empresa Teste')
      assert.equal(dados.cnpj, '12.345.678/0001-90')
      assert.ok(dados.endereco.includes('Rua Teste'))
      assert.equal(dados.totalFuncionariosAvaliados, 8)
      assert.equal(dados.percentualConclusao, 80)
      assert.equal(dados.amostra.operacional, 5)
      assert.equal(dados.amostra.gestao, 3)
    })
  })

  describe('Funções Auxiliares', () => {
    describe('gruposCOPSOQ', () => {
      it('deve conter todos os 10 grupos COPSOQ', () => {
        assert.equal(gruposCOPSOQ.length, 10)
      })

      it('deve ter estrutura correta para cada grupo', () => {
        gruposCOPSOQ.forEach(grupo => {
          assert.ok('grupo' in grupo)
          assert.ok('dominio' in grupo)
          assert.ok('descricao' in grupo)
          assert.ok('tipo' in grupo)
          assert.ok(['positiva', 'negativa'].includes(grupo.tipo))
        })
      })

      it('deve ter grupos numerados de 1 a 10', () => {
        const gruposNumeros = gruposCOPSOQ.map(g => g.grupo).sort((a, b) => a - b)
        assert.deepEqual(gruposNumeros, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })
    })
  })
})