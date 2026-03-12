export interface Plano {
  id: number;
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao: string;
  preco: number;
  caracteristicas: any;
  ativo: boolean;
}

export interface PlanoFormData {
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao: string;
  preco: string;
  caracteristicas: string;
  ativo: boolean;
}

export const EMPTY_FORM: PlanoFormData = {
  nome: '',
  tipo: 'fixo',
  descricao: '',
  preco: '',
  caracteristicas: '',
  ativo: true,
};

/**
 * Normaliza 'caracteristicas' (array | object | JSON string) para string[].
 */
export function caracteristicasToArray(c: any): string[] {
  if (!c) return [];
  if (Array.isArray(c)) return c.map(String);
  if (typeof c === 'string') {
    try {
      const parsed = JSON.parse(c);
      return caracteristicasToArray(parsed);
    } catch {
      return c
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (typeof c === 'object') {
    return Object.entries(c).map(([k, v]) =>
      typeof v === 'object'
        ? `${k}: ${JSON.stringify(v)}`
        : `${k}: ${String(v)}`
    );
  }
  return [String(c)];
}
