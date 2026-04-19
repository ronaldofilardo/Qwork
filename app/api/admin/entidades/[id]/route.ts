import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import bcrypt from 'bcryptjs';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';

export const dynamic = 'force-dynamic';

interface TrocarGestorInput {
  cpf: string;
  nome: string;
  email: string;
}

function validarCpf(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.length === 11;
}

/**
 * PATCH /api/admin/entidades/[id]
 * Ativa ou desativa uma entidade pelo ID.
 * Ao reativar, permite opcionalmente trocar o gestor.
 * Body: { ativa: boolean, trocar_gestor?: { cpf: string, nome: string, email: string } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['suporte', 'admin'], false);

    const body = await request.json();
    const { ativa, trocar_gestor, isento_pagamento } = body;
    const entidadeId = parseInt(params.id);

    if (isNaN(entidadeId)) {
      return NextResponse.json(
        { error: 'ID da entidade inválido' },
        { status: 400 }
      );
    }

    if (typeof ativa !== 'boolean' && typeof isento_pagamento !== 'boolean') {
      return NextResponse.json(
        { error: 'Status ativa ou isento_pagamento deve ser boolean' },
        { status: 400 }
      );
    }

    // Fluxo de isenção isolado (sem alterar ativa)
    if (typeof isento_pagamento === 'boolean' && typeof ativa === 'undefined') {
      const result = await query(
        `UPDATE entidades SET isento_pagamento = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
        [isento_pagamento, entidadeId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entidade não encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, isento_pagamento });
    }

    // Se está reativando E trocando gestor
    if (ativa && trocar_gestor) {
      const novoGestor = trocar_gestor as TrocarGestorInput;

      // Validar campos do novo gestor
      if (!novoGestor.cpf || !novoGestor.nome || !novoGestor.email) {
        return NextResponse.json(
          { error: 'CPF, nome e email do novo gestor são obrigatórios' },
          { status: 400 }
        );
      }

      const cpfLimpo = novoGestor.cpf.replace(/\D/g, '');
      if (!validarCpf(cpfLimpo)) {
        return NextResponse.json(
          { error: 'CPF do novo gestor inválido (deve ter 11 dígitos)' },
          { status: 400 }
        );
      }

      // Buscar dados atuais da entidade
      const entidadeResult = await query(
        `SELECT id, cnpj, responsavel_cpf, responsavel_nome FROM entidades WHERE id = $1`,
        [entidadeId]
      );

      if (entidadeResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entidade não encontrada' },
          { status: 404 }
        );
      }

      const entidade = entidadeResult.rows[0];
      const cpfAntigo = entidade.responsavel_cpf;
      const cnpjLimpo = (entidade.cnpj || '').replace(/\D/g, '');
      const senhaInicial = cnpjLimpo.slice(-6);

      if (!senhaInicial || senhaInicial.length < 6) {
        return NextResponse.json(
          { error: 'CNPJ da entidade inválido para gerar senha inicial' },
          { status: 400 }
        );
      }

      const senhaHash = await bcrypt.hash(senhaInicial, 12);

      // Transaction: trocar gestor + reativar
      // 1. Atualizar dados do responsável na entidade
      await query(
        `UPDATE entidades 
         SET responsavel_cpf = $1, responsavel_nome = $2, responsavel_email = $3, 
             ativa = true, atualizado_em = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [cpfLimpo, novoGestor.nome, novoGestor.email, entidadeId]
      );

      // 2. Desativar usuário antigo (se existir e for diferente do novo)
      if (cpfAntigo && cpfAntigo !== cpfLimpo) {
        await query(
          `UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP 
           WHERE cpf = $1 AND entidade_id = $2 AND tipo_usuario = 'gestor'`,
          [cpfAntigo, entidadeId]
        );

        // Remover senha antiga
        await query(
          `DELETE FROM entidades_senhas WHERE cpf = $1 AND entidade_id = $2`,
          [cpfAntigo, entidadeId]
        );
      }

      // 3. Criar/atualizar novo usuário
      const usuarioExistente = await query(
        `SELECT id FROM usuarios WHERE cpf = $1 AND entidade_id = $2`,
        [cpfLimpo, entidadeId]
      );

      if (usuarioExistente.rows.length > 0) {
        await query(
          `UPDATE usuarios 
           SET nome = $1, email = $2, tipo_usuario = 'gestor', ativo = true, atualizado_em = CURRENT_TIMESTAMP
           WHERE cpf = $3 AND entidade_id = $4`,
          [novoGestor.nome, novoGestor.email, cpfLimpo, entidadeId]
        );
      } else {
        await query(
          `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, entidade_id, ativo, criado_em, atualizado_em)
           VALUES ($1, $2, $3, 'gestor', $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cpfLimpo, novoGestor.nome, novoGestor.email, entidadeId]
        );
      }

      // 4. Criar nova senha com primeira_senha_alterada = false
      await query(
        `INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (cpf) DO UPDATE
         SET entidade_id = EXCLUDED.entidade_id, senha_hash = EXCLUDED.senha_hash, 
             primeira_senha_alterada = false, atualizado_em = CURRENT_TIMESTAMP`,
        [entidadeId, cpfLimpo, senhaHash]
      );

      // Auditoria
      const contexto = extrairContextoRequisicao(request);
      try {
        await registrarAuditoria({
          entidade_tipo: 'tomador',
          entidade_id: entidadeId,
          acao: 'atualizar',
          metadados: {
            operacao: 'trocar_gestor_reativacao',
            tipo_tomador: 'entidade',
            gestor_anterior_cpf: cpfAntigo,
            gestor_anterior_nome: entidade.responsavel_nome,
            novo_gestor_cpf: cpfLimpo,
            novo_gestor_nome: novoGestor.nome,
          },
          ...contexto,
        });
      } catch (err) {
        console.warn('[REATIVAR] Falha ao registrar auditoria:', err);
      }

      console.log(
        `[REATIVAR] Entidade ${entidadeId} reativada com novo gestor CPF ${cpfLimpo}`
      );

      return NextResponse.json({
        success: true,
        entidade: {
          id: entidadeId,
          ativa: true,
        },
        novo_gestor: {
          cpf: cpfLimpo,
          nome: novoGestor.nome,
          email: novoGestor.email,
          login: cpfLimpo,
          senha: senhaInicial,
        },
      });
    }

    // Fluxo padrão: toggle ativa
    const isentoSet =
      typeof isento_pagamento === 'boolean' ? ', isento_pagamento = $3' : '';
    const args: (boolean | number)[] =
      typeof isento_pagamento === 'boolean'
        ? [ativa, entidadeId, isento_pagamento]
        : [ativa, entidadeId];
    const result = await query(
      `UPDATE entidades 
       SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP${isentoSet} 
       WHERE id = $2 
       RETURNING id, nome, cnpj, email, telefone, endereco, ativa, criado_em`,
      args
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    // Sincronizar usuarios.ativo com o novo estado da entidade
    await query(
      `UPDATE usuarios SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE entidade_id = $2 AND tipo_usuario = 'gestor'`,
      [ativa, entidadeId]
    );

    return NextResponse.json({ success: true, entidade: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar entidade:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
