import type { Parcela } from '@/lib/parcelas-helper';

export type { Parcela };

export interface ContratoPlano {
  tomador_id: number;
  cnpj: string;
  contrato_id: number | null;
  id: number;
  numero_contrato: number;
  tipo_tomador: 'clinica' | 'entidade';
  nome_tomador: string;
  numero_funcionarios_estimado: number | null;
  numero_funcionarios_atual: number | null;
  pagamento_id: number | null;
  pagamento_valor: number | null;
  pagamento_status: string | null;
  modalidade_pagamento: string | null;
  tipo_pagamento: string | null;
  numero_parcelas: number | null;
  parcelas_json: Parcela[] | null;
  valor_pago: number | null;
  status: string;
  data_contratacao: string;
  data_fim_vigencia: string;
  data_pagamento: string | null;
}
