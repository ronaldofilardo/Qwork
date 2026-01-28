import { NextRequest } from 'next/server';

interface StructuredLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context: {
    url?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    userCpf?: string;
    userPerfil?: string;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
    additionalData?: unknown;
  };
}

/**
 * Logger estruturado para erros e eventos de segurança
 * Não inclui dados pessoais sensíveis
 */
export class StructuredLogger {
  private static sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

    const sensitiveFields = [
      'password',
      'senha',
      'cpf',
      'email',
      'nome',
      'telefone',
    ];
    const sanitized = { ...(data as Record<string, unknown>) };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  static async logError(
    message: string,
    error: Error,
    request?: NextRequest,
    session?: unknown,
    additionalData?: unknown
  ) {
    await Promise.resolve(); // Satisfaz require-await
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: {
        url: request?.url,
        method: request?.method,
        ip:
          request?.headers.get('x-forwarded-for') ||
          request?.headers.get('x-real-ip') ||
          undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
        userCpf: (session as any)?.cpf ? '[REDACTED]' : undefined,
        userPerfil: (session as any)?.perfil,
        error: {
          name: error.name,
          message: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        additionalData: this.sanitizeData(additionalData),
      },
    };

    // Em produção, enviar para serviço de logging (ex: CloudWatch, DataDog)
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error('[STRUCTURED_LOG]', JSON.stringify(log, null, 2));
    }

    // Opcional: salvar em banco para auditoria
    try {
      // await saveLogToDatabase(log)
    } catch (dbError) {
      console.error('[LOG_ERROR] Falha ao salvar log no banco:', dbError);
    }
  }

  static async logWarn(
    message: string,
    request?: NextRequest,
    session?: unknown,
    additionalData?: unknown
  ) {
    await Promise.resolve(); // Satisfaz require-await
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context: {
        url: request?.url,
        method: request?.method,
        ip:
          request?.headers.get('x-forwarded-for') ||
          request?.headers.get('x-real-ip') ||
          undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
        userCpf: (session as any)?.cpf ? '[REDACTED]' : undefined,
        userPerfil: (session as any)?.perfil,
        additionalData: this.sanitizeData(additionalData),
      },
    };

    console.warn('[STRUCTURED_LOG]', JSON.stringify(log, null, 2));
  }

  static async logInfo(
    message: string,
    request?: NextRequest,
    session?: unknown,
    additionalData?: unknown
  ) {
    await Promise.resolve(); // Satisfaz require-await
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context: {
        url: request?.url,
        method: request?.method,
        ip:
          request?.headers.get('x-forwarded-for') ||
          request?.headers.get('x-real-ip') ||
          undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
        userCpf: (session as any)?.cpf ? '[REDACTED]' : undefined,
        userPerfil: (session as any)?.perfil,
        additionalData: this.sanitizeData(additionalData),
      },
    };

    console.log('[STRUCTURED_LOG]', JSON.stringify(log, null, 2));
  }
}
