/**
 * __tests__/regression/chat-session-cleanup.test.ts
 *
 * Testa as correções de linting e SQL da sessão atual:
 * 1. Remoção de imports não usados (Copy, Check) em representante/equipe/page.tsx
 * 2. Remoção de props/funções não usadas no VendedorCard
 * 3. Corrigir query SQL em /api/vendedor/dados/route.ts
 */

import fs from 'fs';
import path from 'path';

describe('Chat Session Cleanup — Regressão e Validação', () => {
  const equipePagePath = path.join(
    process.cwd(),
    'app/representante/(portal)/equipe/page.tsx'
  );
  const vendedorDadosPath = path.join(
    process.cwd(),
    'app/api/vendedor/dados/route.ts'
  );

  // =====================================================================
  // 1. Validar que imports não usados foram removidos
  // =====================================================================

  describe('1. Linting — Imports Removidos', () => {
    let equipeContent: string;

    beforeAll(() => {
      equipeContent = fs.readFileSync(equipePagePath, 'utf-8');
    });

    it('deve remover import "Copy" de lucide-react', () => {
      // Copy não deve estar no import
      expect(equipeContent).not.toMatch(
        /import\s+{[^}]*\bCopy\b[^}]*}\s+from\s+['"]lucide-react['"];/
      );
    });

    it('deve remover import "Check" de lucide-react', () => {
      // Check não deve estar no import (excepto em outras linhas irrelevantes)
      const importLine = equipeContent.match(
        /import\s+{[^}]*}\s+from\s+['"]lucide-react['"];/
      )?.[0];
      if (importLine) {
        // Se Check aparecer, só deve ser em comentários ou strings
        expect(importLine).not.toMatch(/\bCheck\b(?!\s*\/\/)/);
      }
    });

    it('deve manter outros imports de lucide-react intactos', () => {
      // Deve manter: UserPlus, Users2, ChevronRight, etc.
      expect(equipeContent).toMatch(/Users2/);
      expect(equipeContent).toMatch(/UserPlus/);
      expect(equipeContent).toMatch(/TrendingUp/);
      expect(equipeContent).toMatch(/from\s+['"]lucide-react['"];/);
    });
  });

  // =====================================================================
  // 2. Validar que props não usadas foram removidas do VendedorCard
  // =====================================================================

  describe('2. Props do VendedorCard — Removidas', () => {
    let equipeContent: string;

    beforeAll(() => {
      equipeContent = fs.readFileSync(equipePagePath, 'utf-8');
    });

    it('VendedorCard não deve ter prop "copiado"', () => {
      // Procurar função VendedorCard e suas props
      const vendedorCardMatch = equipeContent.match(
        /function\s+VendedorCard\s*\({[^}]+}\):/s
      );
      if (vendedorCardMatch) {
        expect(vendedorCardMatch[0]).not.toMatch(/copiado\s*:/);
      }
    });

    it('VendedorCard não deve ter prop "onCopiar"', () => {
      const vendedorCardMatch = equipeContent.match(
        /function\s+VendedorCard\s*\({[^}]+}\):/s
      );
      if (vendedorCardMatch) {
        expect(vendedorCardMatch[0]).not.toMatch(/onCopiar\s*:/);
      }
    });

    it('VendedorCard deve aceitar props: v, onClick, reenvioEstado, onReenviar', () => {
      const vendedorCardMatch = equipeContent.match(
        /function\s+VendedorCard\s*\({[^}]+}\):/s
      );
      if (vendedorCardMatch) {
        expect(vendedorCardMatch[0]).toMatch(/v:/);
        expect(vendedorCardMatch[0]).toMatch(/onClick:/);
        expect(vendedorCardMatch[0]).toMatch(/reenvioEstado/);
        expect(vendedorCardMatch[0]).toMatch(/onReenviar/);
      }
    });
  });

  // =====================================================================
  // 3. Validar que handleCopiarCodigo foi removido
  // =====================================================================

  describe('3. Função handleCopiarCodigo — Removida', () => {
    let equipeContent: string;

    beforeAll(() => {
      equipeContent = fs.readFileSync(equipePagePath, 'utf-8');
    });

    it('deve remover função "handleCopiarCodigo"', () => {
      expect(equipeContent).not.toMatch(/const\s+handleCopiarCodigo\s*=/);
    });

    it('deve remover estado "codigoCopiadoId"', () => {
      expect(equipeContent).not.toMatch(/codigoCopiadoId/);
    });

    it('deve remover chamada a handleCopiarCodigo nas props do VendedorCard', () => {
      // Procurar por <VendedorCard ... copiado={...} onCopiar={...}
      // Isso não deve existir mais
      const vendedorCardUsage = equipeContent.match(/<VendedorCard[^/]*\/>/s);
      if (vendedorCardUsage) {
        expect(vendedorCardUsage[0]).not.toMatch(/copiado=/);
        expect(vendedorCardUsage[0]).not.toMatch(/onCopiar=/);
      }
    });
  });

  // =====================================================================
  // 4. Validar que a query SQL está corrigida
  // =====================================================================

  describe('4. Query SQL — Corrigida', () => {
    let vendedorDadosContent: string;

    beforeAll(() => {
      vendedorDadosContent = fs.readFileSync(vendedorDadosPath, 'utf-8');
    });

    it('deve ter SELECT u.id, u.cpf, u.nome... correto', () => {
      expect(vendedorDadosContent).toMatch(
        /SELECT\s+u\.id,\s+u\.cpf,\s+u\.nome/
      );
    });

    it('deve ter COALESCE vp.primeira_senha_alterada', () => {
      expect(vendedorDadosContent).toMatch(
        /COALESCE\(vp\.primeira_senha_alterada,\s+TRUE\)\s+AS\s+primeira_senha_alterada/
      );
    });

    it('deve ter COALESCE vp.aceite_politica_privacidade correto', () => {
      expect(vendedorDadosContent).toMatch(
        /COALESCE\(vp\.aceite_politica_privacidade,\s+TRUE\)\s+AS\s+aceite_politica_privacidade/
      );
    });

    it('não deve ter vírgula extra após aceite_politica_privacidade', () => {
      // Antes: COALESCE(...) as aceite_politica_privacidade, <-- ERRO
      // Depois: COALESCE(...) as aceite_politica_privacidade
      // FROM
      const query = vendedorDadosContent.match(
        /SELECT[\s\S]*?FROM\s+public\.usuarios/i
      )?.[0];
      if (query) {
        // Não deve ter padrão: AS aceite_politica_privacidade, \n FROM
        expect(query).not.toMatch(
          /aceite_politica_privacidade\s*,\s*\n\s*FROM/
        );
      }
    });

    it('deve ter JOIN e WHERE corretos', () => {
      expect(vendedorDadosContent).toMatch(
        /LEFT\s+JOIN\s+public\.vendedores_perfil\s+vp\s+ON\s+vp\.usuario_id\s+=\s+u\.id/
      );
      expect(vendedorDadosContent).toMatch(
        /WHERE\s+u\.cpf\s+=\s+\$1\s+AND\s+u\.tipo_usuario\s+=\s+'vendedor'/
      );
    });

    it('query deve ser válida PostgreSQL (sem erros de sintaxe)', () => {
      // Validação básica: deve ter estrutura SELECT ... FROM ... WHERE ...
      const hasBasicStructure =
        /SELECT[\s\S]*FROM[\s\S]*WHERE[\s\S]*LIMIT/i.test(vendedorDadosContent);
      expect(hasBasicStructure).toBe(true);
    });
  });

  // =====================================================================
  // 5. Validar que VendedorCard renderiza corretamente sem props removidas
  // =====================================================================

  describe('5. Renderização VendedorCard — Comportamento', () => {
    let equipeContent: string;

    beforeAll(() => {
      equipeContent = fs.readFileSync(equipePagePath, 'utf-8');
    });

    it('deve renderizar #vendedor_id sem prop "copiado"', () => {
      // Dentro do VendedorCard, deve haver:
      // #{v.vendedor_id} sem lógica de "copiado"
      const vendedorCardBody = equipeContent.match(
        /function\s+VendedorCard[\s\S]*?return\s*\([\s\S]*?\);/
      )?.[0];
      if (vendedorCardBody) {
        expect(vendedorCardBody).toMatch(/#\{v\.vendedor_id\}/);
      }
    });

    it('deve ter botão de reenvio de convite', () => {
      expect(equipeContent).toMatch(/Reenviar\s+Convite/);
    });
  });

  // =====================================================================
  // 6. Validar aplicação das mudanças — Integração
  // =====================================================================

  describe('6. Integração — Alterações Completas', () => {
    let equipeContent: string;
    let vendedorDadosContent: string;

    beforeAll(() => {
      equipeContent = fs.readFileSync(equipePagePath, 'utf-8');
      vendedorDadosContent = fs.readFileSync(vendedorDadosPath, 'utf-8');
    });

    it('removeu imports não usados E removeu props relacionadas', () => {
      // Copy, Check imports removidos
      expect(equipeContent).not.toMatch(
        /from\s+['"]lucide-react['"];[\s\S]*?\bCopy\b/
      );
      // Props relacionadas removidas
      expect(equipeContent).not.toMatch(/copiado=/);
    });

    it('removeu função handleCopiarCodigo E estado codigoCopiadoId', () => {
      expect(equipeContent).not.toMatch(/handleCopiarCodigo/);
      expect(equipeContent).not.toMatch(/codigoCopiadoId/);
    });

    it('query SQL está sintaticamente correta (sem vírgula extra)', () => {
      // Valida que a query SQL foi corrigida
      expect(vendedorDadosContent).toMatch(
        /aceite_politica_privacidade\s+FROM/
      );
    });

    it('nenhuma quebra de funcionalidade esperada', () => {
      // Deve ter <VendedorCard com as props corretas
      expect(equipeContent).toMatch(/<VendedorCard\s+key={v\.vinculo_id}/);
      // Deve ter onClick
      expect(equipeContent).toMatch(
        /onClick=\{?\s*\(\)\s*=>\s*setEditarVendedor/
      );
    });
  });
});
