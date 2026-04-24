/**
 * PATCH /api/admin/tomadores/[id]/softdelete
 *
 * Executa soft-delete em cascata ou reativação de um tomador (entidade ou clínica).
 *
 * Soft-delete cascata:
 *   - Entidade: ativa=false → usuarios.ativo=false → fe.ativo=false →
 *               funcionarios.ativo=false (sem outros vínculos ativos)
 *   - Clínica:  ativa=false → usuarios.ativo=false → empresas_clientes.ativa=false →
 *               fc.ativo=false → funcionarios.ativo=false (sem outros vínculos ativos)
 *
 * Reativação cascata:
 *   - Entidade: ativa=true → usuarios.ativo=true (gestor) → fe.ativo=true →
 *               funcionarios.ativo=true (vinculados)
 *   - Clínica:  ativa=true → usuarios.ativo=true (rh) → empresas_clientes.ativa=true →
 *               fc.ativo=true → funcionarios.ativo=true (vinculados)
 *
 * Exclusivo admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  action: z.enum(['softdelete', 'reativar']),
  tipo: z.enum(['entidade', 'clinica']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.ADMIN]);

    const tomadorId = parseInt(params.id);
    if (isNaN(tomadorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = (await request.json()) as unknown;
    const parseResult = BodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Body inválido', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, tipo } = parseResult.data;
    const tabela = tipo === 'entidade' ? 'entidades' : 'clinicas';

    // Verificar existência
    const existeResult = await query(
      `SELECT id, ativa FROM ${tabela} WHERE id = $1`,
      [tomadorId]
    );
    if (existeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const ctx = extrairContextoRequisicao(request);

    if (action === 'softdelete') {
      await query(
        `UPDATE ${tabela} SET ativa = false, atualizado_em = NOW() WHERE id = $1`,
        [tomadorId]
      );

      if (tipo === 'entidade') {
        await query(
          `UPDATE usuarios SET ativo = false, atualizado_em = NOW()
           WHERE entidade_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios_entidades SET ativo = false, atualizado_em = NOW()
           WHERE entidade_id = $1`,
          [tomadorId]
        );
        // Inativar funcionários sem outros vínculos ativos
        await query(
          `UPDATE funcionarios f
           SET ativo = false, atualizado_em = NOW()
           WHERE f.id IN (
             SELECT fe.funcionario_id
             FROM funcionarios_entidades fe
             WHERE fe.entidade_id = $1
           )
           AND NOT EXISTS (
             SELECT 1 FROM funcionarios_entidades fe2
             WHERE fe2.funcionario_id = f.id
               AND fe2.entidade_id <> $1
               AND fe2.ativo = true
           )
           AND NOT EXISTS (
             SELECT 1 FROM funcionarios_clinicas fc
             WHERE fc.funcionario_id = f.id
               AND fc.ativo = true
           )`,
          [tomadorId]
        );
      } else {
        await query(
          `UPDATE usuarios SET ativo = false, atualizado_em = NOW()
           WHERE clinica_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE empresas_clientes SET ativa = false, atualizado_em = NOW()
           WHERE clinica_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios_clinicas SET ativo = false, atualizado_em = NOW()
           WHERE clinica_id = $1`,
          [tomadorId]
        );
        // Inativar funcionários sem outros vínculos ativos
        await query(
          `UPDATE funcionarios f
           SET ativo = false, atualizado_em = NOW()
           WHERE f.id IN (
             SELECT fc.funcionario_id
             FROM funcionarios_clinicas fc
             WHERE fc.clinica_id = $1
           )
           AND NOT EXISTS (
             SELECT 1 FROM funcionarios_clinicas fc2
             WHERE fc2.funcionario_id = f.id
               AND fc2.clinica_id <> $1
               AND fc2.ativo = true
           )
           AND NOT EXISTS (
             SELECT 1 FROM funcionarios_entidades fe
             WHERE fe.funcionario_id = f.id
               AND fe.ativo = true
           )`,
          [tomadorId]
        );
      }

      await registrarAuditoria({
        entidade_tipo: 'tomador',
        entidade_id: tomadorId,
        acao: 'desativar',
        status_anterior: 'ativo',
        status_novo: 'inativo',
        usuario_cpf: session.cpf,
        usuario_perfil: session.perfil,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
        metadados: { tipo },
      });

      return NextResponse.json({ success: true, action: 'softdelete' });
    } else {
      // reativar
      await query(
        `UPDATE ${tabela} SET ativa = true, atualizado_em = NOW() WHERE id = $1`,
        [tomadorId]
      );

      if (tipo === 'entidade') {
        await query(
          `UPDATE usuarios SET ativo = true, atualizado_em = NOW()
           WHERE entidade_id = $1 AND tipo_usuario = 'gestor'`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios_entidades SET ativo = true, atualizado_em = NOW()
           WHERE entidade_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios f
           SET ativo = true, atualizado_em = NOW()
           WHERE f.id IN (
             SELECT fe.funcionario_id
             FROM funcionarios_entidades fe
             WHERE fe.entidade_id = $1
           )`,
          [tomadorId]
        );
      } else {
        await query(
          `UPDATE usuarios SET ativo = true, atualizado_em = NOW()
           WHERE clinica_id = $1 AND tipo_usuario = 'rh'`,
          [tomadorId]
        );
        await query(
          `UPDATE empresas_clientes SET ativa = true, atualizado_em = NOW()
           WHERE clinica_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios_clinicas SET ativo = true, atualizado_em = NOW()
           WHERE clinica_id = $1`,
          [tomadorId]
        );
        await query(
          `UPDATE funcionarios f
           SET ativo = true, atualizado_em = NOW()
           WHERE f.id IN (
             SELECT fc.funcionario_id
             FROM funcionarios_clinicas fc
             WHERE fc.clinica_id = $1
           )`,
          [tomadorId]
        );
      }

      await registrarAuditoria({
        entidade_tipo: 'tomador',
        entidade_id: tomadorId,
        acao: 'ativar',
        status_anterior: 'inativo',
        status_novo: 'ativo',
        usuario_cpf: session.cpf,
        usuario_perfil: session.perfil,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
        metadados: { tipo },
      });

      return NextResponse.json({ success: true, action: 'reativar' });
    }
  } catch (error: unknown) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[ADMIN TOMADORES SOFTDELETE] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
