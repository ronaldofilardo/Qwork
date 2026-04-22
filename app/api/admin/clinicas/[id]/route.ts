import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import bcrypt from 'bcryptjs';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';

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
 * PATCH /api/admin/clinicas/[id]
 * Ativa ou desativa uma clínica pelo ID.
 * Ao reativar, permite opcionalmente trocar o gestor RH.
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
    const clinicaId = parseInt(params.id);

    if (isNaN(clinicaId)) {
      return NextResponse.json(
        { error: 'ID da clínica inválido' },
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
        `UPDATE clinicas SET isento_pagamento = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
        [isento_pagamento, clinicaId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Clínica não encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, isento_pagamento });
    }

    // Se está reativando E trocando gestor
    if (ativa && trocar_gestor) {
      const novoGestor = trocar_gestor as TrocarGestorInput;

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

      // Buscar dados atuais da clínica
      const clinicaResult = await query(
        `SELECT id, cnpj, responsavel_cpf, responsavel_nome FROM clinicas WHERE id = $1`,
        [clinicaId]
      );

      if (clinicaResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Clínica não encontrada' },
          { status: 404 }
        );
      }

      const clinica = clinicaResult.rows[0];
      const cpfAntigo = clinica.responsavel_cpf;
      const cnpjLimpo = (clinica.cnpj || '').replace(/\D/g, '');
      const senhaInicial = cnpjLimpo.slice(-6);

      if (!senhaInicial || senhaInicial.length < 6) {
        return NextResponse.json(
          { error: 'CNPJ da clínica inválido para gerar senha inicial' },
          { status: 400 }
        );
      }

      const senhaHash = await bcrypt.hash(senhaInicial, 12);

      // Verificar unicidade do CPF no sistema (ignora o gestor atual desta clínica se já existir)
      const usuarioAtualResult = await query(
        `SELECT id FROM usuarios WHERE cpf = $1 AND clinica_id = $2 AND tipo_usuario = 'rh'`,
        [cpfLimpo, clinicaId]
      );
      const cpfCheck = await checkCpfUnicoSistema(cpfLimpo, {
        ignorarUsuarioId: usuarioAtualResult.rows[0]?.id,
      });
      if (!cpfCheck.disponivel) {
        return NextResponse.json(
          { error: cpfCheck.message ?? 'CPF já cadastrado no sistema' },
          { status: 409 }
        );
      }

      // 1. Atualizar dados do responsável na clínica
      await query(
        `UPDATE clinicas 
         SET responsavel_cpf = $1, responsavel_nome = $2, responsavel_email = $3, 
             ativa = true, atualizado_em = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [cpfLimpo, novoGestor.nome, novoGestor.email, clinicaId]
      );

      // 2. Desativar usuário antigo (se existir e for diferente do novo)
      if (cpfAntigo && cpfAntigo !== cpfLimpo) {
        await query(
          `UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP 
           WHERE cpf = $1 AND clinica_id = $2 AND tipo_usuario = 'rh'`,
          [cpfAntigo, clinicaId]
        );

        await query(
          `DELETE FROM clinicas_senhas WHERE cpf = $1 AND clinica_id = $2`,
          [cpfAntigo, clinicaId]
        );
      }

      // 3. Criar/atualizar novo usuário
      const usuarioExistente = await query(
        `SELECT id FROM usuarios WHERE cpf = $1 AND clinica_id = $2`,
        [cpfLimpo, clinicaId]
      );

      if (usuarioExistente.rows.length > 0) {
        await query(
          `UPDATE usuarios 
           SET nome = $1, email = $2, tipo_usuario = 'rh', ativo = true, atualizado_em = CURRENT_TIMESTAMP
           WHERE cpf = $3 AND clinica_id = $4`,
          [novoGestor.nome, novoGestor.email, cpfLimpo, clinicaId]
        );
      } else {
        await query(
          `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
           VALUES ($1, $2, $3, 'rh', $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cpfLimpo, novoGestor.nome, novoGestor.email, clinicaId]
        );
      }

      // 4. Criar nova senha com primeira_senha_alterada = false
      await query(
        `INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (cpf) DO UPDATE
         SET clinica_id = EXCLUDED.clinica_id, senha_hash = EXCLUDED.senha_hash, 
             primeira_senha_alterada = false, atualizado_em = CURRENT_TIMESTAMP`,
        [clinicaId, cpfLimpo, senhaHash]
      );

      // Auditoria
      const contexto = extrairContextoRequisicao(request);
      try {
        await registrarAuditoria({
          entidade_tipo: 'tomador',
          entidade_id: clinicaId,
          acao: 'atualizar',
          metadados: {
            operacao: 'trocar_gestor_reativacao',
            tipo_tomador: 'clinica',
            gestor_anterior_cpf: cpfAntigo,
            gestor_anterior_nome: clinica.responsavel_nome,
            novo_gestor_cpf: cpfLimpo,
            novo_gestor_nome: novoGestor.nome,
          },
          ...contexto,
        });
      } catch (err) {
        console.warn('[REATIVAR] Falha ao registrar auditoria:', err);
      }

      console.log(
        `[REATIVAR] Clínica ${clinicaId} reativada com novo gestor RH CPF ${cpfLimpo}`
      );

      return NextResponse.json({
        success: true,
        clinica: {
          id: clinicaId,
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
        ? [ativa, clinicaId, isento_pagamento]
        : [ativa, clinicaId];
    const result = await query(
      `UPDATE clinicas 
       SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP${isentoSet} 
       WHERE id = $2 
       RETURNING id, nome, cnpj, email, telefone, endereco, ativa, criado_em`,
      args
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    // Sincronizar usuarios.ativo com o novo estado da clínica
    await query(
      `UPDATE usuarios SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE clinica_id = $2 AND tipo_usuario = 'rh'`,
      [ativa, clinicaId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar clínica:', error);
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clinicaId = parseInt(params.id);

    if (isNaN(clinicaId)) {
      return NextResponse.json(
        { error: 'ID da clínica inválido' },
        { status: 400 }
      );
    }

    // Verificar se a clínica tem funcionários associados
    const funcionariosResult = await query(
      'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1',
      [clinicaId]
    );

    if (parseInt(funcionariosResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir clínica com funcionários associados' },
        { status: 409 }
      );
    }

    const result = await query(
      'DELETE FROM clinicas WHERE id = $1 RETURNING id',
      [clinicaId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Clínica excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir clínica:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
