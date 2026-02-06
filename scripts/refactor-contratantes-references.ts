import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RefactoringRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Regras de refatoração
const REFACTORING_RULES: RefactoringRule[] = [
  // 1. Importações
  {
    pattern: /from ['"]@\/types\/contratantes['"]/g,
    replacement: 'from "@/types/entidades"',
    description: 'Importação de tipos contratantes → entidades',
  },
  {
    pattern: /from ['"]@\/app\/api\/contratantes\//g,
    replacement: 'from "@/app/api/entidades/',
    description: 'Importação de API contratantes → entidades',
  },

  // 2. Tipos
  {
    pattern: /Contratante(?!s)/g,
    replacement: 'Entidade',
    description: 'Tipo Contratante → Entidade',
  },
  {
    pattern: /: ?Contratante\[\]/g,
    replacement: ': Entidade[]',
    description: 'Array de Contratante → Entidade',
  },

  // 3. Variáveis e propriedades
  {
    pattern: /contratante_id/g,
    replacement: 'entidade_id',
    description: 'Campo contratante_id → entidade_id',
  },
  {
    pattern: /contratanteId/g,
    replacement: 'entidadeId',
    description: 'Campo contratanteId → entidadeId',
  },

  // 4. Tabelas SQL
  {
    pattern: /FROM\s+contratantes(?!\w)/gi,
    replacement: 'FROM entidades',
    description: 'FROM contratantes → entidades',
  },
  {
    pattern: /JOIN\s+contratantes(?!\w)/gi,
    replacement: 'JOIN entidades',
    description: 'JOIN contratantes → entidades',
  },
  {
    pattern: /INTO\s+contratantes(?!\w)/gi,
    replacement: 'INTO entidades',
    description: 'INTO contratantes → entidades',
  },
  {
    pattern: /UPDATE\s+contratantes(?!\w)/gi,
    replacement: 'UPDATE entidades',
    description: 'UPDATE contratantes → entidades',
  },
  {
    pattern: /DELETE\s+FROM\s+contratantes(?!\w)/gi,
    replacement: 'DELETE FROM entidades',
    description: 'DELETE FROM contratantes → entidades',
  },

  // 5. Select específico
  {
    pattern: /SELECT\s+\*\s+FROM\s+contratantes(?!\w)/gi,
    replacement: 'SELECT * FROM entidades',
    description: 'SELECT * FROM contratantes → entidades',
  },

  // 6. Comentários e strings
  {
    pattern: /['"]contratantes['"]/g,
    replacement: '"entidades"',
    description: 'String literal contratantes → entidades',
  },
];

async function findContratantesReferences(): Promise<Map<string, string[]>> {
  console.log('🔍 Buscando referências a "contratantes" no código...\n');

  try {
    // Usar grep para encontrar todas as referências
    const { stdout } = await execAsync(
      'git grep -n "contratantes" -- "*.ts" "*.tsx" "*.sql" ":!node_modules" ":!*.lock" ":!pnpm-lock.yaml"',
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = stdout.trim().split('\n');
    const referencesByFile = new Map<string, string[]>();

    for (const line of lines) {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (match) {
        const [, filePath, lineNum, content] = match;

        if (!referencesByFile.has(filePath)) {
          referencesByFile.set(filePath, []);
        }

        referencesByFile.get(filePath).push(`L${lineNum}: ${content.trim()}`);
      }
    }

    console.log(
      `   ✅ Encontradas referências em ${referencesByFile.size} arquivos\n`
    );
    return referencesByFile;
  } catch (error: any) {
    if (error.code === 1) {
      // Nenhuma correspondência encontrada
      console.log('   ✅ Nenhuma referência encontrada!\n');
      return new Map();
    }
    throw error;
  }
}

async function analyzeFile(filePath: string): Promise<{
  needsRefactoring: boolean;
  matches: string[];
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const matches: string[] = [];

    for (const rule of REFACTORING_RULES) {
      const ruleMatches = content.match(rule.pattern);
      if (ruleMatches) {
        matches.push(`${rule.description} (${ruleMatches.length} ocorrências)`);
      }
    }

    return {
      needsRefactoring: matches.length > 0,
      matches,
    };
  } catch (error) {
    return {
      needsRefactoring: false,
      matches: [],
    };
  }
}

async function refactorFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    let changeCount = 0;

    for (const rule of REFACTORING_RULES) {
      const matches = content.match(rule.pattern);
      if (matches) {
        content = content.replace(rule.pattern, rule.replacement);
        changeCount += matches.length;
      }
    }

    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');
      return changeCount;
    }

    return 0;
  } catch (error) {
    console.error(`   ❌ Erro ao refatorar ${filePath}:`, error);
    return 0;
  }
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log(
      'ETAPA 1.2: REFATORAÇÃO DE REFERÊNCIAS contratantes → entidades'
    );
    console.log('='.repeat(70) + '\n');

    // 1. Encontrar todas as referências
    const referencesByFile = await findContratantesReferences();

    if (referencesByFile.size === 0) {
      console.log(
        '✅ Nenhuma referência a contratantes encontrada - refatoração completa!\n'
      );
      return;
    }

    // 2. Analisar cada arquivo
    console.log('📊 Analisando arquivos...\n');

    const filesToRefactor: string[] = [];
    const filesToIgnore: string[] = [];

    for (const [filePath] of referencesByFile) {
      const analysis = await analyzeFile(filePath);

      if (analysis.needsRefactoring) {
        filesToRefactor.push(filePath);
      } else {
        // Arquivo tem "contratantes" mas não match com nossas regras
        // Pode ser comentário, nome de pasta, etc
        filesToIgnore.push(filePath);
      }
    }

    console.log(`   📝 Arquivos para refatorar: ${filesToRefactor.length}`);
    console.log(`   ⏭️  Arquivos a ignorar: ${filesToIgnore.length}\n`);

    // 3. Refatorar arquivos
    console.log('🔧 Refatorando arquivos...\n');

    let totalChanges = 0;
    let refactoredFiles = 0;

    for (const filePath of filesToRefactor) {
      const changes = await refactorFile(filePath);
      if (changes > 0) {
        console.log(`   ✅ ${filePath} (${changes} mudanças)`);
        totalChanges += changes;
        refactoredFiles++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Arquivos refatorados: ${refactoredFiles}`);
    console.log(`   Total de mudanças: ${totalChanges}\n`);

    // 4. Verificar se ainda restam referências
    console.log('🔍 Verificando referências restantes...\n');
    const remainingRefs = await findContratantesReferences();

    if (remainingRefs.size === 0) {
      console.log('   ✅ Nenhuma referência a contratantes restante!\n');
    } else {
      console.log(
        `   ⚠️  ${remainingRefs.size} arquivos ainda têm referências:\n`
      );

      for (const [filePath, refs] of remainingRefs) {
        console.log(`      ${filePath}:`);
        refs.slice(0, 3).forEach((ref) => console.log(`         ${ref}`));
        if (refs.length > 3) {
          console.log(`         ... e mais ${refs.length - 3} referências`);
        }
      }

      console.log('\n   ℹ️  Estas referências podem ser:');
      console.log('      - Comentários ou documentação');
      console.log('      - Nomes de pastas ou arquivos');
      console.log('      - Strings hardcoded que precisam revisão manual\n');
    }

    console.log('='.repeat(70));
    console.log('✅ ETAPA 1.2 CONCLUÍDA - Refatoração Automática Completa');
    console.log('='.repeat(70));
    console.log(
      '\n💡 Próximo passo: Revisar referências restantes manualmente\n'
    );
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
