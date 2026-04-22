/**
 * __tests__/api/representante-equipe-cadastro-fix.test.ts
 *
 * Teste de integração: verifica que Migration 1227 foi aplicada corretamente.
 * A sequência seq_vendedor_codigo e a coluna codigo de vendedores_perfil
 * foram removidas — o cadastro de vendedor não depende mais de código sequencial.
 */

import { describe, it, expect, afterAll } from '@jest/globals';
import { query } from '@/lib/db';

describe('Migration 1227 — remoção de seq_vendedor_codigo e campo codigo', () => {
  const testCpf = '12345678900';

  afterAll(async () => {
    await query(`DELETE FROM public.usuarios WHERE cpf = $1`, [testCpf]);
  });

  it('seq_vendedor_codigo não existe mais no banco', async () => {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_sequences
         WHERE schemaname = 'public' AND sequencename = 'seq_vendedor_codigo'
       ) AS exists`
    );
    expect(result.rows[0].exists).toBe(false);
  });

  it('coluna codigo não existe mais em vendedores_perfil', async () => {
    const result = await query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'vendedores_perfil'
         AND column_name = 'codigo'`
    );
    expect(result.rows).toHaveLength(0);
  });

  it('INSERT em vendedores_perfil funciona sem campo codigo', async () => {
    // Cria usuário auxiliar para testar a inserção do perfil
    const userResult = await query<{ id: number }>(
      `INSERT INTO public.usuarios (cpf, nome, email, tipo_usuario, perfil)
       VALUES ($1, 'Teste Mig1227', 'mig1227@test.com', 'vendedor', 'vendedor')
       RETURNING id`,
      [testCpf]
    );
    const userId = userResult.rows[0].id;
    expect(userId).toBeGreaterThan(0);

    // Inserção sem codigo deve funcionar
    let inserted = false;
    let errorMsg: string | null = null;
    try {
      await query(
        `INSERT INTO public.vendedores_perfil (usuario_id, tipo_pessoa)
         VALUES ($1, 'pf')`,
        [userId]
      );
      inserted = true;
    } catch (err: unknown) {
      errorMsg = (err as Error).message;
    }

    expect(inserted).toBe(true);
    expect(errorMsg).toBeNull();
  });
});

