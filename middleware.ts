import { NextRequest, NextResponse } from 'next/server';

// Rotas que requerem proteção especial
const SENSITIVE_ROUTES = [
  '/api/admin',
  '/api/rh',
  '/api/emissor',
  '/api/entidade',
  '/api/suporte',
  '/api/comercial',
  '/api/vendedor',
  '/admin',
  '/rh',
  '/emissor',
  '/entidade',
  '/suporte',
  '/comercial',
  '/vendedor',
  '/trocar-senha',
];

// Rotas específicas para funcionários (não devem ser acessadas por gestores)
const FUNCIONARIO_ROUTES = [
  '/dashboard',
  '/api/avaliacao',
  '/api/dashboard',
  '/avaliacao',
];

// Rotas que requerem MFA (admin)
const MFA_REQUIRED_ROUTES = ['/api/admin/financeiro', '/admin/financeiro'];

// Rotas públicas que não requerem autenticação (mesmo sob /api)
const PUBLIC_API_ROUTES = [
  '/api/contratacao/cadastro-inicial',
  '/api/public',
  '/api/contrato/', // Rotas de visualização de contrato
  '/api/pagamento/iniciar', // Rota de iniciar pagamento (após aceite de contrato)
  '/api/tomador/verificar-pagamento', // Verificar status de pagamento
  '/api/cadastro',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/trocar-senha', // Troca de senha (sessão verificada internamente)
  '/vendedor/criar-senha', // Página pública de criação de senha (convite por token)
  '/api/vendedor/criar-senha', // API pública de validação/criação de senha via token
  '/representante/criar-senha', // Página pública de criação de senha (convite por token)
  '/api/representante/criar-senha', // API pública de validação/criação de senha via token
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
  gestor: ['/api/contratacao/cadastro-inicial'],
  // Público: Rotas abertas para cadastro inicial
  public: ['/api/contratacao/cadastro-inicial'],
};

/**
 * Strategy table: maps required perfil → route prefixes.
 * Enforces segregation: only the specified perfil can access these routes.
 */
const ROLE_ROUTE_MAP: Record<string, string[]> = {
  rh: ['/rh', '/api/rh'],
  gestor: ['/entidade', '/api/entidade'],
  suporte: ['/suporte', '/api/suporte'],
  comercial: ['/comercial', '/api/comercial'],
  vendedor: ['/vendedor', '/api/vendedor'],
};

/** Redirect destinations for gestores trying to access funcionário routes */
const GESTOR_REDIRECT: Record<string, string> = {
  rh: '/rh',
  gestor: '/entidade',
};

// ─── Session Helpers (Edge Runtime compatible) ─────────────────────

interface MiddlewareSession {
  cpf?: string;
  perfil?: string;
  mfaVerified?: boolean;
  [key: string]: unknown;
}

function maskCpf(cpf: string | undefined): string {
  if (!cpf || typeof cpf !== 'string') return 'unknown';
  return `***${cpf.slice(-4)}`;
}

/**
 * Parse session from cookie or x-mock-session header (dev/test only).
 * Centralised to avoid repeated JSON.parse calls throughout middleware.
 */
function parseSession(request: NextRequest): MiddlewareSession | null {
  const sessionCookie = request.cookies.get('bps-session')?.value;
  if (sessionCookie) {
    try {
      return JSON.parse(sessionCookie);
    } catch (err) {
      console.error('[SECURITY] Sessão inválida no cookie:', err);
      return null;
    }
  }
  const mockHeader = request.headers.get('x-mock-session');
  if (
    mockHeader &&
    (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development')
  ) {
    try {
      return JSON.parse(mockHeader);
    } catch {
      return null;
    }
  }
  return null;
}

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
    if (CONTRATACAO_ROUTES.public.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    const contratacaoSession = parseSession(request);
    if (!contratacaoSession) {
      console.error(
        `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
      );
      return new NextResponse('Autenticação requerida', { status: 401 });
    }

    if (
      contratacaoSession.perfil === 'admin' &&
      CONTRATACAO_ROUTES.admin.some((route) => pathname.startsWith(route))
    ) {
      return NextResponse.next();
    }
    if (
      contratacaoSession.perfil === 'gestor' &&
      CONTRATACAO_ROUTES.gestor.some((route) => pathname.startsWith(route))
    ) {
      return NextResponse.next();
    }

    console.error(
      `[SECURITY] Acesso negado para ${contratacaoSession.perfil} em ${pathname}`
    );
    return new NextResponse('Acesso negado', { status: 403 });
  }

  // ── Parse session ONCE for all remaining checks ──
  const session = parseSession(request);

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

    if (!session) {
      console.error(
        `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
      );
      return new NextResponse('Autenticação requerida', { status: 401 });
    }

    // Verificar MFA para rotas críticas
    if (MFA_REQUIRED_ROUTES.some((route) => pathname.startsWith(route))) {
      if (session.perfil === 'admin' && !session.mfaVerified) {
        console.error(
          `[SECURITY] Admin ${maskCpf(session.cpf)} tentou acessar ${pathname} sem MFA verificado`
        );
        return NextResponse.json(
          {
            error: 'MFA_REQUIRED',
            message: 'Autenticação de dois fatores requerida',
          },
          { status: 403 }
        );
      }
    }
  }

  // ── Funcionário route segregation — block gestores ──
  if (FUNCIONARIO_ROUTES.some((route) => pathname.startsWith(route))) {
    if (session) {
      const redirectTo = GESTOR_REDIRECT[session.perfil as string];
      if (redirectTo) {
        console.error(
          `[SECURITY] ${session.perfil} ${maskCpf(session.cpf)} tentou acessar rota de funcionário ${pathname}, redirecionando para ${redirectTo}`
        );
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }
  }

  // ── Role-based route segregation (Strategy Pattern) ──
  for (const [requiredPerfil, routes] of Object.entries(ROLE_ROUTE_MAP)) {
    if (routes.some((route) => pathname.startsWith(route))) {
      if (session && session.perfil !== requiredPerfil) {
        console.error(
          `[SECURITY] Perfil ${session.perfil} (${maskCpf(session.cpf)}) tentou acessar rota ${requiredPerfil} ${pathname}`
        );
        return new NextResponse('Acesso negado', { status: 403 });
      }
      break;
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
    '/suporte/:path*',
    '/comercial/:path*',
    '/vendedor/:path*',
    '/dashboard/:path*',
    '/avaliacao/:path*',
    '/trocar-senha/:path*',
  ],
};
