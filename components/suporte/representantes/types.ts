export interface Vendedor {
  vendedor_id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  codigo: string | null;
  vinculo_id: number;
  vinculado_em: string;
}

export interface Representante {
  id: number;
  nome: string;
  email: string | null;
  codigo: string | null;
  status: string;
  tipo_pessoa: string | null;
  cpf: string | null;
  cnpj: string | null;
  percentual_comissao: number | null;
  percentual_vendedor_direto: number | null;
  telefone: string | null;
  asaas_wallet_id?: string | null;
  criado_em: string;
  total_vendedores: number;
  vendedores: Vendedor[];
}

export interface DadosBancarios {
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  titular_conta: string | null;
  pix_chave: string | null;
  pix_tipo: string | null;
}

export type DrawerTab = 'dados' | 'vendedores';

export interface FormRepresentante {
  nome: string;
  email: string;
  telefone: string;
  status: string;
  percentual_comissao: string;
  percentual_vendedor_direto: string;
  asaas_wallet_id: string;
}

export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  apto: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  ativo: { label: 'Em Cadastro', cls: 'bg-blue-100 text-blue-700' },
  apto_pendente: {
    label: 'Aguard. Aprovacao',
    cls: 'bg-amber-100 text-amber-700',
  },
  apto_bloqueado: { label: 'Bloqueado', cls: 'bg-orange-100 text-orange-700' },
  suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-700' },
  desativado: { label: 'Desativado', cls: 'bg-gray-100 text-gray-500' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700' },
};

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'apto', label: 'Ativo' },
  { value: 'ativo', label: 'Em Cadastro' },
  { value: 'apto_pendente', label: 'Aguard. Aprovacao' },
  { value: 'apto_bloqueado', label: 'Bloqueado' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'desativado', label: 'Desativado' },
  { value: 'rejeitado', label: 'Rejeitado' },
];

export function fmtCPF(v: string | null): string {
  if (!v) return '-';
  const d = v.replace(/\D/g, '');
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return v;
}

export function fmtCNPJ(v: string | null): string {
  if (!v) return '-';
  const d = v.replace(/\D/g, '');
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}
