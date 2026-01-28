import fs from 'fs';
import path from 'path';

function findFileByLineNumbers() {
  const targetDirectories = ['app', 'components', 'lib', 'hooks', 'scripts'];

  for (const dir of targetDirectories) {
    const fullDirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDirPath)) continue;

    const files = getAllFiles(fullDirPath);

    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');

          // Check if file has at least 395 lines
          if (lines.length >= 395) {
            // Check if lines around 259-395 contain the warning patterns
            const relevantLines = lines.slice(258, 395);
            const hasFunctionType = relevantLines.some(
              (line) => line.includes('function') && line.includes('any')
            );
            const hasAwaitThenable = relevantLines.some(
              (line) =>
                line.includes('await') &&
                !line.includes('Promise') &&
                !line.includes('then(')
            );
            const hasScoreNivelRisco = relevantLines.some(
              (line) => line.includes('score') && line.includes('nivel_risco')
            );
            const hasCodeMessage = relevantLines.some(
              (line) => line.includes('code') && line.includes('message')
            );

            if (
              hasFunctionType ||
              hasAwaitThenable ||
              hasScoreNivelRisco ||
              hasCodeMessage
            ) {
              console.log(`\nFound candidate file: ${file}`);
              console.log(`Lines count: ${lines.length}`);

              // Show some context around line 259
              const start = Math.max(255, 0);
              const end = Math.min(265, lines.length - 1);
              console.log('\nLines 256-265:');
              for (let i = start; i <= end; i++) {
                console.log(`${i + 1}: ${lines[i]}`);
              }

              // Show some context around line 286
              const start286 = Math.max(280, 0);
              const end286 = Math.min(290, lines.length - 1);
              console.log('\nLines 281-290:');
              for (let i = start286; i <= end286; i++) {
                console.log(`${i + 1}: ${lines[i]}`);
              }

              // Show some context around line 355
              const start355 = Math.max(350, 0);
              const end355 = Math.min(360, lines.length - 1);
              console.log('\nLines 351-360:');
              for (let i = start355; i <= end355; i++) {
                console.log(`${i + 1}: ${lines[i]}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error reading file: ${file}`, error);
        }
      }
    }
  }
}

function getAllFiles(dirPath) {
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next' ||
          entry.name === '.git'
        ) {
          continue;
        }
        files.push(...getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${dirPath}`, error);
  }

  return files;
}

findFileByLineNumbers();
