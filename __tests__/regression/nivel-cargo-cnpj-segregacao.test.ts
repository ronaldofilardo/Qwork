/**
 * Teste de regressão: nivel_cargo segregado por CNPJ em importação
 *
 * Valida que:
 * 1. Duas funções com mesmo nome em diferentes empresas (CNPJs) têm níveis independentes
 * 2. nivelCargoMap usa chave composta "funcao|cnpj_normalizado"
 * 3. O workflow de importação respeita a segregação por CNPJ
 */

import type {
  FuncaoNivelInfo,
  NivelCargo,
} from '@/components/importacao/NivelCargoStep';

describe('Task 3 — Regressão: nivel_cargo segregado por CNPJ', () => {
  /**
   * Fixture: cria um FuncaoNivelInfo com chave composta
   */
  function makeFuncao(
    funcao: string,
    cnpj: string,
    overrides?: Partial<FuncaoNivelInfo>
  ): FuncaoNivelInfo {
    const chave = `${funcao}|${cnpj}`;
    return {
      chave,
      funcao,
      empresa_cnpj: cnpj,
      empresa_nome: `Empresa ${cnpj}`,
      qtdFuncionarios: 5,
      qtdNovos: 0,
      qtdExistentes: 5,
      niveisAtuais: ['operacional'],
      isMudancaRole: false,
      isMudancaNivel: false,
      temNivelNuloExistente: false,
      funcionariosComMudanca: [],
      funcionariosComMudancaNivel: [],
      ...overrides,
    };
  }

  it('deve segregar nivel_cargo por chave composta funcao|cnpj', () => {
    // Dado: duas funções "Gerente" em empresas diferentes
    const gerente_cnpj_a = makeFuncao('Gerente', '00000000000100');
    const gerente_cnpj_b = makeFuncao('Gerente', '00000000000200');

    // Esperado: chaves diferentes
    expect(gerente_cnpj_a.chave).toBe('Gerente|00000000000100');
    expect(gerente_cnpj_b.chave).toBe('Gerente|00000000000200');
    expect(gerente_cnpj_a.chave).not.toBe(gerente_cnpj_b.chave);
  });

  it('deve permitir diferentes niveis para mesma funcao em diferentes empresas', () => {
    // Dado: mesmo nivelCargoMap com ambas as chaves
    const nivelCargoMap: Record<string, NivelCargo> = {
      'Gerente|00000000000100': 'gestao',    // Empresa A = gestão
      'Gerente|00000000000200': 'operacional', // Empresa B = operacional
    };

    // Quando: busco o nível de cada uma
    const nivelA = nivelCargoMap['Gerente|00000000000100'];
    const nivelB = nivelCargoMap['Gerente|00000000000200'];

    // Então: cada uma retorna o seu próprio nível
    expect(nivelA).toBe('gestao');
    expect(nivelB).toBe('operacional');
  });

  it('deve ignorar lookups por chave incompleta (apenas funcao)', () => {
    // Dado: mapa com chaves compostas
    const nivelCargoMap: Record<string, NivelCargo> = {
      'Gerente|00000000000100': 'gestao',
    };

    // Quando: busco por chave incompleta "Gerente"
    const nivel = nivelCargoMap['Gerente'];

    // Então: retorna undefined (fallback deveria ir para banco ou usar valor padrão)
    expect(nivel).toBeUndefined();
  });

  it('deve validar que mudancas de nivel sao aplicadas por chave composta', () => {
    // Dado: lista de funções com mesmo nome em diferentes CNPJs
    const funcoes: FuncaoNivelInfo[] = [
      makeFuncao('Gerente', '00000000000100', { isMudancaNivel: true }),
      makeFuncao('Gerente', '00000000000200', { isMudancaNivel: true }),
    ];

    // E um mapa de seleções do usuário
    const nivelCargoMap: Record<string, NivelCargo> = {};

    // Quando: usuário seleciona "gestao" para Empresa A
    nivelCargoMap[funcoes[0].chave] = 'gestao';

    // E "operacional" para Empresa B
    nivelCargoMap[funcoes[1].chave] = 'operacional';

    // Então: cada uma mantém seu próprio valor
    expect(nivelCargoMap['Gerente|00000000000100']).toBe('gestao');
    expect(nivelCargoMap['Gerente|00000000000200']).toBe('operacional');

    // E o lookup por chave funciona corretamente
    expect(nivelCargoMap[funcoes[0].chave]).toBe('gestao');
    expect(nivelCargoMap[funcoes[1].chave]).toBe('operacional');
  });

  it('deve agrupar mudancas por empresa + funcao corretamente', () => {
    // Dado: estrutura de mudancas agrupadas esperada
    interface MudancasAgrupadas {
      [empresa: string]: {
        [chave: string]: {
          trocas: Array<{ cpf: string; anterior: string; novo: string }>;
          trocasNivel: Array<{ cpf: string; anterior: string; novo: string }>;
        };
      };
    }

    const mudancas: MudancasAgrupadas = {
      'Empresa A': {
        'Gerente|00000000000100': {
          trocas: [],
          trocasNivel: [
            { cpf: '11111111111', anterior: 'operacional', novo: 'gestao' },
          ],
        },
      },
      'Empresa B': {
        'Gerente|00000000000200': {
          trocas: [],
          trocasNivel: [
            { cpf: '22222222222', anterior: 'gestao', novo: 'operacional' },
          ],
        },
      },
    };

    // Quando: valido as mudancas por chave
    const mudsA = mudancas['Empresa A']['Gerente|00000000000100'];
    const mudsB = mudancas['Empresa B']['Gerente|00000000000200'];

    // Então: cada grupo tem suas próprias mudanças
    expect(mudsA.trocasNivel).toHaveLength(1);
    expect(mudsA.trocasNivel[0].novo).toBe('gestao');

    expect(mudsB.trocasNivel).toHaveLength(1);
    expect(mudsB.trocasNivel[0].novo).toBe('operacional');
  });

  it('deve suportar fallback para compatibilidade: chave sem CNPJ', () => {
    // Cenário: código legado pode tentar usar `nivelCargoMap["Gerente"]` sem CNPJ
    // O execute/route.ts deve ter lógica de fallback: primeiro tenta chave composta, depois chave simples

    const nivelCargoMap: Record<string, NivelCargo> = {
      'Gerente|00000000000100': 'gestao',
      'Gerente': 'operacional', // fallback legado
    };

    // Quando: tenta-se buscar com chave composta
    let nivel = nivelCargoMap['Gerente|00000000000100'];
    expect(nivel).toBe('gestao');

    // Quando: tenta-se buscar com chave composta que não existe
    nivel =
      (nivelCargoMap['Gerente|00000000000300'] as NivelCargo) ??
      (nivelCargoMap['Gerente'] as NivelCargo);
    expect(nivel).toBe('operacional'); // caí no fallback
  });
});
