/**
 * rh-empresas-table-lote-labels.test.ts
 *
 * Valida as alterações de 2025 na tabela RH "Empresas Clientes":
 * 1. Coluna "Lote" adicionada com id do lote atual
 * 2. Rótulo "aguard. emissão" renomeado para "aguardando link pgto"
 * 3. Rótulo "emitido(s)" renomeado para "disponível(eis)"
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const TABLE_PATH = path.join(ROOT, 'app', 'rh', 'components', 'EmpresasTable.tsx');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(TABLE_PATH, 'utf-8');
});

describe('EmpresasTable — Coluna Lote', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(TABLE_PATH)).toBe(true);
  });

  it('deve ter cabeçalho "Lote" na tabela (dentro de um th)', () => {
    // O texto "Lote" aparece como conteúdo de texto de um elemento <th>
    expect(src).toMatch(/<th[\s\S]*?>[\s\S]*?Lote[\s\S]*?<\/th>/);
  });

  it('deve exibir id do lote com prefixo # (#{lote.id} em JSX)', () => {
    expect(src).toMatch(/#{lote\.id}/);
  });

  it('deve renderizar fallback "—" quando não há lote atual', () => {
    // O fallback é um elemento com texto "—" dentro do bloco lote
    expect(src).toMatch(/lote\s*\?\s*\([\s\S]*?\)\s*:\s*\([\s\S]*?—[\s\S]*?\)/);
  });
});

describe('EmpresasTable — Labels renomeados', () => {
  it('deve conter "link pgto" no rótulo do status aguardando_emissao', () => {
    // O label pode estar quebrado em múltiplas linhas JSX
    expect(src).toMatch(/aguardando_emissao[\s\S]{0,100}link pgto/);
  });

  it('deve conter rótulo "disponível(eis)" para laudo_emitido (não mais "emitido(s)")', () => {
    expect(src).toContain('disponível(eis)');
    expect(src).not.toContain('emitido(s)');
  });

  it('"link pgto" deve manter cor laranja (status aguardando_emissao)', () => {
    // Verifica que orange aparece no mesmo bloco do aguardando_emissao
    const orangePattern = /aguardando_emissao[\s\S]{0,100}orange/;
    expect(src).toMatch(orangePattern);
  });

  it('"disponível(eis)" deve manter cor verde (status laudo_emitido)', () => {
    const greenPattern = /disponível\(eis\)[\s\S]{0,200}green|green[\s\S]{0,200}disponível\(eis\)/;
    expect(src).toMatch(greenPattern);
  });
});
