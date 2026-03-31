'use client';

import { createContext, useContext } from 'react';

export interface RepresentanteSession {
  id: number;
  nome: string;
  email: string;
  codigo: string;
  status: string;
  tipo_pessoa: string;
  cpf?: string | null;
  cnpj?: string | null;
  telefone: string | null;
  aceite_termos: boolean;
  aceite_disclaimer_nv: boolean;
  aceite_politica_privacidade: boolean;
  criado_em: string;
  aprovado_em: string | null;
  // Dados bancários
  banco_codigo?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  titular_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null;
  dados_bancarios_status?: string | null;
  dados_bancarios_solicitado_em?: string | null;
  dados_bancarios_confirmado_em?: string | null;
  precisa_trocar_senha?: boolean;
}

interface RepContextValue {
  session: RepresentanteSession | null;
}

export const RepContext = createContext<RepContextValue>({ session: null });

export const useRepresentante = () => useContext(RepContext);
