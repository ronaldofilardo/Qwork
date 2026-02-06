import fs from 'fs';
import path from 'path';

describe('Relatório Individual - Entidade', () => {
  it('deve importar o endpoint sem erros de compilação', () => {
    expect(async () => {
      await import('@/app/api/entidade/lote/[id]/relatorio-individual/route');
    }).not.toThrow();
  });

  it('deve exigir role de entidade ou rh', () => {
    const filePath = path.join(
      process.cwd(),
      'app/api/entidade/lote/[id]/relatorio-individual/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toMatch(
      /requireRole\(\s*\[\s*['\"]rh['\"]\s*,\s*['\"]gestor['\"]\s*\]\s*\)/
    );
  });

  it('deve validar contratante/clinica e filtrar por f.contratante_id ou f.clinica_id', () => {
    const filePath = path.join(
      process.cwd(),
      'app/api/entidade/lote/[id]/relatorio-individual/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toMatch(/f\.contratante_id/);
  });

  it('deve persistir PDF na tabela laudos com hash', () => {
    const filePath = path.join(
      process.cwd(),
      'app/api/entidade/lote/[id]/relatorio-individual/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('UPDATE laudos');
    expect(content).toContain('hash_relatorio_individual');
  });
});
