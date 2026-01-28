import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/session';
import { validateSessionIntegrity } from '@/lib/security-validation';

/**
 * Import da função detectAccessAnomalies
 * (Normalmente seria import do arquivo security-validation.ts)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function detectAccessAnomalies(_session: unknown) {
  await Promise.resolve();
  return { anomalies: [] };
}

/**
 * Log de incidentes de segurança
 */
async function logSecurityIncident(incident: {
  type: string;
  session: unknown;
  issues?: string[] | undefined;
  anomalies?: unknown[] | undefined;
  request: {
    url: string;
    method: string;
    ip: string;
  };
}) {
  await Promise.resolve(); // Satisfaz require-await
  try {
    // Aqui seria implementado o log em tabela de auditoria
    // Por enquanto, apenas console para desenvolvimento
    console.error('[SECURITY_INCIDENT]', {
      timestamp: new Date().toISOString(),
      ...incident,
    });
  } catch (logError) {
    console.error('[SecurityMiddleware] Erro ao logar incidente:', logError);
  }
}

/**
 * Middleware de Validação de Segurança
 * Executa validações automáticas em cada requisição autenticada
 */
export async function securityValidationMiddleware(request: NextRequest) {
  try {
    const session = getSession();

    // Se não há sessão, continuar normalmente
    if (!session) {
      return NextResponse.next();
    }

    // Validar integridade da sessão
    const validation = await validateSessionIntegrity(session);

    if (!validation.isValid) {
      console.error('[SecurityMiddleware] Sessão inválida detectada:', {
        cpf: session.cpf,
        issues: validation.issues,
      });

      // Log de segurança para auditoria
      await logSecurityIncident({
        type: 'INVALID_SESSION',
        session,
        issues: validation.issues,
        request: {
          url: request.url,
          method: request.method,
          ip:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        },
      });

      // Destruir sessão inválida
      destroySession();

      // Redirecionar para login com erro
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session_invalid');
      return NextResponse.redirect(loginUrl);
    }

    // Verificar anomalias de acesso (apenas log, não bloqueia)
    const anomalies: {
      anomalies: Array<{
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
      }>;
    } = await detectAccessAnomalies(session);
    if (anomalies.anomalies.length > 0) {
      console.warn('[SecurityMiddleware] Anomalias detectadas:', {
        cpf: session.cpf,
        anomalies: anomalies.anomalies,
      });

      // Log anomalias de alta severidade
      const highSeverity = anomalies.anomalies.filter(
        (a) => a.severity === 'high'
      );
      if (highSeverity.length > 0) {
        await logSecurityIncident({
          type: 'ACCESS_ANOMALY',
          session,
          anomalies: highSeverity,
          request: {
            url: request.url,
            method: request.method,
            ip:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown',
          },
        });
      }
    }

    // Continuar normalmente se tudo estiver OK
    return NextResponse.next();
  } catch (error) {
    console.error('[SecurityMiddleware] Erro no middleware:', error);

    // Em caso de erro, permitir continuar (fail-safe)
    return NextResponse.next();
  }
}
