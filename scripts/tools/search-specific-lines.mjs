import fs from 'fs';
import path from 'path';

const targetLines = [
  259, 260, 286, 323, 340, 355, 371, 373, 375, 379, 380, 381, 392, 395,
];

function searchSpecificLines() {
  const files = getAllFiles('.');

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        const hasTargetLines = targetLines.some(
          (lineNum) => lines.length >= lineNum
        );

        if (hasTargetLines) {
          const fileWarnings = [];

          for (const lineNum of targetLines) {
            if (lines.length >= lineNum) {
              const line = lines[lineNum - 1]; // 0-indexed

              if (
                line.includes('any') ||
                line.includes('await') ||
                line.includes('score') ||
                line.includes('nivel_risco') ||
                line.includes('code') ||
                line.includes('message') ||
                line.includes('hint')
              ) {
                fileWarnings.push(lineNum);
              }
            }
          }

          if (fileWarnings.length > 0) {
            console.log(`File: ${file}`);
            console.log(`Lines with warnings: ${fileWarnings.join(', ')}`);
            console.log('---');
            fileWarnings.forEach((lineNum) => {
              const start = Math.max(lineNum - 3, 1);
              const end = Math.min(lineNum + 3, lines.length);
              console.log(`Line ${lineNum}:`);
              for (let i = start; i <= end; i++) {
                console.log(`  ${i}: ${lines[i - 1].trim()}`);
              }
              console.log('');
            });
          }
        }
      } catch (error) {
        // Skip unreadable files
      }
    }
  }
}

function getAllFiles(dirPath) {
  const files = [];
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

  return files;
}

console.log(
  'Searching for files with specific line numbers containing warnings...'
);
console.log('='.repeat(80));
searchSpecificLines();
