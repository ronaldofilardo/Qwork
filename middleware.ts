import { NextRequest, NextResponse } from 'next/server';

// Rotas que requerem proteção especial
const SENSITIVE_ROUTES = [
  '/api/admin',
  '/api/rh',
  '/api/emissor',
  '/api/entidade',
  '/admin',
  '/rh',
  '/emissor',
  '/entidade',
];

// Rotas específicas para funcionários (não devem ser acessadas por gestores)
const FUNCIONARIO_ROUTES = [
  '/dashboard',
  '/api/avaliacao',
  '/api/dashboard',
  '/avaliacao',
];

// Rotas específicas para gestores RH (clínica)
const RH_ROUTES = ['/rh', '/api/rh'];

// Rotas específicas para gestores de entidade (tomador)
const ENTIDADE_ROUTES = ['/entidade', '/api/entidade'];

// Rotas que requerem MFA (admin)
const MFA_REQUIRED_ROUTES = ['/api/admin/financeiro', '/admin/financeiro'];

// Rotas públicas que não requerem autenticação (mesmo sob /api)
const PUBLIC_API_ROUTES = [
  '/api/planos',
  '/api/contratacao/cadastro-inicial',
  '/api/public',
  '/api/contrato/', // Rotas de visualização de contrato
  '/api/pagamento/iniciar', // Rota de iniciar pagamento (após aceite de contrato)
  '/api/pagamento/gerar-link-plano-fixo', // Gerar link de retry para plano fixo
  '/api/tomador/verificar-pagamento', // Verificar status de pagamento
  '/api/cadastro',
  '/api/auth/login',
  '/api/auth/logout',
];

// Rotas de contratação com controle granular
const CONTRATACAO_ROUTES = {
  // Admin: Gerenciar aprovação de contratações e definir valores (administrativo)
  admin: [
    '/api/admin/contratacao',
    '/api/admin/contratacao/definir-valor',
    '/api/admin/contratacao/rejeitar',
    '/api/admin/contratacao/pendentes',
  ],
  // Gestor de Entidade: Criar e gerenciar próprias contratações
  gestor: [
    '/api/contratacao/personalizado/pre-cadastro',
    '/api/contratacao/personalizado/aceitar-contrato',
    '/api/contratacao/personalizado/cancelar',
  ],
  // Público: Rotas abertas para cadastro inicial
  public: ['/api/planos', '/api/contratacao/cadastro-inicial'],
};

export function middleware(request: NextRequest) {
  // IPs autorizados para acesso admin (lido em tempo de execução)
  const AUTHORIZED_ADMIN_IPS =
    process.env.AUTHORIZED_ADMIN_IPS?.split(',') || [];
  const { pathname } = request.nextUrl;
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  // Permitir rotas públicas sem autenticação
  const isPublicRoute = PUBLIC_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar rotas de contratação com controle granular
  const isContratacaoRoute =
    pathname.startsWith('/api/contratacao') ||
    pathname.startsWith('/api/admin/contratacao');

  if (isContratacaoRoute) {
    const sessionCookie = request.cookies.get('bps-session')?.value;

    // Rotas públicas de contratação
    if (CONTRATACAO_ROUTES.public.some((route) => pathname.startsWith(route))) {
      // Permitir acesso sem autenticação
      return NextResponse.next();
    }

    // Permitir injeção de sessão via header em dev/test para facilitar testes automáticos
    let session: any = null;
    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
      } catch (err) {
        console.error(
          '[SECURITY] Sessão inválida na cookie de contratação',
          err
        );
        return new NextResponse('Sessão inválida', { status: 401 });
      }
    } else {
      const mockHeader = request.headers.get('x-mock-session');
      if (
        mockHeader &&
        (process.env.NODE_ENV === 'test' ||
          process.env.NODE_ENV === 'development')
      ) {
        try {
          session = JSON.parse(mockHeader);
          console.log(
            '[DEBUG] middleware using x-mock-session (contratacao route):',
            {
              pathname,
              session: session?.cpf,
            }
          );
        } catch (err) {
          console.error(
            '[SECURITY] Invalid x-mock-session header for contratacao route'
          );
          return new NextResponse('Sessão inválida', { status: 401 });
        }
      }
    }

    // Rotas requerem autenticação
    if (!session) {
      console.error(
        `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
      );
      return new NextResponse('Autenticação requerida', { status: 401 });
    }

    try {
      // Verificar permissões específicas por role
      if (session.perfil === 'admin') {
        // Admin tem acesso a rotas admin de contratação
        if (
          CONTRATACAO_ROUTES.admin.some((route) => pathname.startsWith(route))
        ) {
          return NextResponse.next();
        }
      } else if (session.perfil === 'gestor') {
        // Gestor de entidade tem acesso limitado
        if (
          CONTRATACAO_ROUTES.gestor.some((route) => pathname.startsWith(route))
        ) {
          return NextResponse.next();
        }
      }

      // Se chegou aqui, não tem permissão
      console.error(
        `[SECURITY] Acesso negado para ${session.perfil} em ${pathname}`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    } catch (error) {
      console.error('[SECURITY] Erro ao validar sessão de contratação:', error);
      return new NextResponse('Sessão inválida', { status: 401 });
    }
  }

  // Proteção para rotas sensíveis
  if (SENSITIVE_ROUTES.some((route) => pathname.startsWith(route))) {
    // Verificar se é rota admin e IP não autorizado
    if (pathname.startsWith('/api/admin') && AUTHORIZED_ADMIN_IPS.length > 0) {
      if (!AUTHORIZED_ADMIN_IPS.includes(clientIP)) {
        console.error(
          `[SECURITY] Acesso negado a ${pathname} de IP não autorizado: ${clientIP}`
        );
        return new NextResponse('Acesso negado', { status: 403 });
      }
    }

    // Para outras rotas sensíveis, verificar se há cookie de sessão
    // Nota: Não podemos chamar getSession() aqui pois é assíncrono
    const sessionCookie = request.cookies.get('bps-session')?.value;
    let session: any = null;

    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
      } catch (err) {
        console.error('[SECURITY] Sessão inválida no cookie:', err);
        return new NextResponse('Sessão inválida', { status: 401 });
      }
    } else {
      const mockHeader = request.headers.get('x-mock-session');
      if (
        mockHeader &&
        (process.env.NODE_ENV === 'test' ||
          process.env.NODE_ENV === 'development')
      ) {
        try {
          session = JSON.parse(mockHeader);
          console.log(
            '[DEBUG] middleware using x-mock-session (sensitive route):',
            {
              pathname,
              session: session?.cpf,
            }
          );
        } catch (err) {
          console.error(
            '[SECURITY] Invalid x-mock-session header for sensitive route'
          );
          return new NextResponse('Sessão inválida', { status: 401 });
        }
      }
    }

    if (!session) {
      console.error(
        `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
      );
      return new NextResponse('Autenticação requerida', { status: 401 });
    }

    // Verificar MFA para rotas críticas
    if (MFA_REQUIRED_ROUTES.some((route) => pathname.startsWith(route))) {
      try {
        if (session.perfil === 'admin' && !session.mfaVerified) {
          const maskedCpf =
            typeof session.cpf === 'string'
              ? `***${String(session.cpf).slice(-4)}`
              : session.cpf;
          console.error(
            `[SECURITY] Admin ${maskedCpf} tentou acessar ${pathname} sem MFA verificado`
          );
          return NextResponse.json(
            {
              error: 'MFA_REQUIRED',
              message: 'Autenticação de dois fatores requerida',
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('[SECURITY] Erro ao validar MFA:', error);
        return new NextResponse('Sessão inválida', { status: 401 });
      }
    }
  }

  // Verificações adicionais de segregação de funções
  // Impedir que gestores acessem rotas de funcionários
  if (FUNCIONARIO_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get('bps-session')?.value;
    let session: any = null;

    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
      } catch (err) {
        console.error(
          '[SECURITY] Sessão inválida na verificação de perfil:',
          err
        );
        return new NextResponse('Sessão inválida', { status: 401 });
      }
    }

    if (session) {
      // Se o usuário tem perfil de gestor, redirecionar para sua rota apropriada
      if (session.perfil === 'rh') {
        const maskedCpf =
          typeof session.cpf === 'string'
            ? `***${String(session.cpf).slice(-4)}`
            : session.cpf;
        console.error(
          `[SECURITY] Gestor RH ${maskedCpf} tentou acessar rota de funcionário ${pathname}, redirecionando para /rh`
        );
        return NextResponse.redirect(new URL('/rh', request.url));
      } else if (session.perfil === 'gestor') {
        const maskedCpf =
          typeof session.cpf === 'string'
            ? `***${String(session.cpf).slice(-4)}`
            : session.cpf;
        console.error(
          `[SECURITY] Gestor de entidade ${maskedCpf} tentou acessar rota de funcionário ${pathname}, redirecionando para /entidade`
        );
        return NextResponse.redirect(new URL('/entidade', request.url));
      }
      // Funcionários podem acessar normalmente
    }
  }

  // Verificação de segregação: apenas RH acessa rotas RH
  if (RH_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get('bps-session')?.value;
    let session: any = null;

    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
        // Sanitize session for logging: remove sensitive tokens and internal fields
        const filteredKeys = Object.keys(session || {}).filter(
          (k) => !['sessionToken', 'lastRotation'].includes(k)
        );
        const sanitizedSession: Record<string, any> = {};
        for (const k of filteredKeys) {
          sanitizedSession[k] =
            k === 'cpf' && typeof session[k] === 'string'
              ? `***${String(session[k]).slice(-4)}`
              : session[k];
        }

        console.log('[DEBUG] RH Route check:', {
          pathname,
          sessionPerfil: sanitizedSession?.perfil,
          sessionCpf: sanitizedSession?.cpf,
          sessionKeys: filteredKeys,
          session: sanitizedSession,
        });
      } catch (err) {
        console.error('[SECURITY] Erro ao parsear sessão RH:', err);
      }
    }

    // APENAS perfil 'rh' pode acessar rotas /rh e /api/rh
    // gestor deve usar /entidade e /api/entidade
    if (session && session.perfil !== 'rh') {
      const maskedCpf =
        typeof session.cpf === 'string'
          ? `***${String(session.cpf).slice(-4)}`
          : session.cpf;
      console.error(
        `[SECURITY] Usuário com perfil ${session.perfil} (${maskedCpf}) tentou acessar rota RH ${pathname}. Apenas gestores RH (clínica) têm acesso.`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  if (ENTIDADE_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get('bps-session')?.value;
    let session: any = null;

    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie);
      } catch (err) {
        // Já tratado acima
      }
    }

    if (session && session.perfil !== 'gestor') {
      const maskedCpf =
        typeof session.cpf === 'string'
          ? `***${String(session.cpf).slice(-4)}`
          : session.cpf;
      console.error(
        `[SECURITY] Usuário com perfil ${session.perfil} (${maskedCpf}) tentou acessar rota de entidade ${pathname}`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/rh/:path*',
    '/emissor/:path*',
    '/entidade/:path*',
    '/dashboard/:path*',
    '/avaliacao/:path*',
  ],
};
