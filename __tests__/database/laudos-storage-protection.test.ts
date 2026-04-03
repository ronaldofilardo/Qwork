/**
 * @file __tests__/database/laudos-storage-protection.test.ts
 * Testes: Proteção de Storage de Laudos — Migration 1137
 *
 * Verifica que as regras de banco de dados implementadas na migration 1137
 * protegem corretamente os laudos contra deleção e mutação indevida.
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

afterEach(() => {
  mockQuery.mockReset();
});

afterAll(() => {
  jest.clearAllMocks();
});

// ─── Tabela laudos_storage_log ─────────────────────────────────────────────

describe('laudos_storage_log — estrutura da tabela', () => {
  it('tabela laudos_storage_log deve existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 });

    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'laudos_storage_log'
      )
    `);

    expect(result.rows[0].exists).toBe(true);
  });

  it('deve conter colunas essenciais: id, laudo_id, arquivo_path, hash_sha256, criado_em', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { column_name: 'id' },
        { column_name: 'laudo_id' },
        { column_name: 'arquivo_path' },
        { column_name: 'hash_sha256' },
        { column_name: 'criado_em' },
      ],
      rowCount: 5,
    });

    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'laudos_storage_log'
      AND column_name IN ('id', 'laudo_id', 'arquivo_path', 'hash_sha256', 'criado_em')
    `);

    const cols = result.rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'laudo_id',
        'arquivo_path',
        'hash_sha256',
        'criado_em',
      ])
    );
  });

  it('deve ter coluna backblaze_key (registro do ID remoto)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ column_name: 'backblaze_key' }],
      rowCount: 1,
    });

    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'laudos_storage_log'
      AND column_name = 'backblaze_key'
    `);

    expect(result.rows).toHaveLength(1);
  });
});

// ─── Trigger anti-mutação do log ───────────────────────────────────────────

describe('laudos_storage_log — trigger anti-mutação', () => {
  it('trigger trg_prevent_mutation_storage_log deve existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 });

    const result = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_prevent_mutation_storage_log'
      )
    `);

    expect(result.rows[0].exists).toBe(true);
  });

  it('tentativa de UPDATE em laudos_storage_log deve lançar exceção (via trigger)', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(new Error('laudos_storage_log é append-only'), {
        code: 'P0001',
      })
    );

    await expect(
      query(`UPDATE laudos_storage_log SET arquivo_path = '/fake' WHERE id = 1`)
    ).rejects.toMatchObject({ code: 'P0001' });
  });

  it('tentativa de DELETE em laudos_storage_log deve lançar exceção (via trigger)', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(new Error('laudos_storage_log é append-only'), {
        code: 'P0001',
      })
    );

    await expect(
      query(`DELETE FROM laudos_storage_log WHERE id = 1`)
    ).rejects.toMatchObject({ code: 'P0001' });
  });
});

// ─── RLS delete em laudos ──────────────────────────────────────────────────

describe('laudos — bloqueio de DELETE via RLS', () => {
  it('policy laudos_no_delete_app_roles deve existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 });

    const result = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polname = 'laudos_no_delete_app_roles'
        AND polrelid = 'laudos'::regclass
      )
    `);

    expect(result.rows[0].exists).toBe(true);
  });

  it('tentativa de DELETE de laudo emitido deve ser bloqueada por policy', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(
        new Error(
          'new row violates row-level security policy for table "laudos"'
        ),
        {
          code: '42501',
        }
      )
    );

    await expect(
      query(`DELETE FROM laudos WHERE id = 1`)
    ).rejects.toMatchObject({ code: '42501' });
  });
});

// ─── Trigger de auditoria em delete de laudos ──────────────────────────────

describe('laudos — trigger de auditoria de delete', () => {
  it('trigger trg_audit_laudo_delete_attempt deve existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 });

    const result = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_audit_laudo_delete_attempt'
        AND tgrelid = 'laudos'::regclass
      )
    `);

    expect(result.rows[0].exists).toBe(true);
  });
});

// ─── Permissão simbólica delete:laudos:filesystem ─────────────────────────

describe('permissions — delete:laudos:filesystem deve existir como BLOQUEADA', () => {
  it('permissão delete:laudos:filesystem deve estar na tabela permissions', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ nome: 'delete:laudos:filesystem', descricao: 'BLOQUEADA' }],
      rowCount: 1,
    });

    const result = await query(`
      SELECT nome, descricao
      FROM permissions
      WHERE nome = 'delete:laudos:filesystem'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].nome).toBe('delete:laudos:filesystem');
  });

  it('nenhuma role deve receber a permissão delete:laudos:filesystem', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await query(`
      SELECT rp.*
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_nome = p.nome
      WHERE p.nome = 'delete:laudos:filesystem'
    `);

    expect(result.rows).toHaveLength(0);
  });
});

// ─── FK ON DELETE RESTRICT (integridade referencial) ──────────────────────

describe('laudos — integridade referencial via laudos_storage_log', () => {
  it('DELETE em laudo com entradas no storage_log deve falhar (ON DELETE RESTRICT)', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(
        new Error(
          'update or delete on table "laudos" violates foreign key constraint "laudos_storage_log_laudo_id_fkey"'
        ),
        { code: '23503' }
      )
    );

    await expect(
      query(`DELETE FROM laudos WHERE id = 42`)
    ).rejects.toMatchObject({ code: '23503' });
  });
});
