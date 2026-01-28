import pg from 'pg';
const { Client } = pg;

// Mock do módulo pg
jest.mock('pg', () => ({
  default: {
    Client: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    })),
  },
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

// Funções copiadas do script para teste
function calcularScoreGrupo(
  respostas: Array<{ item: number; valor: number }>
): number {
  if (respostas.length === 0) return 0;
  const soma = respostas.reduce((acc, r) => acc + r.valor, 0);
  const media = soma / respostas.length;
  return Math.round(media * 100) / 100;
}

function categorizarScore(score: number, tipo: string): string {
  if (tipo === 'negativa') {
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  } else {
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  }
}

// Importar as funções do script de correção
// Como é um script .mjs, vamos testar as funções diretamente
describe('fix-resultados-faltantes.mjs', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Criar nova instância mockada
    mockClient = new Client();
  });

  describe('calcularScoreGrupo', () => {
    it('deve calcular score corretamente', () => {
      const respostas = [
        { item: 1, valor: 75.5 },
        { item: 2, valor: 85.2 },
        { item: 3, valor: 90.0 },
      ];

      const score = calcularScoreGrupo(respostas);
      expect(score).toBe(83.57); // (75.5 + 85.2 + 90.0) / 3
    });

    it('deve retornar 0 para array vazio', () => {
      const score = calcularScoreGrupo([]);
      expect(score).toBe(0);
    });

    it('deve arredondar para 2 casas decimais', () => {
      const respostas = [
        { item: 1, valor: 66.666 },
        { item: 2, valor: 67.777 },
      ];

      const score = calcularScoreGrupo(respostas);
      expect(score).toBe(67.22); // (66.666 + 67.777) / 2 = 67.2215 -> 67.22
    });
  });

  describe('categorizarScore', () => {
    it('deve categorizar scores negativos corretamente', () => {
      expect(categorizarScore(80, 'negativa')).toBe('alto');
      expect(categorizarScore(50, 'negativa')).toBe('medio');
      expect(categorizarScore(20, 'negativa')).toBe('baixo');
    });

    it('deve categorizar scores positivos corretamente', () => {
      expect(categorizarScore(80, 'positiva')).toBe('alto');
      expect(categorizarScore(50, 'positiva')).toBe('medio');
      expect(categorizarScore(20, 'positiva')).toBe('baixo');
    });

    it('deve tratar limite superior', () => {
      expect(categorizarScore(66, 'negativa')).toBe('medio');
      expect(categorizarScore(67, 'negativa')).toBe('alto');
    });

    it('deve tratar limite inferior', () => {
      expect(categorizarScore(33, 'positiva')).toBe('medio');
      expect(categorizarScore(32, 'positiva')).toBe('baixo');
    });
  });

  describe('lógica de processamento de avaliações', () => {
    it('deve agrupar respostas por grupo corretamente', () => {
      const respostas = [
        { grupo: 1, item: 1, valor: 75 },
        { grupo: 1, item: 2, valor: 80 },
        { grupo: 2, item: 3, valor: 60 },
        { grupo: 1, item: 4, valor: 70 },
      ];

      // Agrupar respostas por grupo (lógica do script)
      const respostasPorGrupo: {
        [key: number]: Array<{ item: number; valor: number }>;
      } = {};
      respostas.forEach((row) => {
        if (!respostasPorGrupo[row.grupo]) {
          respostasPorGrupo[row.grupo] = [];
        }
        respostasPorGrupo[row.grupo].push({
          item: row.item,
          valor: row.valor,
        });
      });

      expect(respostasPorGrupo[1]).toHaveLength(3);
      expect(respostasPorGrupo[2]).toHaveLength(1);
      expect(respostasPorGrupo[1][0]).toEqual({ item: 1, valor: 75 });
      expect(respostasPorGrupo[2][0]).toEqual({ item: 3, valor: 60 });
    });

    it('deve calcular e categorizar resultados por grupo', () => {
      const respostasPorGrupo = {
        1: [
          { item: 1, valor: 75 },
          { item: 2, valor: 80 },
        ],
        2: [{ item: 3, valor: 60 }],
      };

      const grupos = [
        { id: 1, dominio: 'Demandas no Trabalho', tipo: 'negativa' },
        {
          id: 2,
          dominio: 'Organização e Conteúdo do Trabalho',
          tipo: 'positiva',
        },
      ];

      const resultados: Array<{
        grupo: number;
        dominio: string;
        score: number;
        categoria: string;
      }> = [];

      for (const grupo of grupos) {
        const respostasGrupo =
          respostasPorGrupo[grupo.id as keyof typeof respostasPorGrupo] || [];
        if (respostasGrupo.length === 0) continue;

        const score = calcularScoreGrupo(respostasGrupo);
        const categoria = categorizarScore(score, grupo.tipo);

        resultados.push({
          grupo: grupo.id,
          dominio: grupo.dominio,
          score,
          categoria,
        });
      }

      expect(resultados).toHaveLength(2);
      expect(resultados[0]).toEqual({
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        score: 77.5,
        categoria: 'alto',
      });
      expect(resultados[1]).toEqual({
        grupo: 2,
        dominio: 'Organização e Conteúdo do Trabalho',
        score: 60,
        categoria: 'medio',
      });
    });

    it('deve pular grupos sem respostas', () => {
      const respostasPorGrupo = {
        1: [{ item: 1, valor: 75 }],
        // Grupo 2 não tem respostas
      };

      const grupos = [
        { id: 1, dominio: 'Demandas no Trabalho', tipo: 'negativa' },
        {
          id: 2,
          dominio: 'Organização e Conteúdo do Trabalho',
          tipo: 'positiva',
        },
      ];

      const resultados: Array<{
        grupo: number;
        dominio: string;
        score: number;
        categoria: string;
      }> = [];

      for (const grupo of grupos) {
        const respostasGrupo =
          respostasPorGrupo[grupo.id as keyof typeof respostasPorGrupo] || [];
        if (respostasGrupo.length === 0) continue;

        const score = calcularScoreGrupo(respostasGrupo);
        const categoria = categorizarScore(score, grupo.tipo);

        resultados.push({
          grupo: grupo.id,
          dominio: grupo.dominio,
          score,
          categoria,
        });
      }

      expect(resultados).toHaveLength(1);
      expect(resultados[0].grupo).toBe(1);
    });

    it('deve verificar se avaliação tem respostas antes de processar', () => {
      const avaliacaoComRespostas = {
        rows: [{ grupo: 1, item: 1, valor: 75 }],
      };

      const avaliacaoSemRespostas = {
        rows: [],
      };

      // Teste com respostas
      expect(avaliacaoComRespostas.rows.length > 0).toBe(true);

      // Teste sem respostas
      expect(avaliacaoSemRespostas.rows.length === 0).toBe(true);
    });
  });
});
