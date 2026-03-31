export interface EmpresaShort {
  id: number;
  nome: string;
}

export interface EntidadeLiberarResponse {
  success: boolean;
  message?: string;
  resultados?: {
    empresaId: number;
    empresaNome: string;
    created: boolean;
    loteId?: number;
    codigo?: string;
    numero_ordem?: number;
    avaliacoesCriadas?: number;
    funcionariosConsiderados?: number;
    message?: string;
  }[];
}

export interface LiberarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId?: number;
  empresaNome?: string;
  onSuccess?: (loteId: number) => void;
  mode?: 'rh' | 'entidade';
}
