/**
 * Validadores de autenticação — extraído de app/api/auth/login/helpers.ts
 * Responsabilidade: lógica de validação de senha de funcionário (reutilizável)
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';
import { registrarAuditoria } from '@/lib/auditoria/auditoria';

type ContextoRequisicao = Record<string, unknown>;

/**
 * Valida senha de funcionário via data de nascimento.
 * Retorna null se válida (continue o login), ou NextResponse de erro.
 */
export async function validarSenhaFuncionario(
  senhaHash: string | null,
  data_nascimento: string,
  senha: string | undefined,
  cpf: string,
  tomadorId: number | null,
  tipoUsuario: string,
  contextoRequisicao: ContextoRequisicao
): Promise<NextResponse | null> {
  if (!senhaHash) {
    console.error(
      `[LOGIN] senhaHash não encontrado para funcionário CPF ${cpf}`
    );
    return NextResponse.json(
      { error: 'Configuração de senha inválida. Contate o administrador.' },
      { status: 500 }
    );
  }

  console.log(
    '[LOGIN] Funcionário com data de nascimento - validando contra hash armazenado'
  );

  try {
    const senhaEsperada = gerarSenhaDeNascimento(data_nascimento);
    console.log(
      '[LOGIN] Senha gerada a partir de data_nascimento, comparando hash...'
    );
    console.log(`[LOGIN] DEBUG - senhaEsperada: ${senhaEsperada}`);
    console.log(
      `[LOGIN] DEBUG - senhaHash existe: ${!!senhaHash}, primeiros 10 chars: ${senhaHash?.substring(0, 10)}`
    );

    const senhaValida = await bcrypt.compare(senhaEsperada, senhaHash);
    console.log(`[LOGIN] Senha válida: ${senhaValida}`);

    if (!senhaValida) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: tomadorId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: {
            motivo: 'data_nascimento_invalida',
            tipo_usuario: tipoUsuario,
          },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (data_nascimento_invalida):',
          err
        );
      }
      return NextResponse.json(
        { error: 'Data de nascimento inválida' },
        { status: 401 }
      );
    }

    return null; // Válida — prosseguir com criação de sessão
  } catch (error) {
    console.error(
      '[LOGIN] Erro ao gerar/validar senha de data_nascimento:',
      error
    );
    console.warn(
      '[LOGIN] ⚠️ Data de nascimento inválida ou em formato inválido no banco. Tentando login com senha normal se disponível...'
    );

    if (senha && senhaHash) {
      console.log(
        '[LOGIN] Tentando validação com senha normal após falha em data_nascimento...'
      );
      try {
        const senhaValida = await bcrypt.compare(senha, senhaHash);
        if (senhaValida) {
          console.log(
            '[LOGIN] Login bem-sucedido com senha normal (fallback após erro em data_nascimento)'
          );
          return null; // válida via fallback
        } else {
          return NextResponse.json(
            { error: 'Senha inválida' },
            { status: 401 }
          );
        }
      } catch (fallbackError) {
        console.error(
          '[LOGIN] Erro no fallback com senha normal:',
          fallbackError
        );
        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            entidade_id: tomadorId,
            acao: 'login_falha',
            usuario_cpf: cpf,
            metadados: {
              motivo: 'data_nascimento_formato_invalido_e_sem_senha',
              tipo_usuario: tipoUsuario,
            },
            ...contextoRequisicao,
          });
        } catch (err) {
          console.warn('[LOGIN] Falha ao registrar auditoria:', err);
        }
        return NextResponse.json(
          {
            error:
              'Data de nascimento em formato inválido ou senha não fornecida',
          },
          { status: 401 }
        );
      }
    } else {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: tomadorId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: {
            motivo: 'data_nascimento_formato_invalido',
            tipo_usuario: tipoUsuario,
          },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn('[LOGIN] Falha ao registrar auditoria:', err);
      }
      return NextResponse.json(
        { error: 'Data de nascimento em formato inválido' },
        { status: 401 }
      );
    }
  }
}
