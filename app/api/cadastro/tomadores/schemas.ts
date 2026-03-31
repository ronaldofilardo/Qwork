/**
 * app/api/cadastro/tomadores/schemas.ts
 *
 * Schemas de validação Zod + funções de validação de documentos
 * para o cadastro de tomadores (entidades/clínicas).
 */

import { z } from 'zod';

// ============================================================================
// VALIDADORES DE DOCUMENTOS
// ============================================================================

/** Valida CNPJ com dígitos verificadores */
export function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return digito1 === parseInt(cnpj[12]) && digito2 === parseInt(cnpj[13]);
}

/** Valida CPF com dígitos verificadores */
export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return digito1 === parseInt(cpf[9]) && digito2 === parseInt(cpf[10]);
}

/** Valida formato básico de email */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ============================================================================
// SCHEMA ZOD PARA CAMPOS DO FORMULÁRIO
// ============================================================================

export const CadastroTomadorSchema = z.object({
  tipo: z.enum(['entidade', 'clinica']).default('entidade'),
  nome: z
    .string()
    .min(3, 'Nome/Razão Social é obrigatório (mínimo 3 caracteres)'),
  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine(validarCNPJ, { message: 'CNPJ inválido' }),
  inscricao_estadual: z.string().nullable().optional(),
  email: z.string().refine(validarEmail, { message: 'Email inválido' }),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
  cep: z.string().min(1, 'CEP é obrigatório'),
  plano_id: z.number().int().positive('Plano inválido').nullable().optional(),
  numero_funcionarios_estimado: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  responsavel_nome: z.string().min(1, 'Nome do responsável é obrigatório'),
  responsavel_cpf: z
    .string()
    .refine(validarCPF, { message: 'CPF do responsável inválido' }),
  responsavel_cargo: z.string().nullable().optional(),
  responsavel_email: z
    .string()
    .refine(validarEmail, { message: 'Email do responsável inválido' }),
  responsavel_celular: z
    .string()
    .min(1, 'Celular do responsável é obrigatório'),
  codigo_representante: z.string().max(20).optional(),
});

export type CadastroTomadorInput = z.infer<typeof CadastroTomadorSchema>;

// ============================================================================
// VALIDAÇÃO DE ARQUIVOS
// ============================================================================

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface CadastroArquivos {
  cartao_cnpj: File;
  contrato_social: File;
  doc_identificacao: File;
}

export interface ArquivosValidationResult {
  success: boolean;
  error?: string;
  files?: CadastroArquivos;
}

/** Valida os 3 arquivos obrigatórios (tipo + tamanho) */
export function validarArquivos(
  cartao_cnpj: File | null,
  contrato_social: File | null,
  doc_identificacao: File | null
): ArquivosValidationResult {
  if (!cartao_cnpj || !contrato_social || !doc_identificacao) {
    return {
      success: false,
      error:
        'Todos os anexos são obrigatórios (Cartão CNPJ, Contrato Social, Doc Identificação)',
    };
  }

  if (
    !ALLOWED_FILE_TYPES.includes(cartao_cnpj.type) ||
    !ALLOWED_FILE_TYPES.includes(contrato_social.type) ||
    !ALLOWED_FILE_TYPES.includes(doc_identificacao.type)
  ) {
    return { success: false, error: 'Arquivos devem ser PDF, JPG ou PNG' };
  }

  if (
    cartao_cnpj.size > MAX_FILE_SIZE ||
    contrato_social.size > MAX_FILE_SIZE ||
    doc_identificacao.size > MAX_FILE_SIZE
  ) {
    return { success: false, error: 'Arquivos não podem exceder 5MB' };
  }

  return {
    success: true,
    files: { cartao_cnpj, contrato_social, doc_identificacao },
  };
}

// ============================================================================
// HELPER: EXTRAIR DADOS DO FORMDATA
// ============================================================================

/** Extrai campos tipados do FormData para validação Zod */
export function extractFormDataFields(
  formData: FormData
): Record<string, unknown> {
  const str = (key: string) => formData.get(key) as string | null;
  const planoIdStr = str('plano_id');
  const numFuncStr = str('numero_funcionarios_estimado');

  return {
    tipo: str('tipo') || 'entidade',
    nome: str('nome') || '',
    cnpj: str('cnpj') || '',
    inscricao_estadual: str('inscricao_estadual') || null,
    email: str('email') || '',
    telefone: str('telefone') || '',
    endereco: str('endereco') || '',
    cidade: str('cidade') || '',
    estado: str('estado') || '',
    cep: str('cep') || '',
    plano_id: planoIdStr ? parseInt(planoIdStr) : null,
    numero_funcionarios_estimado: numFuncStr ? parseInt(numFuncStr) : null,
    responsavel_nome: str('responsavel_nome') || '',
    responsavel_cpf: str('responsavel_cpf') || '',
    responsavel_cargo: str('responsavel_cargo') || null,
    responsavel_email: str('responsavel_email') || '',
    responsavel_celular: str('responsavel_celular') || '',
    codigo_representante: str('codigo_representante') || undefined,
  };
}
