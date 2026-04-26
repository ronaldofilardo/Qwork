import { query } from '@/lib/db';

describe('Login Helpers - Representante Query Fix', () => {
  it('should not reference codigo column in representantes table', async () => {
    const fs = require('fs');
    const path = require('path');

    // Read the helpers file
    const helpersPath = path.join(
      process.cwd(),
      'app/api/auth/login/helpers.ts'
    );
    const content = fs.readFileSync(helpersPath, 'utf-8');

    // Verify codigo is not in the SELECT
    expect(content).not.toMatch(/SELECT.*codigo.*FROM representantes/i);
    expect(content).not.toMatch(/rep\.codigo/);
  });

  it('should not reference codigo column in representante trocar-senha route', async () => {
    const fs = require('fs');
    const path = require('path');

    const trocarSenhaPath = path.join(
      process.cwd(),
      'app/api/representante/trocar-senha/route.ts'
    );
    const content = fs.readFileSync(trocarSenhaPath, 'utf-8');

    // Verify codigo is not queried
    expect(content).not.toMatch(/SELECT.*codigo.*FROM representantes/i);
    expect(content).not.toMatch(/\.codigo/);
  });

  it('should not reference codigo in admin representantes busca endpoint', async () => {
    const fs = require('fs');
    const path = require('path');

    const buscaPath = path.join(
      process.cwd(),
      'app/api/admin/representantes/busca/route.ts'
    );
    const content = fs.readFileSync(buscaPath, 'utf-8');

    // Verify interface doesn't include codigo
    expect(content).not.toMatch(/interface RepBusca[\s\S]*?codigo:/);
    // Verify SELECT doesn't include codigo
    expect(content).not.toMatch(
      /SELECT[\s\S]*?codigo[\s\S]*?FROM.*representantes/i
    );
  });

  it('should have removed codigo references from UI components', async () => {
    const fs = require('fs');
    const path = require('path');

    const filesToCheck = [
      'components/admin/TomadoresContent.tsx',
      'components/suporte/RepresentantesLista.tsx',
      'components/suporte/representantes/DrawerDadosTab.tsx',
      'app/comercial/representantes/[id]/page.tsx',
      'app/admin/representantes/[id]/components/RepHeader.tsx',
    ];

    for (const file of filesToCheck) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Should not have rep.codigo or v.codigo being displayed
        expect(content).not.toMatch(/rep\.codigo|v\.codigo/);
      }
    }
  });

  it('should have cleaned up TomadoresContent RepAutoFill interface', async () => {
    const fs = require('fs');
    const path = require('path');

    const tomadoresPath = path.join(
      process.cwd(),
      'components/admin/TomadoresContent.tsx'
    );
    const content = fs.readFileSync(tomadoresPath, 'utf-8');

    // RepAutoFill should not have codigo field
    expect(content).not.toMatch(/interface RepAutoFill[\s\S]*?codigo:/);
    // But should have id field
    expect(content).toMatch(/interface RepAutoFill[\s\S]*?id:/);
  });
});
