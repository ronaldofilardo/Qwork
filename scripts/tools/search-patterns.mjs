import fs from 'fs';
import path from 'path';

function searchPatterns(directory, patterns) {
  const results = [];

  function search(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        if (file === 'node_modules' || file === '.next' || file === '.git') {
          continue;
        }
        search(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          for (const pattern of patterns) {
            if (content.includes(pattern)) {
              results.push({
                file: filePath,
                pattern,
              });
            }
          }
        } catch (error) {
          console.error(`Error reading file: ${filePath}`, error);
        }
      }
    }
  }

  search(directory);
  return results;
}

const patterns = ['score', 'nivel_risco', 'code', 'message', 'hint'];
const results = searchPatterns(process.cwd(), patterns);

console.log('Files containing warning patterns:');
console.log('================================');
const uniqueFiles = [...new Set(results.map((r) => r.file))];
uniqueFiles.forEach((file) => {
  const filePatterns = results
    .filter((r) => r.file === file)
    .map((r) => r.pattern)
    .join(', ');
  console.log(`${file} (patterns: ${filePatterns})`);
});
