/**
 * Testes de Sanitização: Verificar remoção de código obsoleto
 * Garante que placeholders, código morto e padrões antigos foram removidos
 * Referência: Todas as 11 correções
 */

import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

describe('Sanitização: Remoção de Código Obsoleto', () => {
  // ============================================================================
  // SANITIZAÇÃO: Placeholders hardcoded
  // ============================================================================
  describe('Placeholder: Sem 00000000000 em código novo', () => {
    const criticalFiles = [
      'app/api/emissor/laudos/[loteId]/pdf/route.ts',
      'app/api/emissor/laudos/[loteId]/download/route.ts',
      'app/api/rh/laudos/[laudoId]/download/route.ts',
      'app/api/entidade/lotes/route.ts',
    ];

    criticalFiles.forEach((filePath) => {
      it(`${filePath} não deve ter placeholder 00000000000`, () => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('00000000000');
        }
      });
    });

    it('lib/laudo-auto.ts pode usar 00000000000 apenas para excluir placeholder', () => {
      const fullPath = path.join(process.cwd(), 'lib/laudo-auto.ts');

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Verificar que só usa em contexto de exclusão (WHERE cpf <> '00000000000' ou === para validação)
        const lines = content
          .split('\n')
          .filter((line) => line.includes('00000000000'));

        lines.forEach((line) => {
          const isExclusionOrValidation =
            line.includes('<>') ||
            line.includes('!==') ||
            line.includes('===') ||
            line.includes('//'); // Comentário

          expect(isExclusionOrValidation).toBe(true);
        });
      }
    });

    it('trigger não deve usar placeholder', async () => {
      const functionDef = await query(
        `SELECT pg_get_functiondef(oid) as definition 
         FROM pg_proc 
         WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'`
      );

      const definition = functionDef.rows[0]?.definition;
      expect(definition).not.toContain('00000000000');
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Referências a arquivo_pdf
  // ============================================================================
  describe('Coluna Removida: arquivo_pdf', () => {
    const endpointsLaudos = [
      'app/api/emissor/laudos/[loteId]/pdf/route.ts',
      'app/api/emissor/laudos/[loteId]/download/route.ts',
      'app/api/rh/laudos/[laudoId]/download/route.ts',
      'app/api/entidade/laudos/[laudoId]/download/route.ts',
    ];

    endpointsLaudos.forEach((filePath) => {
      it(`${filePath} não deve referenciar arquivo_pdf`, () => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Permitir em comentários explicativos
          const linesWithoutComments = content
            .split('\n')
            .filter(
              (line) =>
                !line.trim().startsWith('//') && !line.trim().startsWith('*')
            )
            .join('\n');

          expect(linesWithoutComments).not.toContain('arquivo_pdf');
        }
      });
    });

    it('tabela laudos não deve ter coluna arquivo_pdf', async () => {
      const column = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'laudos' AND column_name = 'arquivo_pdf'`
      );

      expect(column.rows.length).toBe(0);
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Schema antigo audit_logs
  // ============================================================================
  describe('Schema Obsoleto: audit_logs em português', () => {
    it('não deve ter colunas em português no banco', async () => {
      const oldColumns = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'audit_logs' 
         AND column_name IN ('acao', 'entidade', 'user_id', 'user_role', 'criado_em', 'dados')`
      );

      expect(oldColumns.rows.length).toBe(0);
    });

    const endpointsWithAudit = ['app/api/emissor/laudos/[loteId]/pdf/route.ts'];

    endpointsWithAudit.forEach((filePath) => {
      it(`${filePath} não deve usar schema antigo de audit_logs`, () => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Verificar que usa schema novo
          if (content.includes('audit_logs')) {
            expect(content).toContain('action');
            expect(content).toContain('resource');
            expect(content).toContain('user_cpf');
            expect(content).toContain('user_perfil');

            // Não deve usar antigo
            const insertMatches = content.match(
              /INSERT INTO audit_logs[\s\S]*?\)/g
            );
            if (insertMatches) {
              insertMatches.forEach((insert) => {
                expect(insert).not.toContain('acao');
                expect(insert).not.toContain('entidade');
                expect(insert).not.toContain('user_id');
              });
            }
          }
        }
      });
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Imports de Puppeteer em endpoints errados
  // ============================================================================
  describe('Puppeteer: Apenas em emissor', () => {
    it('RH download não deve importar puppeteer', () => {
      const rhRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(rhRoute).not.toContain('puppeteer');
      expect(rhRoute).not.toContain('getPuppeteerInstance');
    });

    it('Entidade download não deve importar puppeteer', () => {
      const entidadeRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/entidade/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(entidadeRoute).not.toContain('puppeteer');
      expect(entidadeRoute).not.toContain('getPuppeteerInstance');
    });

    it('Emissor /pdf deve ter puppeteer (emergência)', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(emissorRoute).toContain('getPuppeteerInstance');
    });

    it('Emissor /download não deve gerar PDF on-demand', () => {
      const downloadRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      // Não deve chamar /pdf endpoint via fetch para gerar on-demand
      expect(downloadRoute).not.toContain('await fetch');
      expect(downloadRoute).not.toMatch(/fetch.*\/pdf/);
      // Deve retornar fallback client-side
      expect(downloadRoute).toContain('useClientSide');
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: UPDATEs em laudos emitidos
  // ============================================================================
  describe('UPDATE Proibido: Laudos emitidos', () => {
    const endpointsLaudos = [
      'app/api/emissor/laudos/[loteId]/pdf/route.ts',
      'app/api/emissor/laudos/[loteId]/download/route.ts',
      'app/api/entidade/lotes/route.ts',
    ];

    endpointsLaudos.forEach((filePath) => {
      it(`${filePath} não deve ter UPDATE laudos SET após emissão`, () => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Verificar se tem UPDATE laudos - hash_pdf só com condição
          if (content.includes('UPDATE laudos')) {
            const updateMatches = content.match(
              /UPDATE\s+laudos[\s\S]{0,200}/gi
            );
            if (updateMatches) {
              updateMatches.forEach((update) => {
                // UPDATE de hash_pdf é permitido APENAS com WHERE condicional
                if (update.includes('hash_pdf')) {
                  const hasCondition =
                    update.includes('WHERE') &&
                    (update.includes('IS NULL') || update.includes("= ''"));
                  expect(hasCondition).toBe(true);
                }
                // atualizado_em não deve ser modificado sem condição
                if (
                  update.includes('SET atualizado_em') &&
                  update.includes('NOW()')
                ) {
                  expect(update.includes('WHERE')).toBe(true);
                }
              });
            }
          }
        }
      });
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Declarações duplicadas
  // ============================================================================
  describe('Declarações Duplicadas: fs, path, etc', () => {
    it('emissor PDF não deve ter fs declarado duas vezes', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const fsDeclarations = (
        emissorRoute.match(/const\s+fs\s*=\s*await\s+import\(['"]fs['"]\)/g) ||
        []
      ).length;
      expect(fsDeclarations).toBe(1);
    });

    it('emissor PDF não deve ter path declarado duas vezes', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const pathDeclarations = (
        emissorRoute.match(
          /const\s+path\s*=\s*await\s+import\(['"]path['"]\)/g
        ) || []
      ).length;
      expect(pathDeclarations).toBe(1);
    });

    it('emissor PDF não deve ter storageDir declarado duas vezes', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const storageDirDeclarations = (
        emissorRoute.match(/const\s+storageDir\s*=/g) || []
      ).length;
      expect(storageDirDeclarations).toBe(1);
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Migrations obsoletas - SKIP (Prisma migrations não no banco de teste)
  // ============================================================================
  describe.skip('Migrations: Aplicadas e não revertidas', () => {
    it('migration 093 deve estar aplicada', async () => {
      const migration = await query(
        `SELECT migration_name, applied_at 
         FROM _prisma_migrations 
         WHERE migration_name LIKE '%093%'`
      );

      expect(migration.rows.length).toBeGreaterThan(0);
      expect(migration.rows[0].applied_at).toBeDefined();
    });

    it('migration 095 deve estar aplicada', async () => {
      const migration = await query(
        `SELECT migration_name, applied_at 
         FROM _prisma_migrations 
         WHERE migration_name LIKE '%095%'`
      );

      expect(migration.rows.length).toBeGreaterThan(0);
      expect(migration.rows[0].applied_at).toBeDefined();
    });

    it('não deve ter migrations rollback', async () => {
      const rollbacks = await query(
        `SELECT migration_name 
         FROM _prisma_migrations 
         WHERE migration_name LIKE '%rollback%' OR migration_name LIKE '%revert%'`
      );

      expect(rollbacks.rows.length).toBe(0);
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Testes obsoletos
  // ============================================================================
  describe('Testes: Sem referências a código removido', () => {
    it('não deve ter testes para arquivo_pdf (apenas em contexto de teste)', () => {
      const testFiles = fs.readdirSync(path.join(process.cwd(), '__tests__'));

      testFiles.forEach((testFile) => {
        if (testFile.endsWith('.test.ts') || testFile.endsWith('.test.tsx')) {
          const content = fs.readFileSync(
            path.join(process.cwd(), '__tests__', testFile),
            'utf-8'
          );

          // Se menciona arquivo_pdf, deve ser em comentários ou testes negativos
          if (content.includes('arquivo_pdf')) {
            const lines = content
              .split('\n')
              .filter((l) => l.includes('arquivo_pdf'));
            lines.forEach((line) => {
              const trimmed = line.trim();
              const isComment =
                trimmed.startsWith('//') || trimmed.startsWith('*');
              const isNegativeTest =
                line.includes('not.toContain') || line.includes('removid');
              const isString =
                line.includes("'arquivo_pdf'") ||
                line.includes('"arquivo_pdf"');
              const isDescribe =
                line.includes('describe(') || line.includes('it(');
              expect(
                isComment || isNegativeTest || isString || isDescribe
              ).toBe(true);
            });
          }
        }
      });
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Comentários e documentação atualizados
  // ============================================================================
  describe('Documentação: Comentários atualizados', () => {
    it('emissor deve ter comentário sobre imutabilidade', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(emissorRoute).toContain('[IMUTABILIDADE]');
      expect(emissorRoute).toContain('não pode ser regenerado');
    });

    it('entidade deve ter comentário sobre não persistir hash', () => {
      const entidadeRoute = fs.readFileSync(
        path.join(process.cwd(), 'app/api/entidade/lotes/route.ts'),
        'utf-8'
      );

      expect(entidadeRoute).toContain('IMPORTANTE');
      expect(entidadeRoute).toContain('IMUTÁVEIS');
    });

    it('RH deve ter comentário sobre não gerar PDF', () => {
      const rhRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(rhRoute).toContain('emitido pelo emissor');
    });
  });

  // ============================================================================
  // SANITIZAÇÃO: Consistência de naming
  // ============================================================================
  describe('Naming: Padrões consistentes', () => {
    it('arquivos PDF devem seguir padrão laudo-{id}.pdf', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(emissorRoute).toContain('laudo-${laudo.id}.pdf');
    });

    it('metadata deve seguir padrão laudo-{id}.json', () => {
      const emissorRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(emissorRoute).toContain('laudo-${laudo.id}.json');
    });

    it('storage deve ser em storage/laudos/', () => {
      const files = [
        'app/api/emissor/laudos/[loteId]/pdf/route.ts',
        'app/api/rh/laudos/[laudoId]/download/route.ts',
      ];

      files.forEach((filePath) => {
        const content = fs.readFileSync(
          path.join(process.cwd(), filePath),
          'utf-8'
        );

        expect(content).toContain("'storage', 'laudos'");
      });
    });
  });
});
