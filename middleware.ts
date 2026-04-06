import { NextRequest, NextResponse } from 'next/server';

// ─── Rate Limiting (Edge Runtime compatible) ──────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Limpar store periodicamente (a cada 1000 requests)
let requestCounter = 0;
function cleanupStore(): void {
  requestCounter++;
  if (requestCounter % 1000 === 0) {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(ip: string, pathname: string): NextResponse | null {
  cleanupStore();
  const now = Date.now();

  // Configurações por tipo de rota
  const isWriteMethod = false; // Será checado no caller com method
  const isAuthRoute = pathname.startsWith('/api/auth/login');
  const windowMs = isAuthRoute ? 5 * 60 * 1000 : 15 * 60 * 1000;
  const maxRequests = isAuthRoute ? 10 : 200;

  const key = `rl:${ip}:${isAuthRoute ? 'auth' : 'api'}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  record.count++;
  return null;
}

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

  // ── Rate Limiting Global (todas as rotas /api) ──
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = checkRateLimit(clientIP, pathname);
    if (rateLimitResponse) return rateLimitResponse;
  }

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

  const response = NextResponse.next();

  // ── Security Headers ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' *.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:"
    );
  }

  return response;
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
