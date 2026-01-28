import fs from 'fs';
import path from 'path';

describe('Print Styles', () => {
  it('deve ter estilos de impressão definidos no CSS global', () => {
    const cssPath = path.join(process.cwd(), 'app', 'globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Verifica se as classes print customizadas estão presentes
    expect(cssContent).toContain('.print\\:static { position: static !important; }');
    expect(cssContent).toContain('.print\\:transform-none { transform: none !important; }');
    expect(cssContent).toContain('.print\\:w-full { width: 100% !important; }');
  });

  it('deve ter estilos de canvas para impressão', () => {
    const cssPath = path.join(process.cwd(), 'app', 'globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    expect(cssContent).toContain('canvas {');
    expect(cssContent).toContain('max-width: 100% !important;');
    expect(cssContent).toContain('position: static !important;');
  });

  it('deve ter media query para impressão definida', () => {
    const cssPath = path.join(process.cwd(), 'app', 'globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    expect(cssContent).toContain('@media print');
  });
});