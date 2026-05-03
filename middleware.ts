import { NextRequest, NextResponse } from 'next/server';

// ─── Maintenance Mode Check ────────────────────────────────────────────────
/**
 * Verifica se o sistema está em modo de manutenção.
 * Lê variáveis de ambiente:
 *   - MAINTENANCE_MODE_ENABLED: 'true' | 'false'
 *   - MAINTENANCE_START: ISO 8601 string (ex: 2026-04-24T18:00:00Z)
 *   - MAINTENANCE_END: ISO 8601 string (ex: 2026-04-27T08:00:00Z)
 *
 * Fallback seguro: retorna false se variáveis malformadas
 */
function isUnderMaintenance(): boolean {
  // ✅ MANUTENÇÃO DESABILITADA — 26 de abril de 2026
  // Sistema liberado para uso. Manutenção concluída.
  return false;
}

/**
 * Verifica se a requisição tem o cookie de bypass de manutenção válido.
 * Permite que devs acessem o sistema durante manutenção sem afetar usuários reais.
 * Token definido via env var MAINTENANCE_BYPASS_TOKEN no Vercel.
 */
function hasMaintenanceBypass(request: NextRequest): boolean {
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (!bypassToken) return false;

  const cookieValue = request.cookies.get('maintenance_bypass')?.value;
  if (!cookieValue) return false;

  // Comparação de tempo constante para evitar timing attacks
  if (cookieValue.length !== bypassToken.length) return false;
  let valid = true;
  for (let i = 0; i < bypassToken.length; i++) {
    if (cookieValue.charCodeAt(i) !== bypassToken.charCodeAt(i)) valid = false;
  }
  return valid;
}

/**
 * Verifica se o IP está na whitelist de IPs de desenvolvedor.
 * Durante manutenção, IPs autorizados podem acessar normalmente.
 */
function isDeveloperIP(clientIP: string): boolean {
  // Whitelist de IPs de dev autorizados durante manutenção
  // Configurar via env var MAINTENANCE_DEV_IPS (CSV): "1.2.3.4,5.6.7.8"
  const envIPs = process.env.MAINTENANCE_DEV_IPS ?? '';
  const DEVELOPER_IPS = envIPs
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  return DEVELOPER_IPS.includes(clientIP);
}

// ─── Rate Limiting — Dual Strategy (Edge Runtime compatible) ─────────────────
//
// Estratégia dupla implementada no Edge (in-memory, sem DB):
//   1. Auth routes (/api/auth/login): por IP — strict (brute-force)
//   2. Rotas autenticadas: por USUÁRIO (quota individual) + por IP (cap de rede)
//   3. Rotas públicas não-auth: por IP
//
// Problema resolvido: 10 usuários na mesma rede WiFi compartilhavam o mesmo
// limite de IP (200 req/15min total ≈ 20 req/usuário). Com dual-key, cada
// usuário autenticado recebe quota própria (300 req/15min).
//
// Nota: armazenamento in-memory é válido no Edge Runtime do Vercel (V8 isolate
// persistido por região). Para environments multi-região, considere Upstash Redis.

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup periódico (a cada 1000 chamadas para evitar leak de memória)
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

/**
 * Hash simples (djb2) para identificar usuário sem expor dados sensíveis.
 * Não é criptograficamente seguro — uso exclusivo para chaves de rate limit.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // mantém 32-bit
  }
  return Math.abs(hash).toString(16);
}

function checkEntryLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
  now: number
): NextResponse | null {
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

/**
 * Dual rate limiting:
 *   - userId presente → verifica quota individual do usuário E cap de IP
 *   - userId ausente  → verifica somente quota de IP (unauthenticated)
 *   - rota de login   → verifica somente quota de IP (strict, brute-force)
 */
function checkRateLimit(
  ip: string,
  pathname: string,
  userId?: string
): NextResponse | null {
  cleanupStore();
  const now = Date.now();

  // Login: IP-based estrito para prevenir brute-force de qualquer rede
  if (pathname.startsWith('/api/auth/login')) {
    return checkEntryLimit(`rl:ip:auth:${ip}`, 5 * 60 * 1000, 10, now);
  }

  if (userId) {
    // Usuário autenticado: quota isolada por usuário (300 req/15min)
    const userResult = checkEntryLimit(
      `rl:user:${userId}`,
      15 * 60 * 1000,
      300,
      now
    );
    if (userResult) return userResult;

    // Cap adicional por IP (600 req/15min) — impede que uma rede abuse
    // mesmo com múltiplas contas; o limite por IP é 2× o individual
    return checkEntryLimit(`rl:ip:api:${ip}`, 15 * 60 * 1000, 600, now);
  }

  // Público não autenticado: IP-based (200 req/15min)
  return checkEntryLimit(`rl:ip:api:${ip}`, 15 * 60 * 1000, 200, now);
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

// Rotas públicas que não requerem autenticação (mesmo sob /api)
const PUBLIC_API_ROUTES = [
  '/api/contratacao/cadastro-inicial',
  '/api/public',
  '/api/contrato/', // Rotas de visualização de contrato
  '/api/pagamento/iniciar', // Rota de iniciar pagamento (após aceite de contrato)
  '/api/pagamento/asaas/criar', // Checkout Asaas — acessado de páginas públicas de pagamento via token
  '/api/tomador/verificar-pagamento', // Verificar status de pagamento
  '/api/cadastro',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/trocar-senha', // Troca de senha (sessão verificada internamente)
  '/vendedor/criar-senha', // Página pública de criação de senha (convite por token)
  '/api/vendedor/criar-senha', // API pública de validação/criação de senha via token
  '/representante/criar-senha', // Página pública de criação de senha (convite por token)
  '/api/representante/criar-senha', // API pública de validação/criação de senha via token
  '/resetar-senha', // Página pública de reset de senha via link enviado pelo admin
  '/api/admin/reset-senha/validar', // API pública de validação de token de reset
  '/api/admin/reset-senha/confirmar', // API pública para confirmar nova senha via token
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

function shouldLogUnauthenticatedAccess(
  request: NextRequest,
  pathname: string
): boolean {
  const method = request.method.toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  return (
    pathname.startsWith('/api/') ||
    isMutation ||
    process.env.DEBUG_MIDDLEWARE === 'true'
  );
}

/**
 * Parse session from cookie or x-mock-session header (dev/test only).
 * Centralised to avoid repeated JSON.parse calls throughout middleware.
 */
function parseSession(request: NextRequest): MiddlewareSession | null {
  const parseValue = (rawValue: string): MiddlewareSession | null => {
    try {
      const parsed: unknown = JSON.parse(rawValue);
      if (parsed && typeof parsed === 'object') {
        return parsed as MiddlewareSession;
      }
      return null;
    } catch {
      return null;
    }
  };

  const sessionCookie = request.cookies.get('bps-session')?.value;
  if (sessionCookie) {
    const parsed = parseValue(sessionCookie);
    if (parsed) {
      return parsed;
    }
    console.error('[SECURITY] Sessão inválida no cookie.');
    return null;
  }

  // Mock header É permitido APENAS em desenvolvimento local e testes (não em production)
  const mockHeader = request.headers.get('x-mock-session');
  if (mockHeader && process.env.NODE_ENV !== 'production') {
    return parseValue(mockHeader);
  }
  return null;
}

export function middleware(request: NextRequest) {
  // ── Extract client IP FIRST (needed for maintenance and developer checks) ──
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  // ── MAINTENANCE MODE CHECK — FIRST (before everything else) ──
  // But allow: bypass cookie, developer IPs, or /maintenance page itself
  if (
    isUnderMaintenance() &&
    !hasMaintenanceBypass(request) &&
    !isDeveloperIP(clientIP)
  ) {
    const { pathname } = request.nextUrl;

    // Exceções: /maintenance itself (não redirecionar, deixar renderizar)
    // e _next/* (assets estáticos necessários para a página)
    if (pathname === '/maintenance' || pathname.startsWith('/_next/')) {
      return NextResponse.next();
    }

    // Redirecionar todos os outros requests para /maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // IPs autorizados para acesso admin (lido em tempo de execução)
  const AUTHORIZED_ADMIN_IPS =
    process.env.AUTHORIZED_ADMIN_IPS?.split(',') || [];
  const { pathname } = request.nextUrl;

  // ── Rate Limiting Global (dual-key: IP + usuário autenticado) ──
  // Parse antecipado de sessão para extrair userId sem duplo parse.
  // Não interfere nas verificações de Auth/MFA que ocorrem mais abaixo.
  if (pathname.startsWith('/api/')) {
    const earlySession = parseSession(request);
    const userId = earlySession?.cpf ? simpleHash(earlySession.cpf) : undefined;
    const rateLimitResponse = checkRateLimit(clientIP, pathname, userId);
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
      if (shouldLogUnauthenticatedAccess(request, pathname)) {
        console.warn(
          `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
        );
      }
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
      if (shouldLogUnauthenticatedAccess(request, pathname)) {
        console.warn(
          `[SECURITY] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
        );
      }
      return new NextResponse('Autenticação requerida', { status: 401 });
    }

    // TODO: Verificar MFA para rotas críticas — desabilitado até a feature de MFA
    // ser completamente implementada (envio de código, rota de challenge, UI de verificação).
    // const shouldEnforceMfaInThisEnv = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  }

  // ── Funcionário route segregation — block gestores ──
  if (FUNCIONARIO_ROUTES.some((route) => pathname.startsWith(route))) {
    if (session) {
      const redirectTo = GESTOR_REDIRECT[session.perfil];
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

  // Edge Runtime: aplicar headers de segurança sempre (não verificar NODE_ENV dinamicamente)
  // Em produção, ativar HSTS e CSP mais restritivo
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' *.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:"
  );

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
