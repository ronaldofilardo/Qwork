/**
 * Utilitários de CPF - Conformidade LGPD
 *
 * Funções para validação rigorosa e mascaramento de CPF
 * conforme Art. 6º da LGPD (princípios da qualidade e necessidade)
 */

/**
 * Valida CPF com verificação completa dos dígitos verificadores
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove formatação
  const cpfLimpo = cpf.replace(/[^\d]/g, '');

  // Verifica tamanho
  if (cpfLimpo.length !== 11) return false;

  // CPFs inválidos conhecidos
  const cpfsInvalidos = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ];

  if (cpfsInvalidos.includes(cpfLimpo)) return false;

  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;

  if (digito1 !== parseInt(cpfLimpo.charAt(9))) return false;

  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;

  if (digito2 !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

/**
 * Mascara CPF para exibição segura (LGPD Art. 6º, III - Necessidade)
 * Exibe apenas os últimos 4 dígitos
 * @param cpf - CPF com ou sem formatação
 * @returns CPF mascarado no formato ***.***.***-XX
 */
export function mascararCPF(cpf: string): string {
  if (!cpf) return '***.***.***-**';

  const cpfLimpo = cpf.replace(/[^\d]/g, '');

  if (cpfLimpo.length !== 11) return '***.***.***-**';

  return `***.***.*${cpfLimpo.slice(7, 9)}-${cpfLimpo.slice(9, 11)}`;
}

/**
 * Mascara CPF para logs (exibe apenas últimos 4 dígitos sem formatação)
 * @param cpf - CPF com ou sem formatação
 * @returns CPF parcialmente mascarado: *******1234
 */
export function mascararCPFParaLog(cpf: string): string {
  if (!cpf) return '*******0000';

  const cpfLimpo = cpf.replace(/[^\d]/g, '');

  if (cpfLimpo.length !== 11) return '*******0000';

  return `*******${cpfLimpo.slice(-4)}`;
}

/**
 * Formata CPF com pontuação padrão (sem mascaramento)
 * ATENÇÃO: Use apenas em contextos autorizados (administração)
 * @param cpf - CPF sem formatação
 * @returns CPF formatado: 123.456.789-00
 */
export function formatarCPF(cpf: string): string {
  if (!cpf) return '';

  const cpfLimpo = cpf.replace(/[^\d]/g, '');

  if (cpfLimpo.length !== 11) return cpf;

  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Remove formatação do CPF
 * @param cpf - CPF com formatação
 * @returns CPF apenas com números
 */
export function limparCPF(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
}

/**
 * Valida e retorna CPF limpo ou null se inválido
 * @param cpf - CPF com ou sem formatação
 * @returns CPF limpo se válido, null se inválido
 */
export function validarELimparCPF(cpf: string): string | null {
  const cpfLimpo = limparCPF(cpf);
  return validarCPF(cpfLimpo) ? cpfLimpo : null;
}

/**
 * Gera identificador anônimo baseado em CPF
 * Útil para relatórios agregados mantendo a distinção entre indivíduos
 * @param cpf - CPF sem formatação
 * @returns Hash MD5 truncado (8 caracteres)
 */
export function gerarIdentificadorAnonimo(cpf: string): string {
  if (!cpf) return 'ANON0000';

  const cpfLimpo = limparCPF(cpf);

  // Simples hash para identificação (não é criptografia forte, apenas ofuscação)
  let hash = 0;
  for (let i = 0; i < cpfLimpo.length; i++) {
    const char = cpfLimpo.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `ANON${Math.abs(hash).toString().padStart(8, '0').slice(0, 8)}`;
}

/**
 * Interface para dados de auditoria LGPD
 */
export interface DadosAuditoriaLGPD {
  cpf_mascarado: string;
  data_acesso: string;
  ip_origem?: string;
  acao: string;
  base_legal?:
    | 'contrato'
    | 'obrigacao_legal'
    | 'consentimento'
    | 'interesse_legitimo';
}

/**
 * Prepara dados de CPF para log de auditoria LGPD
 * @param cpf - CPF completo
 * @param acao - Ação realizada
 * @param ipOrigem - IP do usuário (opcional)
 * @param baseLegal - Base legal do tratamento
 * @returns Objeto com dados mascarados para auditoria
 */
export function prepararLogAuditoria(
  cpf: string,
  acao: string,
  ipOrigem?: string,
  baseLegal?: DadosAuditoriaLGPD['base_legal']
): DadosAuditoriaLGPD {
  return {
    cpf_mascarado: mascararCPFParaLog(cpf),
    data_acesso: new Date().toISOString(),
    ip_origem: ipOrigem,
    acao,
    base_legal: baseLegal,
  };
}

/**
 * Extrai IP do request (Next.js)
 * @param request - NextRequest
 * @returns IP do cliente
 */
export function extrairIP(request: Request): string | undefined {
  // Tenta headers comuns de proxy
  const headers = request.headers;

  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    undefined
  );
}

/**
 * Valida formato de email
 * @param email - Email para validar
 * @returns true se válido
 */
export function validarEmail(email: string): boolean {
  if (!email) return false;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 100;
}

/**
 * Sanitiza nome (remove caracteres especiais, limita tamanho)
 * @param nome - Nome completo
 * @returns Nome sanitizado
 */
export function sanitizarNome(nome: string): string {
  if (!nome) return '';

  return nome
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres perigosos
    .slice(0, 100); // Limita tamanho
}
