/**
 * __tests__/api/representante-equipe-cadastro-fix.test.ts
 *
 * Teste de integração: POST /api/representante/equipe/cadastrar
 * Verifica que após migration 1140, não há mais erro de duplicata de código.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { query } from '@/lib/db';

describe('POST /api/representante/equipe/cadastrar — sem duplicata após migration 1140', () => {
  const testCpf = '12345678900'; // CPF de teste único

  afterAll(async () => {
    // Cleanup: remover dados de teste
    await query(`DELETE FROM public.usuarios WHERE cpf = $1`, [testCpf]);
  });

  it('seq_vendedor_codigo deve estar operacional e sem lastval() = valor anterior', async () => {
    // Pega dois valores consecutivos — devem ser diferentes
    const result1 = await query<{ codigo: string }>(
      `SELECT nextval('public.seq_vendedor_codigo')::text AS codigo`
    );
    const codigo1 = parseInt(result1.rows[0].codigo, 10);

    const result2 = await query<{ codigo: string }>(
      `SELECT nextval('public.seq_vendedor_codigo')::text AS codigo`
    );
    const codigo2 = parseInt(result2.rows[0].codigo, 10);

    expect(codigo2).toBe(codigo1 + 1);
    console.log(`Códigos consecutivos OK: ${codigo1}, ${codigo2}`);
  });

  it('inserção de usuário com código gerado não causa violação de UNIQUE', async () => {
    // Simula a lógica da rota POST /api/representante/equipe/cadastrar

    // 1. Inserir usuário
    const userResult = await query<{ id: number }>(
      `INSERT INTO public.usuarios (cpf, nome, email, tipo_usuario)
       VALUES ($1, 'Teste Vendedor', 'teste@email.com', 'vendedor')
       RETURNING id`,
      [testCpf]
    );
    const userId = userResult.rows[0].id;

    // 2. Gerar código sequencial
    const codigoResult = await query<{ codigo: string }>(
      `SELECT nextval('public.seq_vendedor_codigo')::text AS codigo`
    );
    const codigo = codigoResult.rows[0].codigo;

    // 3. Inserir perfil do vendedor (deve não falhar com duplicata)
    let inserted = false;
    let errorCode: string | null = null;

    try {
      await query(
        `INSERT INTO public.vendedores_perfil
           (usuario_id, codigo, tipo_pessoa)
         VALUES ($1, $2, 'pf')`,
        [userId, codigo]
      );
      inserted = true;
    } catch (err: unknown) {
      const e = err as { code?: string; constraint?: string };
      errorCode = e.code ?? null;
      console.error(
        `Erro na inserção: code=${e.code}, constraint=${e.constraint}`
      );
    }

    expect(inserted).toBe(true);
    expect(errorCode).not.toBe('23505'); // UNIQUE constraint violation é error code 23505

    console.log(
      `✓ Inserção bem-sucedida com código ${codigo} para vendedor ${userId}`
    );
  });
});
