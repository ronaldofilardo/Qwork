/**
 * Helper para extrair informações de requisição HTTP
 * Utilizado para auditoria e logging
 */

/**
 * Extrai IP e User-Agent da requisição
 * @param request - Request object do Next.js
 * @returns Objeto com ipAddress e userAgent
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  // Extrair IP (priorizar headers de proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  const xClientIp = request.headers.get('x-client-ip')
  
  let ipAddress: string | null = null
  
  if (forwardedFor) {
    // x-forwarded-for pode conter múltiplos IPs separados por vírgula
    // O primeiro IP é o cliente original
    ipAddress = forwardedFor.split(',')[0].trim()
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp
  } else if (realIp) {
    ipAddress = realIp
  } else if (xClientIp) {
    ipAddress = xClientIp
  }

  // Extrair User-Agent
  const userAgent = request.headers.get('user-agent')

  return {
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  }
}

/**
 * Valida se um IP é válido (IPv4 ou IPv6)
 * @param ip - String de IP para validar
 * @returns true se válido, false caso contrário
 */
export function isValidIP(ip: string): boolean {
  // Regex simplificado para IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  
  // Regex simplificado para IPv6
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

  if (ipv4Regex.test(ip)) {
    // Validar cada octeto (0-255)
    const octets = ip.split('.')
    return octets.every(octet => {
      const num = parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }

  return ipv6Regex.test(ip)
}

/**
 * Sanitiza User-Agent para evitar caracteres maliciosos
 * @param userAgent - String de User-Agent
 * @returns User-Agent sanitizado
 */
export function sanitizeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null

  // Limitar tamanho
  if (userAgent.length > 500) {
    userAgent = userAgent.substring(0, 500)
  }

  // Remover caracteres de controle e não-ASCII problemáticos
  return userAgent.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
}

/**
 * Mascara CPF para exibição em logs (mantém últimos 2 dígitos)
 * @param cpf - CPF a ser mascarado
 * @returns CPF mascarado no formato ***.***.***-XX
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return '***.***.***-**'
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) {
    return '***.***.***-**'
  }
  
  // Retorna apenas os últimos 2 dígitos
  const lastTwo = cleanCPF.slice(-2)
  return `***.***.***-${lastTwo}`
}

/**
 * Formata informações para logging
 * @param ipAddress - IP do cliente
 * @param userAgent - User-Agent do cliente
 * @returns Objeto formatado para log
 */
export function formatRequestInfoForLog(
  ipAddress: string | null,
  userAgent: string | null
): {
  ip: string
  user_agent: string
} {
  return {
    ip: ipAddress || 'unknown',
    user_agent: sanitizeUserAgent(userAgent) || 'unknown'
  }
}
