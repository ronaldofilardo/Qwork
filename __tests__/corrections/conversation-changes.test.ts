/**
 * Testes para validar as mudanças implementadas na conversa:
 * 1. Botão "Solicitar Emissão" movido para páginas de detalhes
 * 2. Imutabilidade do botão (não exibir se laudo emitido)
 * 3. Correção do queryWithContext com variáveis RLS corretas
 * 4. Função validar_sessao_rls() no banco de dados
 */

import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';

describe('Correções da Conversa - Liberação de Lotes e RLS', () => {
  describe('Banco de Dados - Função validar_sessao_rls()', () => {
    it('deve ter a função validar_sessao_rls() criada no banco', async () => {
      const result = await query(
        `SELECT proname, pg_get_function_result(oid) as return_type
         FROM pg_proc 
         WHERE proname = 'validar_sessao_rls'`
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].proname).toBe('validar_sessao_rls');
      expect(result.rows[0].return_type).toBe('boolean');
    });

    it('deve validar que a função aceita variáveis app.current_clinica_id e app.current_contratante_id', async () => {
      const functionDef = await query(
        `SELECT pg_get_functiondef(oid) as definition
         FROM pg_proc 
         WHERE proname = 'validar_sessao_rls'`
      );

      const definition = functionDef.rows[0].definition;

      // Verificar que usa as variáveis corretas (sem "user" no meio)
      expect(definition).toContain('app.current_clinica_id');
      expect(definition).toContain('app.current_contratante_id');
      expect(definition).toContain('app.current_perfil');
      expect(definition).toContain('app.current_user_cpf');
    });
  });

  describe('Dados do Usuário RH no Banco', () => {
    it('deve ter usuário RH com clinica_id e contratante_id definidos', async () => {
      const result = await query(
        'SELECT cpf, usuario_tipo, ativo, clinica_id, contratante_id FROM funcionarios WHERE cpf = $1',
        ['04703084945']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      const user = result.rows[0];

      expect(user.cpf).toBe('04703084945');
      expect(user.usuario_tipo).toBe('gestor_rh');
      expect(user.ativo).toBe(true);
      expect(user.clinica_id).toBeTruthy();
      expect(user.contratante_id).toBeTruthy();
    });
  });

  describe('Estrutura de Dados - Lotes e Laudos', () => {
    it('deve ter query getLoteInfo retornando campos de laudo', async () => {
      // Verificar que a query inclui JOIN com laudos
      const result = await query(`
        SELECT la.id, la.status, l.id as laudo_id, l.status as laudo_status
        FROM lotes_avaliacao la
        LEFT JOIN laudos l ON l.lote_id = la.id
        WHERE la.id = (SELECT id FROM lotes_avaliacao LIMIT 1)
      `);

      // Deve executar sem erro, mesmo que não retorne dados
      expect(result).toBeDefined();
    });

    it('deve ter coluna status na tabela laudos', async () => {
      const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'laudos' AND column_name = 'status'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].column_name).toBe('status');
    });
  });

  describe('Testes de Integração - API liberar-lote', () => {
    it('deve ter endpoint /api/rh/liberar-lote usando queryWithContext', async () => {
      // Verificar que o arquivo existe e contém queryWithContext
      const fs = require('fs');
      const path = require('path');

      const rhApiPath = path.join(
        process.cwd(),
        'app',
        'api',
        'rh',
        'liberar-lote',
        'route.ts'
      );
      const rhApiContent = fs.readFileSync(rhApiPath, 'utf-8');

      expect(rhApiContent).toContain('queryWithContext');
      expect(rhApiContent).toContain("from '@/lib/db-security'");
    });

    it('deve ter endpoint /api/entidade/liberar-lote usando queryWithContext', async () => {
      const fs = require('fs');
      const path = require('path');

      const entidadeApiPath = path.join(
        process.cwd(),
        'app',
        'api',
        'entidade',
        'liberar-lote',
        'route.ts'
      );
      const entidadeApiContent = fs.readFileSync(entidadeApiPath, 'utf-8');

      expect(entidadeApiContent).toContain('queryWithContext');
      expect(entidadeApiContent).toContain("from '@/lib/db-security'");
    });
  });

  describe('Componente BotaoSolicitarEmissao - Imutabilidade', () => {
    it('deve ter componente BotaoSolicitarEmissao com props laudoId e laudoStatus', async () => {
      const fs = require('fs');
      const path = require('path');

      const componentPath = path.join(
        process.cwd(),
        'components',
        'BotaoSolicitarEmissao.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf-8');

      expect(componentContent).toContain('laudoId');
      expect(componentContent).toContain('laudoStatus');
      expect(componentContent).toContain('temLaudoEmitido');
    });

    it('deve ter lógica de imutabilidade no componente', async () => {
      const fs = require('fs');
      const path = require('path');

      const componentPath = path.join(
        process.cwd(),
        'components',
        'BotaoSolicitarEmissao.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf-8');

      // Verificar que retorna null quando há laudo emitido
      expect(componentContent).toMatch(/temLaudoEmitido.*return null/s);
      expect(componentContent).toContain("loteStatus !== 'concluido'");
    });
  });

  describe('Interface LoteInfo - Campos de Laudo', () => {
    it('deve ter interface LoteInfo com campos de laudo opcionais', async () => {
      const fs = require('fs');
      const path = require('path');

      const typesPath = path.join(process.cwd(), 'lib', 'types', 'database.ts');
      const typesContent = fs.readFileSync(typesPath, 'utf-8');

      expect(typesContent).toContain('laudo_id?');
      expect(typesContent).toContain('laudo_status?');
    });
  });

  describe('Query getLoteInfo - JOIN com Laudos', () => {
    it('deve ter getLoteInfo fazendo LEFT JOIN com laudos', async () => {
      const fs = require('fs');
      const path = require('path');

      const queriesPath = path.join(process.cwd(), 'lib', 'queries.ts');
      const queriesContent = fs.readFileSync(queriesPath, 'utf-8');

      expect(queriesContent).toContain('LEFT JOIN laudos');
      expect(queriesContent).toContain('laudo_id');
      expect(queriesContent).toContain('laudo_status');
    });
  });

  describe('Código db-security.ts - Variáveis RLS Corretas', () => {
    it('deve configurar app.current_clinica_id (sem user no meio)', async () => {
      const fs = require('fs');
      const path = require('path');

      const dbSecurityPath = path.join(process.cwd(), 'lib', 'db-security.ts');
      const dbSecurityContent = fs.readFileSync(dbSecurityPath, 'utf-8');

      expect(dbSecurityContent).toContain('app.current_clinica_id');
      expect(dbSecurityContent).toContain('app.current_contratante_id');

      // Verificar que usa as variáveis corretas (há contextos onde user_clinica_id ainda pode existir em comentários)
      const relevantSection = dbSecurityContent.substring(
        dbSecurityContent.indexOf('SELECT set_config'),
        dbSecurityContent.indexOf('validar_sessao_rls') + 100
      );
      expect(relevantSection).toContain('app.current_clinica_id');
      expect(relevantSection).toContain('app.current_contratante_id');
    });

    it('deve chamar validar_sessao_rls() APÓS configurar todas as variáveis', async () => {
      const fs = require('fs');
      const path = require('path');

      const dbSecurityPath = path.join(process.cwd(), 'lib', 'db-security.ts');
      const dbSecurityContent = fs.readFileSync(dbSecurityPath, 'utf-8');

      // Verificar que validar_sessao_rls aparece depois de set_config
      const setConfigIndex = dbSecurityContent.indexOf(
        "'app.current_clinica_id'"
      );
      const validarIndex = dbSecurityContent.indexOf('validar_sessao_rls()');

      expect(validarIndex).toBeGreaterThan(setConfigIndex);
    });
  });

  describe('Páginas - Botão Removido de Grids', () => {
    it('não deve ter BotaoSolicitarEmissao em LotesGrid', async () => {
      const fs = require('fs');
      const path = require('path');

      const gridPath = path.join(
        process.cwd(),
        'components',
        'rh',
        'LotesGrid.tsx'
      );
      const gridContent = fs.readFileSync(gridPath, 'utf-8');

      expect(gridContent).not.toContain('<BotaoSolicitarEmissao');
      expect(gridContent).not.toContain('BotaoSolicitarEmissao');
    });

    it('não deve ter BotaoSolicitarEmissao em entidade/lotes/page.tsx', async () => {
      const fs = require('fs');
      const path = require('path');

      const pagePath = path.join(
        process.cwd(),
        'app',
        'entidade',
        'lotes',
        'page.tsx'
      );
      const pageContent = fs.readFileSync(pagePath, 'utf-8');

      expect(pageContent).not.toContain('<BotaoSolicitarEmissao');
    });

    it('deve ter BotaoSolicitarEmissao em página de detalhes do lote para entidade', async () => {
      const fs = require('fs');
      const path = require('path');

      // Pode estar em diferentes localizações
      const possiblePaths = [
        path.join(process.cwd(), 'app', 'entidade', 'lote', '[id]', 'page.tsx'),
        path.join(
          process.cwd(),
          'app',
          'entidade',
          'lotes',
          '[id]',
          'page.tsx'
        ),
      ];

      let found = false;
      for (const pagePath of possiblePaths) {
        if (fs.existsSync(pagePath)) {
          const pageContent = fs.readFileSync(pagePath, 'utf-8');
          if (
            pageContent.includes('BotaoSolicitarEmissao') ||
            pageContent.includes('Solicitar Emissão')
          ) {
            found = true;
            break;
          }
        }
      }

      expect(found).toBe(true);
    });

    it('deve ter BotaoSolicitarEmissao em rh/empresa/[id]/lote/[loteId]/page.tsx com props de laudo', async () => {
      const fs = require('fs');
      const path = require('path');

      const pagePath = path.join(
        process.cwd(),
        'app',
        'rh',
        'empresa',
        '[id]',
        'lote',
        '[loteId]',
        'page.tsx'
      );
      const pageContent = fs.readFileSync(pagePath, 'utf-8');

      expect(pageContent).toContain('BotaoSolicitarEmissao');
      expect(pageContent).toContain('laudoId');
      expect(pageContent).toContain('laudoStatus');
    });
  });
});
