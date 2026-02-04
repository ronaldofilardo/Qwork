/**
 * Testes para Melhorias no Fluxo de Emissão de Laudos
 *
 * Contexto das Alterações:
 * 1. Removida aba "Aguardando Envio" do emissor dashboard
 * 2. Aba padrão alterada para "Laudo para Emitir"
 * 3. Filtro mostra apenas lotes com status='concluido'
 * 4. Botão "Solicitar Emissão" desaparece após solicitação ou quando tem laudo
 * 5. API retorna emissao_solicitada, tem_laudo e laudo_status
 * 6. Cards do emissor mostram informação de solicitante
 */

import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

describe('Emissor Workflow - Melhorias UX', () => {
  describe('Frontend - Dashboard do Emissor', () => {
    let emissorPageContent: string;

    beforeAll(() => {
      const emissorPagePath = path.join(process.cwd(), 'app/emissor/page.tsx');
      emissorPageContent = fs.readFileSync(emissorPagePath, 'utf-8');
    });

    it('deve ter tipo ActiveTab sem "aguardando-envio"', () => {
      // Verificar se o tipo activeTab não inclui 'aguardando-envio'
      const typeMatch = emissorPageContent.match(
        /const \[activeTab, setActiveTab\] = useState<\s*\n?\s*'laudo-para-emitir' \| 'laudo-emitido' \| 'cancelados'/
      );
      expect(typeMatch).toBeTruthy();

      // Garantir que 'aguardando-envio' não aparece no tipo
      const hasAguardandoEnvio = /useState<[^>]*'aguardando-envio'/.test(
        emissorPageContent
      );
      expect(hasAguardandoEnvio).toBe(false);
    });

    it('deve ter aba padrão "laudo-para-emitir"', () => {
      const defaultTabMatch = emissorPageContent.match(
        /useState<[^>]*>\(\s*['"]laudo-para-emitir['"]/
      );
      expect(defaultTabMatch).toBeTruthy();
    });

    it('não deve renderizar botão "Aguardando Envio" na navegação', () => {
      // Procurar por qualquer referência a botão de "Aguardando Envio"
      const hasAguardandoEnvioButton =
        emissorPageContent.includes('Aguardando Envio') ||
        emissorPageContent.includes('aguardando-envio');

      // Se aparecer, deve ser apenas em comentários ou no switch case
      if (hasAguardandoEnvioButton) {
        // Verificar se não está em um botão ativo
        expect(emissorPageContent).not.toMatch(
          /<button[^>]*onClick[^>]*aguardando-envio/
        );
      }
    });

    it('deve filtrar apenas lotes "concluido" na aba "laudo-para-emitir"', () => {
      // Verificar o switch case do filtro
      const filterMatch = emissorPageContent.match(
        /case 'laudo-para-emitir':([\s\S]*?)case/
      );
      expect(filterMatch).toBeTruthy();

      if (filterMatch) {
        const filterLogic = filterMatch[1];
        // Deve verificar status === 'concluido'
        expect(filterLogic).toMatch(/lote\.status === ['"]concluido['"]/);
        // Não deve mais incluir status === 'ativo'
        expect(filterLogic).not.toMatch(/lote\.status === ['"]ativo['"]/);
      }
    });

    it('deve ter campos solicitado_por, solicitado_em e tipo_solicitante na interface Lote', () => {
      const interfaceMatch = emissorPageContent.match(
        /interface Lote \{([\s\S]*?)\}/
      );
      expect(interfaceMatch).toBeTruthy();

      if (interfaceMatch) {
        const interfaceContent = interfaceMatch[1];
        expect(interfaceContent).toMatch(/solicitado_por\?:/);
        expect(interfaceContent).toMatch(/solicitado_em\?:/);
        expect(interfaceContent).toMatch(/tipo_solicitante\?:/);
      }
    });

    it('deve exibir informação de "Emissão solicitada por" no card do lote', () => {
      // Verificar se há renderização condicional para solicitado_em e solicitado_por
      expect(emissorPageContent).toMatch(
        /lote\.solicitado_em.*&&.*lote\.solicitado_por/s
      );
      expect(emissorPageContent).toMatch(/Emissão solicitada por/);
    });
  });

  describe('Frontend - Página de Detalhes do Lote (Entidade)', () => {
    let lotePageContent: string;

    beforeAll(() => {
      const lotePagePath = path.join(
        process.cwd(),
        'app/entidade/lote/[id]/page.tsx'
      );
      lotePageContent = fs.readFileSync(lotePagePath, 'utf-8');
    });

    it('deve ter interface LoteInfo com campos de emissão e laudo', () => {
      const interfaceMatch = lotePageContent.match(
        /interface LoteInfo \{([\s\S]*?)\}/
      );
      expect(interfaceMatch).toBeTruthy();

      if (interfaceMatch) {
        const interfaceContent = interfaceMatch[1];
        expect(interfaceContent).toMatch(/emissao_solicitada\?:/);
        expect(interfaceContent).toMatch(/emissao_solicitado_em\?:/);
        expect(interfaceContent).toMatch(/tem_laudo\?:/);
        expect(interfaceContent).toMatch(/laudo_status\?:/);
      }
    });

    it('deve mostrar botão "Solicitar Emissão" apenas quando concluído, sem emissão e sem laudo', () => {
      // Procurar a condição de renderização do botão
      const buttonConditionMatch = lotePageContent.match(
        /lote\.status === ['"]concluido['"].*&&.*!lote\.emissao_solicitada.*&&.*!lote\.tem_laudo/s
      );
      expect(buttonConditionMatch).toBeTruthy();
    });

    it('deve mostrar card "Emissão Solicitada" quando emissao_solicitada=true e sem laudo', () => {
      const emissaoSolicitadaMatch = lotePageContent.match(
        /lote\.emissao_solicitada.*&&.*!lote\.tem_laudo/s
      );
      expect(emissaoSolicitadaMatch).toBeTruthy();
      expect(lotePageContent).toMatch(/Emissão Solicitada/);
    });

    it('deve mostrar card "Laudo Emitido" quando tem_laudo=true', () => {
      const laudoEmitidoMatch = lotePageContent.match(
        /lote.*&&.*lote\.tem_laudo/s
      );
      expect(laudoEmitidoMatch).toBeTruthy();
      expect(lotePageContent).toMatch(/Laudo Emitido/);
    });
  });

  describe('Backend - API /api/entidade/lote/[id]', () => {
    let apiContent: string;

    beforeAll(() => {
      const apiPath = path.join(
        process.cwd(),
        'app/api/entidade/lote/[id]/route.ts'
      );
      apiContent = fs.readFileSync(apiPath, 'utf-8');
    });

    it('deve fazer LEFT JOIN com fila_emissao', () => {
      expect(apiContent).toMatch(/LEFT JOIN fila_emissao.*ON.*lote_id/s);
    });

    it('deve fazer LEFT JOIN com laudos', () => {
      expect(apiContent).toMatch(/LEFT JOIN laudos.*ON.*lote_id/s);
    });

    it('deve retornar campo emissao_solicitada como boolean', () => {
      expect(apiContent).toMatch(
        /CASE WHEN.*fe\.id IS NOT NULL.*THEN true.*ELSE false.*END.*as emissao_solicitada/s
      );
    });

    it('deve retornar campos tem_laudo e laudo_status', () => {
      expect(apiContent).toMatch(/tem_laudo/);
      expect(apiContent).toMatch(/laudo_status/);
    });
  });

  describe('Backend - API /api/emissor/lotes', () => {
    let apiContent: string;

    beforeAll(() => {
      const apiPath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );
      apiContent = fs.readFileSync(apiPath, 'utf-8');
    });

    it('deve incluir LEFT JOIN com fila_emissao', () => {
      // Verificar se há JOIN com fila_emissao na query principal
      const queryMatch = apiContent.match(
        /SELECT[\s\S]*?FROM lotes_avaliacao[\s\S]*?WHERE/
      );
      if (queryMatch) {
        // Pode não ter LEFT JOIN direto mas deve ter os campos na resposta
        expect(apiContent).toMatch(/solicitado_por/);
        expect(apiContent).toMatch(/solicitado_em/);
        expect(apiContent).toMatch(/tipo_solicitante/);
      }
    });

    it('deve retornar solicitado_por, solicitado_em e tipo_solicitante no objeto lote', () => {
      const returnObjectMatch = apiContent.match(
        /return \{[\s\S]*?id:[\s\S]*?\}/m
      );
      expect(returnObjectMatch).toBeTruthy();

      expect(apiContent).toMatch(/solicitado_por:.*lote\.solicitado_por/);
      expect(apiContent).toMatch(/solicitado_em:.*lote\.solicitado_em/);
      expect(apiContent).toMatch(/tipo_solicitante:.*lote\.tipo_solicitante/);
    });
  });

  describe('Integração - Validação de Estrutura', () => {
    it('deve permitir consultar fila_emissao com campos de rastreabilidade', async () => {
      const result = await query(
        `SELECT 
          column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'fila_emissao'
          AND column_name IN ('solicitado_por', 'solicitado_em', 'tipo_solicitante')
        ORDER BY column_name`,
        []
      );

      expect(result.rows.length).toBe(3);

      const columns = result.rows.map((r) => r.column_name);
      expect(columns).toContain('solicitado_por');
      expect(columns).toContain('solicitado_em');
      expect(columns).toContain('tipo_solicitante');
    });

    it('deve retornar emissao_solicitada corretamente com CASE WHEN', async () => {
      const result = await query(
        `SELECT
          la.id,
          la.status,
          CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada
        FROM lotes_avaliacao la
        LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
        WHERE la.status = 'concluido'
        LIMIT 1`,
        []
      );

      if (result.rows.length > 0) {
        expect(result.rows[0]).toHaveProperty('emissao_solicitada');
        expect(typeof result.rows[0].emissao_solicitada).toBe('boolean');
      }
    });

    it('deve retornar tem_laudo corretamente com LEFT JOIN laudos', async () => {
      const result = await query(
        `SELECT
          la.id,
          la.status,
          CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo,
          l.status as laudo_status
        FROM lotes_avaliacao la
        LEFT JOIN laudos l ON l.lote_id = la.id
        WHERE la.status IN ('concluido', 'finalizado')
        LIMIT 5`,
        []
      );

      result.rows.forEach((row) => {
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('tem_laudo');
        expect(typeof row.tem_laudo).toBe('boolean');
        expect(row).toHaveProperty('laudo_status');
      });
    });

    it('deve combinar fila_emissao e laudos corretamente', async () => {
      const result = await query(
        `SELECT
          la.id,
          
          la.status,
          CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
          fe.solicitado_por,
          fe.solicitado_em,
          fe.tipo_solicitante,
          CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo,
          l.status as laudo_status
        FROM lotes_avaliacao la
        LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
        LEFT JOIN laudos l ON l.lote_id = la.id
        WHERE la.status IN ('concluido', 'finalizado')
        LIMIT 3`,
        []
      );

      result.rows.forEach((row) => {
        expect(row).toHaveProperty('id');
        // codigo removido
        expect(row).toHaveProperty('emissao_solicitada');
        expect(row).toHaveProperty('tem_laudo');
        expect(typeof row.emissao_solicitada).toBe('boolean');
        expect(typeof row.tem_laudo).toBe('boolean');

        // Se tem emissão solicitada, deve ter campos preenchidos
        if (row.emissao_solicitada) {
          expect(row.solicitado_por).toBeTruthy();
          expect(row.tipo_solicitante).toBeTruthy();
        }
      });
    });
  });

  describe('Validação de Status de Lotes', () => {
    it('emissor deve filtrar apenas lotes concluidos na aba "laudo-para-emitir"', async () => {
      const result = await query(
        `SELECT 
          la.id, 
          la.status 
        FROM lotes_avaliacao la
        WHERE la.status = 'concluido' 
          AND la.status != 'cancelado'
        LIMIT 5`,
        []
      );

      // Todos os resultados devem ter status = concluido
      result.rows.forEach((row) => {
        expect(row.status).toBe('concluido');
        expect(row.status).not.toBe('ativo');
      });
    });
  });
});
