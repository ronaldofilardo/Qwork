#!/usr/bin/env node
/**
 * Script automatizado para remover todas as referências a 'codigo' e padronizar em 'id'
 *
 * Executa substituições em:
 * - Componentes React (.tsx)
 * - Páginas Next.js
 * - Bibliotecas (lib/)
 * - Testes
 *
 * USO: node scripts/remove-codigo-padronize-id.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const projectRoot = process.cwd();
let totalFiles = 0;
let totalReplacements = 0;

// Mapeamento de substituições
const replacements = [
  // Display de codigo para id
  {
    from: /\{lote\.codigo\}/g,
    to: '{lote.id}',
    desc: 'Display lote.codigo → lote.id',
  },
  {
    from: /\{laudo\.codigo\}/g,
    to: '{laudo.id}',
    desc: 'Display laudo.codigo → laudo.id',
  },
  {
    from: /loteCodigo="([^"]+)"/g,
    to: 'loteId="$1"',
    desc: 'Prop loteCodigo → loteId',
  },
  {
    from: /lote_codigo:\s*string/g,
    to: 'lote_id: number',
    desc: 'Type lote_codigo → lote_id',
  },
  {
    from: /ultimo_lote_codigo/g,
    to: 'ultimo_lote_id',
    desc: 'Campo ultimo_lote_codigo → ultimo_lote_id',
  },

  // Downloads
  {
    from: /laudo-\$\{lote\.codigo(\s*\|\|[^}]+)?\}/g,
    to: 'laudo-${lote.id}',
    desc: 'Download nome arquivo com codigo',
  },
  {
    from: /laudo-\$\{lote\?\.codigo(\s*\|\|[^}]+)?\}/g,
    to: 'laudo-${lote.id}',
    desc: 'Download nome arquivo com codigo (optional)',
  },
  {
    from: /Laudo_\$\{lote\.codigo\}/g,
    to: 'Laudo_${lote.id}',
    desc: 'Download Laudo_{codigo}',
  },

  // Mensagens e textos
  {
    from: /lote \$\{lote\.codigo\}/gi,
    to: 'lote #${lote.id}',
    desc: 'Texto "lote {codigo}" → "lote #{id}"',
  },
  {
    from: /lote \$\{loteCodigo\}/gi,
    to: 'lote #${loteId}',
    desc: 'Texto "lote {loteCodigo}" → "lote #{loteId}"',
  },
  {
    from: /Código:\s*\{lote\.codigo\}/g,
    to: 'Lote #{lote.id}',
    desc: 'Label "Código:" → "Lote #"',
  },

  // Propriedades de objetos
  {
    from: /,\s*codigo:\s*lote\.codigo/g,
    to: '',
    desc: 'Remover prop redundante codigo',
  },
  {
    from: /codigo:\s*'[^']+',/g,
    to: '',
    desc: 'Remover codigo literal em objetos',
  },

  // Comentários
  {
    from: /gerar.*codigo.*lote/gi,
    to: 'usar apenas ID do lote',
    desc: 'Atualizar comentários sobre geração de codigo',
  },
];

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    for (const rule of replacements) {
      const matches = content.match(rule.from);
      if (matches) {
        content = content.replace(rule.from, rule.to);
        modified = true;
        fileReplacements += matches.length;
        console.log(`  ✓ ${rule.desc}: ${matches.length} ocorrência(s)`);
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      totalFiles++;
      totalReplacements += fileReplacements;
      console.log(
        `✅ ${filePath.replace(projectRoot, '.')} (${fileReplacements} mudanças)\n`
      );
      return true;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
  return false;
}

function walkDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules, .next, etc
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        walkDirectory(filePath, extensions);
      }
    } else if (extensions.includes(extname(file))) {
      processFile(filePath);
    }
  }
}

console.log('========================================');
console.log('REMOÇÃO AUTOMÁTICA DE "CODIGO"');
console.log('Padronizando em "id" apenas');
console.log('========================================\n');

// Processar diretórios específicos
const directories = [
  join(projectRoot, 'components'),
  join(projectRoot, 'app'),
  join(projectRoot, 'lib'),
];

for (const dir of directories) {
  console.log(`\n📂 Processando: ${dir}\n`);
  walkDirectory(dir);
}

console.log('\n========================================');
console.log('RESUMO');
console.log('========================================');
console.log(`Total de arquivos modificados: ${totalFiles}`);
console.log(`Total de substituições: ${totalReplacements}`);
console.log('========================================\n');

if (totalFiles > 0) {
  console.log('✅ Concluído! Revise as mudanças com:');
  console.log('   git diff');
  console.log('\n⚠️  IMPORTANTE: Rodar testes antes de commit!');
} else {
  console.log('ℹ️  Nenhuma alteração necessária.');
}
