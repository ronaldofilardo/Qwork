import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * POST /api/admin/cadastro/rh
 *
 * ❌ BLOQUEADO: Criação de credenciais (login/senha) é EXCLUSIVA DO SISTEMA
 *
 * Fluxo Correto:
 * 1. Admin cadastra uma clínica
 * 2. Clínica confirma pagamento
 * 3. Sistema cria automaticamente:
 *    - Senha em clinicas_senhas
 *    - Usuário RH em usuarios com tipo_usuario='rh'
 *    - Perfil de acesso apropriado
 *
 * NENHUM outro usuário (incluindo admin) pode criar login/senha manualmente!
 */
export function POST(_request: NextRequest) {
  try {
    const session = getSession();

    // APENAS admin pode usar este endpoint (se estivesse ativo)
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado: apenas admin pode usar este endpoint' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          'Endpoint bloqueado: Criação de credenciais é EXCLUSIVA DO SISTEMA',
        motivo:
          'Criação de login e senha ocorre automaticamente após confirmação de pagamento',
        fluxo_correto: [
          '1. Admin cadastra clínica via POST /api/admin/cadastro/clinica',
          '2. Sistema cria registro em clinicas',
          '3. Clínica confirma pagamento via POST /api/pagamento/confirmar',
          '4. Sistema cria automaticamente:',
          '   - Senha em clinicas_senhas (últimos 6 dígitos do CNPJ)',
          '   - Usuário RH em usuarios com tipo_usuario="rh"',
          '5. RH faz login em POST /api/auth/login com CPF e senha',
        ],
        documentacao: '/docs/FLUXO_APROVACAO_E_LIBERACAO_LOGIN.md',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('[CADASTRO_RH] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
