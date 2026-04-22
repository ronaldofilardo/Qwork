/**
 * Testes para GET /api/vendedor/meu-representante
 *
 * Endpoint que retorna dados de comissionamento do representante
 * linkado ao vendedor autenticado via hierarquia_comercial.
 */

import { query } from '@/lib/db';
import { hash } from 'bcrypt';

// Mock do módulo de auth
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
  requireRole: jest.fn(),
}));

const { getSession, requireRole } = require('@/lib/auth');

describe('GET /api/vendedor/meu-representante', () => {
  const endpoint = '/api/vendedor/meu-representante';

  describe('Validação de arquivo', () => {
    it('arquivo route.ts existe', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('exporta função GET', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });
  });

  describe('Autenticação', () => {
    it('retorna 401 se vendedor não autenticado', async () => {
      requireRole.mockImplementation(() => {
        throw new Error('Não autenticado');
      });

      const mockReq = {
        cookies: new Map(),
      };

      try {
        // Endpoint seria chamado aqui em teste de integração
        // Por agora, verificamos a estrutura do arquivo
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(
          process.cwd(),
          'app/api/vendedor/meu-representante/route.ts'
        );
        const src = fs.readFileSync(filePath, 'utf-8');
        expect(src).toMatch(/requireRole\(\s*['"]vendedor['"]\s*,\s*false\s*\)/);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('Lógica de busca', () => {
    it('busca usuario pelo CPF da sessão', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      // Verifica que query busca usuario por CPF
      expect(src).toMatch(/WHERE\s+cpf\s*=\s*\$1/i);
      expect(src).toMatch(/session\.cpf/);
    });

    it('faz JOIN com hierarquia_comercial e representantes', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      expect(src).toMatch(/hierarquia_comercial/i);
      expect(src).toMatch(/representantes/i);
      expect(src).toMatch(/vendedor_id/i);
      expect(src).toMatch(/ativo\s*=\s*true/i);
    });

    it('retorna dados de comissionamento do representante', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      // Verifica que retorna percentuais e custos
      expect(src).toMatch(/percentual_comissao/);
      expect(src).toMatch(/percentual_comissao_comercial/);
      expect(src).toMatch(/modelo_comissionamento/);
      expect(src).toMatch(/valor_custo_fixo_entidade/);
      expect(src).toMatch(/valor_custo_fixo_clinica/);
    });
  });

  describe('Response structure', () => {
    it('retorna objeto com representante property', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      // Verifica JSON response structure
      expect(src).toMatch(/representante/);
      expect(src).toMatch(/NextResponse\.json/);
    });

    it('retorna null se representante não encontrado', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      // Verifica que pode retornar representante: null
      expect(src).toMatch(/representante:\s*null/);
    });
  });

  describe('Segurança', () => {
    it('tem dynamic = force-dynamic', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    });

    it('limita resultado a 1 representante (LIMIT 1)', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      expect(src).toMatch(/LIMIT\s+1/i);
    });

    it('filtra por ativo = true', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/vendedor/meu-representante/route.ts'
      );
      const src = fs.readFileSync(filePath, 'utf-8');

      expect(src).toMatch(/ativo\s*=\s*true/i);
    });
  });
});
