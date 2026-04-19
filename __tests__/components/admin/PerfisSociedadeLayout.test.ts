import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

describe('Layout entre Perfis e Sociedade', () => {
  const perfisPath = path.join(ROOT, 'components', 'admin', 'EmissoresContent.tsx');
  const sociedadePath = path.join(ROOT, 'components', 'admin', 'SociedadeContent.tsx');

  it('deve manter o cadastro institucional do QWork em Perfis', () => {
    const perfisSrc = fs.readFileSync(perfisPath, 'utf-8');

    expect(perfisSrc).toMatch(/QWork · recolhimento institucional/);
    expect(perfisSrc).toMatch(/Salvar QWork/);
  });

  it('não deve duplicar cadastros dentro da aba Sociedade', () => {
    const sociedadeSrc = fs.readFileSync(sociedadePath, 'utf-8');

    expect(sociedadeSrc).not.toMatch(/QWork · recolhimento institucional/);
    expect(sociedadeSrc).not.toMatch(/Beneficiários societários/);
  });
});
