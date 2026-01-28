const fs = require('fs');
const path = require('path');

function searchFiles(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (file === 'node_modules' || file === '.next' || file === '.git') {
        continue;
      }
      searchFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        if (lines.length > 395) {
          // Check if contains patterns from warnings
          const relevantLines = lines.slice(258, 395);
          const hasRelevantContent = relevantLines.some(
            (line) =>
              line.includes('function') ||
              line.includes('await') ||
              line.includes('score') ||
              line.includes('nivel_risco') ||
              line.includes('code') ||
              line.includes('message') ||
              line.includes('hint')
          );

          if (hasRelevantContent) {
            console.log(`File: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
      }
    }
  }
}

searchFiles(process.cwd());
