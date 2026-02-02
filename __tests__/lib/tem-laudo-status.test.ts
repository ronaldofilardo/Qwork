/**
 * Teste: tem_laudo deve ignorar laudos em rascunho
 *
 * Valida que a flag tem_laudo só é TRUE quando existe laudo com status != 'rascunho'
 * Correção aplicada em lib/queries.ts e app/api/entidade/lote/[id]/route.ts
 */

import * as fs from 'fs';
import * as path from 'path';

describe('tem_laudo - Correção para ignorar rascunhos', () => {
  let queriesContent: string;
  let entidadeLoteContent: string;

  beforeAll(() => {
    const queriesPath = path.join(process.cwd(), 'lib/queries.ts');
    const entidadePath = path.join(
      process.cwd(),
      'app/api/entidade/lote/[id]/route.ts'
    );

    queriesContent = fs.readFileSync(queriesPath, 'utf-8');
    entidadeLoteContent = fs.readFileSync(entidadePath, 'utf-8');
  });

  describe('lib/queries.ts - getLoteInfo', () => {
    it('deve ter LEFT JOIN com tabela laudos', () => {
      expect(queriesContent).toContain(
        'LEFT JOIN laudos l ON l.lote_id = la.id'
      );
    });

    it('tem_laudo deve verificar status != rascunho', () => {
      // Verificar que a condição inclui verificação de status
      const temLaudoPattern =
        /CASE WHEN l\.id IS NOT NULL AND l\.status != 'rascunho' THEN true ELSE false END as tem_laudo/;
      expect(queriesContent).toMatch(temLaudoPattern);
    });

    it('não deve considerar laudo apenas por l.id existir', () => {
      // Garantir que não está usando apenas l.id IS NOT NULL
      const wrongPattern =
        /CASE WHEN l\.id IS NOT NULL THEN true ELSE false END as tem_laudo/;
      expect(queriesContent).not.toMatch(wrongPattern);
    });
  });

  describe('app/api/entidade/lote/[id]/route.ts', () => {
    it('deve ter LEFT JOIN com tabela laudos', () => {
      expect(entidadeLoteContent).toContain(
        'LEFT JOIN laudos l ON l.lote_id = la.id'
      );
    });

    it('tem_laudo deve verificar status != rascunho', () => {
      const temLaudoPattern =
        /CASE WHEN l\.id IS NOT NULL AND l\.status != 'rascunho' THEN true ELSE false END as tem_laudo/;
      expect(entidadeLoteContent).toMatch(temLaudoPattern);
    });

    it('não deve considerar laudo apenas por l.id existir', () => {
      const wrongPattern =
        /CASE WHEN l\.id IS NOT NULL THEN true ELSE false END as tem_laudo/;
      expect(entidadeLoteContent).not.toMatch(wrongPattern);
    });
  });

  describe('Validação de status de laudo', () => {
    it('queries.ts deve retornar laudo_status', () => {
      expect(queriesContent).toContain('l.status as laudo_status');
    });

    it('entidade route deve retornar laudo_status', () => {
      expect(entidadeLoteContent).toContain('l.status as laudo_status');
    });
  });

  describe('Documentação', () => {
    it('deve ter comentário explicando status válidos de avaliações', () => {
      // Verificar se há documentação sobre os status válidos
      const hasStatusDoc =
        queriesContent.includes('iniciada') ||
        queriesContent.includes('em_andamento') ||
        queriesContent.includes('concluida') ||
        queriesContent.includes('inativada');

      expect(hasStatusDoc).toBe(true);
    });
  });
});
