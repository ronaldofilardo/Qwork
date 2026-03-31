/**
 * @file __tests__/lib/schema-validation-utils.test.ts
 * Testes: Utilitários de validação de schema, divergências código↔DB e ERD
 */

import {
  diffSnapshots,
  looksLikeSQL,
  extractSqlBlocks,
  extractTableRefs,
  extractColumnRefs,
  simplifyType,
  sanitizeMermaid,
  assignDomain,
  SQL_KEYWORDS,
} from '@/lib/db/schema-validation-utils';

import type {
  SchemaSnapshot,
  ColumnSnapshot,
  TableSnapshot,
} from '@/lib/db/schema-validation-utils';

// ─── Helpers de fixture ───────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<SchemaSnapshot> = {}): SchemaSnapshot {
  return {
    generated_at: '2025-01-01T00:00:00.000Z',
    enums: {},
    tables: [],
    ...overrides,
  };
}

function makeColumn(overrides: Partial<ColumnSnapshot> = {}): ColumnSnapshot {
  return {
    name: 'id',
    type: 'uuid',
    nullable: false,
    default: null,
    ...overrides,
  };
}

function makeTable(overrides: Partial<TableSnapshot> = {}): TableSnapshot {
  return {
    name: 'usuarios',
    columns: [makeColumn()],
    constraints: [],
    indexes: [],
    ...overrides,
  };
}

// ─── diffSnapshots ────────────────────────────────────────────────────────────

describe('diffSnapshots', () => {
  it('deve retornar sem divergência para snapshots idênticos', () => {
    const snap = makeSnapshot({ tables: [makeTable()] });
    const result = diffSnapshots(snap, snap);
    expect(result.hasDiff).toBe(false);
    expect(result.lines).toHaveLength(0);
  });

  it('deve detectar tabela adicionada no snapshot atual', () => {
    const reference = makeSnapshot();
    const current = makeSnapshot({
      tables: [makeTable({ name: 'nova_tabela' })],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[+]') && l.includes('nova_tabela'))
    ).toBe(true);
  });

  it('deve detectar tabela removida do snapshot atual', () => {
    const reference = makeSnapshot({
      tables: [makeTable({ name: 'tabela_removida' })],
    });
    const current = makeSnapshot();
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some(
        (l) => l.includes('[-]') && l.includes('tabela_removida')
      )
    ).toBe(true);
  });

  it('deve detectar coluna adicionada', () => {
    const reference = makeSnapshot({
      tables: [makeTable({ columns: [makeColumn({ name: 'id' })] })],
    });
    const current = makeSnapshot({
      tables: [
        makeTable({
          columns: [makeColumn({ name: 'id' }), makeColumn({ name: 'nome' })],
        }),
      ],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[+]') && l.includes('nome'))
    ).toBe(true);
  });

  it('deve detectar coluna removida', () => {
    const reference = makeSnapshot({
      tables: [
        makeTable({
          columns: [makeColumn({ name: 'id' }), makeColumn({ name: 'nome' })],
        }),
      ],
    });
    const current = makeSnapshot({
      tables: [makeTable({ columns: [makeColumn({ name: 'id' })] })],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[-]') && l.includes('nome'))
    ).toBe(true);
  });

  it('deve detectar mudança de tipo de coluna', () => {
    const reference = makeSnapshot({
      tables: [
        makeTable({ columns: [makeColumn({ name: 'status', type: 'text' })] }),
      ],
    });
    const current = makeSnapshot({
      tables: [
        makeTable({
          columns: [makeColumn({ name: 'status', type: 'varchar' })],
        }),
      ],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[~]') && l.includes('status'))
    ).toBe(true);
  });

  it('deve detectar mudança de nullable', () => {
    const reference = makeSnapshot({
      tables: [
        makeTable({
          columns: [makeColumn({ name: 'campo', nullable: false })],
        }),
      ],
    });
    const current = makeSnapshot({
      tables: [
        makeTable({ columns: [makeColumn({ name: 'campo', nullable: true })] }),
      ],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[~]') && l.includes('nullable'))
    ).toBe(true);
  });

  it('deve detectar ENUM adicionado', () => {
    const reference = makeSnapshot({ enums: {} });
    const current = makeSnapshot({
      enums: { status_tipo: ['ativo', 'inativo'] },
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[+]') && l.includes('status_tipo'))
    ).toBe(true);
  });

  it('deve detectar ENUM removido', () => {
    const reference = makeSnapshot({
      enums: { status_tipo: ['ativo', 'inativo'] },
    });
    const current = makeSnapshot({ enums: {} });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[-]') && l.includes('status_tipo'))
    ).toBe(true);
  });

  it('deve detectar ENUM com valores alterados', () => {
    const reference = makeSnapshot({ enums: { tipo: ['a', 'b'] } });
    const current = makeSnapshot({ enums: { tipo: ['a', 'b', 'c'] } });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[~]') && l.includes('tipo'))
    ).toBe(true);
  });

  it('deve detectar constraint adicionada', () => {
    const reference = makeSnapshot({
      tables: [makeTable({ constraints: [] })],
    });
    const current = makeSnapshot({
      tables: [
        makeTable({
          constraints: [
            { name: 'uq_email', type: 'UNIQUE', columns: ['email'] },
          ],
        }),
      ],
    });
    const result = diffSnapshots(reference, current);
    expect(result.hasDiff).toBe(true);
    expect(
      result.lines.some((l) => l.includes('[+]') && l.includes('uq_email'))
    ).toBe(true);
  });
});

// ─── looksLikeSQL ─────────────────────────────────────────────────────────────

describe('looksLikeSQL', () => {
  it('deve identificar SELECT como SQL', () => {
    expect(looksLikeSQL('SELECT * FROM usuarios')).toBe(true);
  });

  it('deve identificar INSERT INTO como SQL', () => {
    expect(looksLikeSQL('INSERT INTO tabela VALUES (?)')).toBe(true);
  });

  it('deve identificar UPDATE como SQL', () => {
    expect(looksLikeSQL('UPDATE usuarios SET nome = $1')).toBe(true);
  });

  it('deve identificar DELETE FROM como SQL', () => {
    expect(looksLikeSQL('DELETE FROM sessoes WHERE id = $1')).toBe(true);
  });

  it('deve identificar FROM/JOIN como SQL', () => {
    expect(
      looksLikeSQL(
        'FROM contratos JOIN empresas ON empresas.id = contratos.empresa_id'
      )
    ).toBe(true);
  });

  it('deve rejeitar texto simples sem SQL', () => {
    expect(looksLikeSQL('apenas um texto qualquer')).toBe(false);
    expect(looksLikeSQL('campo_nome: string')).toBe(false);
    expect(looksLikeSQL('')).toBe(false);
  });
});

// ─── SQL_KEYWORDS ─────────────────────────────────────────────────────────────

describe('SQL_KEYWORDS', () => {
  it('deve conter palavras reservadas comuns', () => {
    expect(SQL_KEYWORDS.has('select')).toBe(true);
    expect(SQL_KEYWORDS.has('from')).toBe(true);
    expect(SQL_KEYWORDS.has('where')).toBe(true);
    expect(SQL_KEYWORDS.has('join')).toBe(true);
    expect(SQL_KEYWORDS.has('null')).toBe(true);
  });

  it('não deve conter nomes de tabelas típicos', () => {
    expect(SQL_KEYWORDS.has('usuarios')).toBe(false);
    expect(SQL_KEYWORDS.has('contratos')).toBe(false);
    expect(SQL_KEYWORDS.has('empresas')).toBe(false);
  });
});

// ─── extractSqlBlocks ─────────────────────────────────────────────────────────

describe('extractSqlBlocks', () => {
  it('deve extrair SQL de template literal com query()', () => {
    const content = 'const result = await query(`SELECT * FROM usuarios`)';
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].sql).toContain('SELECT * FROM usuarios');
    expect(blocks[0].line).toBe(1);
  });

  it('deve extrair SQL de string simples com query()', () => {
    const content = "await query('SELECT id FROM empresas WHERE ativo = true')";
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].sql).toContain('SELECT id FROM empresas');
  });

  it('deve extrair SQL de variável nomeada em maiúsculo', () => {
    const content = 'const SQL_GET = `SELECT * FROM contratos WHERE id = ?`';
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].sql).toContain('SELECT * FROM contratos');
  });

  it('deve retornar array vazio para conteúdo sem SQL', () => {
    const content = 'const nome = "João"; const idade = 30;';
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(0);
  });

  it('deve reportar linha correta em arquivo multiplas linhas', () => {
    const content =
      'const a = 1;\nconst b = 2;\nawait query(`SELECT * FROM lotes`)';
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].line).toBe(3);
  });

  it('deve substituir interpolações por ? e ainda detectar SQL', () => {
    const content = 'await query(`SELECT * FROM usuarios WHERE id = ${id}`)';
    const blocks = extractSqlBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].sql).toContain('WHERE id = ?');
  });
});

// ─── extractTableRefs ─────────────────────────────────────────────────────────

describe('extractTableRefs', () => {
  it('deve extrair tabela de FROM', () => {
    expect(extractTableRefs('SELECT * FROM usuarios')).toContain('usuarios');
  });

  it('deve extrair tabela de JOIN', () => {
    const refs = extractTableRefs(
      'SELECT * FROM usuarios JOIN contratos ON contratos.usuario_id = usuarios.id'
    );
    expect(refs).toContain('usuarios');
    expect(refs).toContain('contratos');
  });

  it('deve extrair tabela de UPDATE', () => {
    expect(extractTableRefs('UPDATE empresas SET nome = $1')).toContain(
      'empresas'
    );
  });

  it('deve extrair tabela de INSERT INTO', () => {
    expect(
      extractTableRefs('INSERT INTO avaliacoes VALUES ($1, $2)')
    ).toContain('avaliacoes');
  });

  it('deve extrair tabela de DELETE FROM', () => {
    expect(
      extractTableRefs('DELETE FROM sessoes WHERE expira_em < NOW()')
    ).toContain('sessoes');
  });

  it('não deve retornar palavras-chave SQL como tabelas', () => {
    const refs = extractTableRefs(
      'SELECT * FROM tabela WHERE id IN (SELECT id FROM outra)'
    );
    expect(refs).not.toContain('select');
    expect(refs).not.toContain('where');
    expect(refs).not.toContain('in');
  });

  it('deve deduplica referências repetidas', () => {
    const refs = extractTableRefs(
      'SELECT a.id FROM usuarios a JOIN usuarios b ON b.id = a.superior_id'
    );
    expect(refs.filter((t) => t === 'usuarios')).toHaveLength(1);
  });
});

// ─── extractColumnRefs ────────────────────────────────────────────────────────

describe('extractColumnRefs', () => {
  it('deve extrair referência qualificada tabela.coluna', () => {
    const refs = extractColumnRefs('SELECT u.nome, u.email FROM usuarios u');
    expect(refs.some((r) => r.table === 'u' && r.column === 'nome')).toBe(true);
    expect(refs.some((r) => r.table === 'u' && r.column === 'email')).toBe(
      true
    );
  });

  it('deve ignorar palavras-chave SQL como qualificador', () => {
    const refs = extractColumnRefs('SELECT * FROM pg_catalog.pg_class');
    expect(refs.every((r) => r.table !== 'pg_catalog')).toBe(true);
  });

  it('deve retornar array vazio para SQL sem qualificadores', () => {
    const refs = extractColumnRefs('SELECT nome, email FROM usuarios');
    expect(refs).toHaveLength(0);
  });
});

// ─── simplifyType ─────────────────────────────────────────────────────────────

describe('simplifyType', () => {
  it('deve simplificar integer para int', () => {
    expect(simplifyType('integer', null)).toBe('int');
  });

  it('deve simplificar boolean para bool', () => {
    expect(simplifyType('boolean', null)).toBe('bool');
  });

  it('deve simplificar character varying para varchar', () => {
    expect(simplifyType('character varying', null)).toBe('varchar');
  });

  it('deve incluir comprimento em varchar quando maxLen está presente', () => {
    expect(simplifyType('character varying', '255')).toBe('varchar(255)');
  });

  it('deve simplificar timestamp without time zone', () => {
    expect(simplifyType('timestamp without time zone', null)).toBe('timestamp');
  });

  it('deve simplificar timestamp with time zone para timestamptz', () => {
    expect(simplifyType('timestamp with time zone', null)).toBe('timestamptz');
  });

  it('deve manter tipos desconhecidos sem alteração', () => {
    expect(simplifyType('tipo_customizado', null)).toBe('tipo_customizado');
  });

  it('deve simplificar uuid para uuid (sem alteração)', () => {
    expect(simplifyType('uuid', null)).toBe('uuid');
  });

  it('deve simplificar jsonb para jsonb (sem alteração)', () => {
    expect(simplifyType('jsonb', null)).toBe('jsonb');
  });
});

// ─── sanitizeMermaid ──────────────────────────────────────────────────────────

describe('sanitizeMermaid', () => {
  it('deve trocar aspas duplas por simples', () => {
    expect(sanitizeMermaid('"texto"')).toBe("'texto'");
  });

  it('deve remover caracteres < e >', () => {
    expect(sanitizeMermaid('a<b>c')).toBe('abc');
    expect(sanitizeMermaid('tipo <especial>')).toBe('tipo especial');
  });

  it('deve remover quebras de linha', () => {
    expect(sanitizeMermaid('linha1\nlinha2')).toBe('linha1 linha2');
  });

  it('deve truncar texto em 80 caracteres', () => {
    const longa = 'a'.repeat(120);
    const result = sanitizeMermaid(longa);
    expect(result.length).toBe(80);
  });

  it('deve aplicar trim', () => {
    expect(sanitizeMermaid('  texto  ')).toBe('texto');
  });
});

// ─── assignDomain ─────────────────────────────────────────────────────────────

describe('assignDomain', () => {
  it('deve atribuir Identidade para tabelas de clínicas', () => {
    expect(assignDomain('clinicas')).toBe('Identidade');
  });

  it('deve atribuir Identidade para tabelas de funcionários', () => {
    expect(assignDomain('funcionarios')).toBe('Identidade');
  });

  it('deve atribuir Entidades & Comercial para representantes', () => {
    expect(assignDomain('representantes')).toBe('Entidades & Comercial');
  });

  it('deve atribuir Entidades & Comercial para contratos', () => {
    expect(assignDomain('contratos')).toBe('Entidades & Comercial');
  });

  it('deve atribuir Avaliações & Laudos para avaliações', () => {
    expect(assignDomain('avaliacoes')).toBe('Avaliações & Laudos');
  });

  it('deve atribuir Avaliações & Laudos para laudos', () => {
    expect(assignDomain('laudos')).toBe('Avaliações & Laudos');
  });

  it('deve atribuir Financeiro & Notificações para pagamentos', () => {
    expect(assignDomain('pagamentos')).toBe('Financeiro & Notificações');
  });

  it('deve atribuir Financeiro & Notificações para comissoes', () => {
    expect(assignDomain('comissoes')).toBe('Financeiro & Notificações');
  });

  it('deve atribuir Foundation para audit_logs', () => {
    expect(assignDomain('audit_logs')).toBe('Foundation');
  });

  it('deve atribuir Outros para tabelas não classificadas', () => {
    expect(assignDomain('tabela_desconhecida_xyz')).toBe('Outros');
  });
});
