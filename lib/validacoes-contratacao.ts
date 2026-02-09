/**
 * Funções de validação client-side para o fluxo de contratação
 */

// Validação de CNPJ
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false; // Todos dígitos iguais

  // Validação dos dígitos verificadores
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

// Validação de CPF
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimpo)) return false; // Todos dígitos iguais

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(cpfLimpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(cpfLimpo.charAt(10));
}

// Validação de email
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validação de telefone (formato brasileiro)
export function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
}

// Validação de CEP
export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}

// Validação de valor monetário
export function validarValor(valor: number): boolean {
  return valor > 0 && !isNaN(valor);
}

// Validação de plano selecionado
export function validarPlano(planoId: number | null | undefined): boolean {
  return planoId !== null && planoId !== undefined && planoId > 0;
}

// Validação de método de pagamento
export function validarMetodoPagamento(metodo: string | null): boolean {
  return metodo !== null && ['pix', 'boleto', 'cartao'].includes(metodo);
}

// Formatação de CNPJ
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  return cnpjLimpo
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
}

// Formatação de CPF
export function formatarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '').substring(0, 11);
  return cpfLimpo
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formatação de telefone
export function formatarTelefone(telefone: string): string {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (telefoneLimpo.length <= 10) {
    return telefoneLimpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return telefoneLimpo
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

// Formatação de CEP
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
}

// Formatação de valor monetário
export function formatarValor(valor: number): string {
  return valor
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    .replace(' ', '\u00A0');
}

// Validação de campos obrigatórios
export function validarCampoObrigatorio(
  valor: string | null | undefined
): boolean {
  return valor !== null && valor !== undefined && valor.trim().length > 0;
}

// Validação de tamanho mínimo
export function validarTamanhoMinimo(valor: string, tamanho: number): boolean {
  return valor.trim().length >= tamanho;
}

// Validação de arquivo
export function validarArquivo(
  arquivo: File | null,
  tamanhoMaxMB = 5
): boolean {
  if (!arquivo) return false;

  const tamanhoMaxBytes = tamanhoMaxMB * 1024 * 1024;
  return arquivo.size <= tamanhoMaxBytes;
}

// Validação de tipo de arquivo
export function validarTipoArquivo(
  arquivo: File | null,
  tiposPermitidos: string[]
): boolean {
  if (!arquivo) return false;
  return tiposPermitidos.some((tipo) => arquivo.type.includes(tipo));
}

// Mensagens de erro padrão
export const MENSAGENS_ERRO = {
  CNPJ_INVALIDO: 'CNPJ inválido',
  CPF_INVALIDO: 'CPF inválido',
  EMAIL_INVALIDO: 'E-mail inválido',
  TELEFONE_INVALIDO: 'Telefone inválido',
  CEP_INVALIDO: 'CEP inválido',
  CAMPO_OBRIGATORIO: 'Campo obrigatório',
  TAMANHO_MINIMO: (min: number) => `Mínimo de ${min} caracteres`,
  ARQUIVO_TAMANHO: (max: number) => `Arquivo maior que ${max}MB`,
  ARQUIVO_TIPO: 'Tipo de arquivo não permitido',
  PLANO_OBRIGATORIO: 'Selecione um plano',
  METODO_PAGAMENTO_OBRIGATORIO: 'Selecione um método de pagamento',
  VALOR_INVALIDO: 'Valor inválido',
};

// Validação completa de formulário de tomador
export interface ErrosFormulariotomador {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  plano_id?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
  cartao_cnpj?: string;
  contrato_social?: string;
  doc_identificacao?: string;
}

export function validarFormulariotomador(dados: {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  plano_id: number | null;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  responsavel_celular: string;
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}): ErrosFormulariotomador {
  const erros: ErrosFormulariotomador = {};

  // Validar campos de texto obrigatórios
  if (!validarCampoObrigatorio(dados.nome)) {
    erros.nome = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  }

  // Validar CNPJ
  if (!validarCampoObrigatorio(dados.cnpj)) {
    erros.cnpj = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarCNPJ(dados.cnpj)) {
    erros.cnpj = MENSAGENS_ERRO.CNPJ_INVALIDO;
  }

  // Validar email
  if (!validarCampoObrigatorio(dados.email)) {
    erros.email = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarEmail(dados.email)) {
    erros.email = MENSAGENS_ERRO.EMAIL_INVALIDO;
  }

  // Validar telefone
  if (!validarCampoObrigatorio(dados.telefone)) {
    erros.telefone = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarTelefone(dados.telefone)) {
    erros.telefone = MENSAGENS_ERRO.TELEFONE_INVALIDO;
  }

  // Validar endereço
  if (!validarCampoObrigatorio(dados.endereco)) {
    erros.endereco = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  }

  if (!validarCampoObrigatorio(dados.cidade)) {
    erros.cidade = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  }

  if (!validarCampoObrigatorio(dados.estado)) {
    erros.estado = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  }

  // Validar CEP
  if (!validarCampoObrigatorio(dados.cep)) {
    erros.cep = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarCEP(dados.cep)) {
    erros.cep = MENSAGENS_ERRO.CEP_INVALIDO;
  }

  // Validar plano
  if (!validarPlano(dados.plano_id)) {
    erros.plano_id = MENSAGENS_ERRO.PLANO_OBRIGATORIO;
  }

  // Validar responsável
  if (!validarCampoObrigatorio(dados.responsavel_nome)) {
    erros.responsavel_nome = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  }

  // Validar CPF do responsável
  if (!validarCampoObrigatorio(dados.responsavel_cpf)) {
    erros.responsavel_cpf = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarCPF(dados.responsavel_cpf)) {
    erros.responsavel_cpf = MENSAGENS_ERRO.CPF_INVALIDO;
  }

  // Validar email do responsável
  if (!validarCampoObrigatorio(dados.responsavel_email)) {
    erros.responsavel_email = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarEmail(dados.responsavel_email)) {
    erros.responsavel_email = MENSAGENS_ERRO.EMAIL_INVALIDO;
  }

  // Validar celular do responsável
  if (!validarCampoObrigatorio(dados.responsavel_celular)) {
    erros.responsavel_celular = MENSAGENS_ERRO.CAMPO_OBRIGATORIO;
  } else if (!validarTelefone(dados.responsavel_celular)) {
    erros.responsavel_celular = MENSAGENS_ERRO.TELEFONE_INVALIDO;
  }

  // Validar arquivos
  if (!validarArquivo(dados.cartao_cnpj)) {
    erros.cartao_cnpj = 'Anexe o Cartão CNPJ';
  }

  if (!validarArquivo(dados.contrato_social)) {
    erros.contrato_social = 'Anexe o Contrato Social';
  }

  if (!validarArquivo(dados.doc_identificacao)) {
    erros.doc_identificacao = 'Anexe o Documento de Identificação';
  }

  return erros;
}
