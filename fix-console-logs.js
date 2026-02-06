const fs = require('fs');
const path = require('path');

function fixConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let fixed = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for lines that start with spaces and a single quote
        const match = line.match(/^(\s*)'([^']*)'\s*$/);
        if (match && !line.includes('console.log')) {
          // Check if previous line has console.log(
          if (
            i > 0 &&
            lines[i - 1].includes('console.log(') &&
            !lines[i - 1].includes(')')
          ) {
            // This is a continuation, add closing )
            lines[i - 1] = lines[i - 1] + ');';
            lines[i] = '';
            fixed = true;
          } else {
            // Standalone string, wrap with console.log
            lines[i] = match[1] + "console.log('" + match[2] + "');";
            fixed = true;
          }
        }
      }

      if (fixed) {
        content = lines.join('\n');
        fs.writeFileSync(filePath, content);
        console.log('Fixed:', filePath);
      }
    }
  }
}

fixConsoleLogs('__tests__');
