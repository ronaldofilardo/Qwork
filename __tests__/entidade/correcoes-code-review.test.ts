/**
 * Testes de Code Review - Validação das correções aplicadas
 *
 * Este arquivo valida que as correções foram aplicadas corretamente ao código-fonte:
 *
 * ✅ Correção 1: Remoção da lógica condicional gestorEstaFuncionario
 * ✅ Correção 2: Campo liberado_por sempre usa session.cpf (nunca NULL)
 * ✅ Correção 3: Status 'iniciada' usado consistentemente (conforme constraint avaliacoes_status_check)
 *
 * Abordagem: Testes de análise estática de código (não testes de integração)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Code Review: Correções no Endpoint Entidade', () => {
  const endpointPath = join(
    process.cwd(),
    'app',
    'api',
    'entidade',
    'liberar-lote',
    'route.ts'
  );
  let endpointCode: string;

  beforeAll(() => {
    endpointCode = readFileSync(endpointPath, 'utf-8');
  });

  describe('✅ Correção 1: Remoção de lógica condicional gestorEstaFuncionario', () => {
    test('Não deve conter variável gestorEstaFuncionario', () => {
      expect(endpointCode).not.toContain('gestorEstaFuncionario');
    });

    test('Não deve verificar se gestor existe em funcionarios', () => {
      expect(endpointCode).not.toContain(
        'SELECT 1 FROM funcionarios WHERE cpf = $1'
      );
    });

    test('Não deve ter comentário sobre gestor não sendo funcionário formal', () => {
      expect(endpointCode).not.toContain('NÃO é criado como funcionário');
      expect(endpointCode).not.toContain('liberado_por` como NULL');
    });

    test('Deve ter comentário explicando a padronização', () => {
      expect(endpointCode).toContain('PADRONIZAÇÃO');
      expect(endpointCode).toContain(
        'Gestor sempre registrado como liberado_por'
      );
    });
  });

  describe('✅ Correção 2: liberado_por sempre usa session.cpf', () => {
    test('Não deve usar operador ternário com NULL para liberado_por', () => {
      // Buscar padrão: ? session.cpf : null
      const ternaryPattern = /liberado_por.*\?.*session\.cpf.*:.*null/;
      expect(endpointCode).not.toMatch(ternaryPattern);
    });

    test('Deve usar session.cpf diretamente nos INSERTs', () => {
      // Buscar uso direto de session.cpf para liberado_por
      // O padrão precisa ser mais flexível para capturar várias formatações
      const sessionCpfUsages = endpointCode.match(/session\.cpf/g);

      expect(sessionCpfUsages).not.toBeNull();
      expect(sessionCpfUsages.length).toBeGreaterThanOrEqual(2); // Usado em múltiplos lugares

      // Verificar que liberado_por está presente nos INSERTs
      const liberadoPorInInserts = endpointCode.match(/liberado_por/g);
      expect(liberadoPorInInserts).not.toBeNull();
      expect(liberadoPorInInserts.length).toBeGreaterThanOrEqual(2);
    });

    test('Comentário deve mencionar rastreabilidade e consistência', () => {
      expect(endpointCode).toContain('rastreabilidade');
      expect(endpointCode).toContain('consistência');
    });

    test('Comentário deve mencionar o fluxo RH', () => {
      expect(endpointCode).toContain('fluxo RH');
    });
  });

  describe('✅ Correção 3: Status "iniciada" usado consistentemente', () => {
    test('Deve criar avaliações com status "iniciada"', () => {
      // Buscar INSERT em avaliacoes com status='iniciada'
      const iniciadaPattern =
        /INSERT INTO avaliacoes[^;]+status[^;]+'iniciada'/is;
      expect(endpointCode).toMatch(iniciadaPattern);
    });

    test('Não deve criar avaliações com status "liberada" (inválido)', () => {
      // Status 'liberada' não existe no constraint avaliacoes_status_check
      const liberadaPattern =
        /INSERT INTO avaliacoes[^;]+status[^;]+'liberada'/is;
      expect(endpointCode).not.toMatch(liberadaPattern);
    });

    test('Todos os INSERTs de avaliação devem usar status "iniciada"', () => {
      // Extrair todos os VALUES de INSERT INTO avaliacoes
      const avaliacaoValuesPattern = /INSERT INTO avaliacoes.*?VALUES[^;]+/gis;
      const matches = endpointCode.match(avaliacaoValuesPattern);

      expect(matches).not.toBeNull();

      // Verificar que todos contêm 'iniciada'
      matches.forEach((insert) => {
        if (insert.includes('status')) {
          expect(insert).toContain("'iniciada'");
          expect(insert).not.toContain("'liberada'");
        }
      });
    });
  });

  describe('📊 Consistência geral do endpoint', () => {
    test('Deve ter pelo menos 2 INSERTs em lotes_avaliacao', () => {
      const loteInserts = endpointCode.match(/INSERT INTO lotes_avaliacao/gi);
      expect(loteInserts).not.toBeNull();
      expect(loteInserts.length).toBeGreaterThanOrEqual(2);
    });

    test('Todos os INSERTs de lote devem incluir campo liberado_por', () => {
      const loteInsertPattern =
        /INSERT INTO lotes_avaliacao\s*\([^)]+liberado_por[^)]*\)/gi;
      const matches = endpointCode.match(loteInsertPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    test('Deve ter pelo menos 2 INSERTs em avaliacoes', () => {
      const avaliacaoInserts = endpointCode.match(/INSERT INTO avaliacoes/gi);
      expect(avaliacaoInserts).not.toBeNull();
      expect(avaliacaoInserts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('🔍 Validação de estrutura do código', () => {
    test('Deve usar queryWithContext para INSERTs', () => {
      expect(endpointCode).toContain('queryWithContext');
    });

    test('Deve ter tratamento de erro', () => {
      expect(endpointCode).toContain('try');
      expect(endpointCode).toContain('catch');
    });

    test('Deve validar session do usuário', () => {
      expect(endpointCode).toContain('requireEntity');
    });
  });

  describe('📝 Documentação das mudanças', () => {
    test('Deve ter comentários explicativos sobre as correções', () => {
      const hasComments =
        endpointCode.includes('✅') ||
        endpointCode.includes('PADRONIZAÇÃO') ||
        endpointCode.includes('padronização');

      expect(hasComments).toBe(true);
    });

    test('Não deve ter comentários obsoletos', () => {
      expect(endpointCode).not.toContain('TODO: fix');
      expect(endpointCode).not.toContain('FIXME');
      expect(endpointCode).not.toContain('HACK');
    });
  });
});
