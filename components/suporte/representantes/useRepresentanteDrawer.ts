'use client';

import { useState, useEffect } from 'react';
import type { Representante, DadosBancarios, DrawerTab, FormRepresentante } from './types';

export interface DrawerState {
  tab: DrawerTab;
  editando: boolean;
  salvando: boolean;
  erroSalvar: string | null;
  form: FormRepresentante;
  vendedorBancario: number | null;
  dadosBancarios: DadosBancarios | null;
  loadingBancario: boolean;
  salvandoBancario: boolean;
  erroBancario: string | null;
  formBancario: DadosBancarios;
}

export interface DrawerHandlers {
  setTab: (t: DrawerTab) => void;
  setEditando: (v: boolean) => void;
  setErroSalvar: (v: string | null) => void;
  setForm: React.Dispatch<React.SetStateAction<FormRepresentante>>;
  setFormBancario: React.Dispatch<React.SetStateAction<DadosBancarios>>;
  salvarRepresentante: () => Promise<void>;
  abrirDadosBancarios: (vendedorId: number) => Promise<void>;
  salvarDadosBancarios: (vendedorId: number) => Promise<void>;
}

const FORM_BANCARIO_EMPTY: DadosBancarios = {
  banco_codigo: null, agencia: null, conta: null, tipo_conta: null,
  titular_conta: null, pix_chave: null, pix_tipo: null,
};

// eslint-disable-next-line max-lines-per-function
export function useRepresentanteDrawer(rep: Representante | null, onUpdated: () => void): { state: DrawerState; handlers: DrawerHandlers } {
  const [tab, setTab] = useState<DrawerTab>('dados');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [form, setForm] = useState<FormRepresentante>({ nome: '', email: '', telefone: '', status: '', percentual_comissao: '', percentual_vendedor_direto: '' });
  const [vendedorBancario, setVendedorBancario] = useState<number | null>(null);
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios | null>(null);
  const [loadingBancario, setLoadingBancario] = useState(false);
  const [salvandoBancario, setSalvandoBancario] = useState(false);
  const [erroBancario, setErroBancario] = useState<string | null>(null);
  const [formBancario, setFormBancario] = useState<DadosBancarios>({ ...FORM_BANCARIO_EMPTY, tipo_conta: 'corrente' });

  useEffect(() => {
    if (!rep) return;
    setTab('dados');
    setEditando(false);
    setErroSalvar(null);
    setVendedorBancario(null);
    setDadosBancarios(null);
    setForm({ nome: rep.nome ?? '', email: rep.email ?? '', telefone: rep.telefone ?? '', status: rep.status ?? '', percentual_comissao: rep.percentual_comissao?.toString() ?? '', percentual_vendedor_direto: rep.percentual_vendedor_direto?.toString() ?? '' });
  }, [rep]);

  void dadosBancarios;

  const salvarRepresentante = async () => {
    if (!rep) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const body: Record<string, unknown> = {};
      if (form.nome.trim()) body.nome = form.nome.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.telefone.trim()) body.telefone = form.telefone.trim();
      if (form.status) body.status = form.status;
      if (form.percentual_comissao) body.percentual_comissao = parseFloat(form.percentual_comissao);
      if (form.percentual_vendedor_direto) body.percentual_vendedor_direto = parseFloat(form.percentual_vendedor_direto);
      const res = await fetch(`/api/suporte/representantes/${rep.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})) as { error?: string }; throw new Error(d.error ?? 'Erro ao salvar'); }
      setEditando(false);
      onUpdated();
    } catch (e: unknown) {
      setErroSalvar(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally { setSalvando(false); }
  };

  const abrirDadosBancarios = async (vendedorId: number) => {
    if (vendedorBancario === vendedorId) { setVendedorBancario(null); return; }
    setVendedorBancario(vendedorId);
    setLoadingBancario(true);
    setErroBancario(null);
    try {
      const res = await fetch(`/api/suporte/vendedores/${vendedorId}/dados-bancarios`);
      const d = await res.json() as { dados_bancarios?: DadosBancarios };
      const db: DadosBancarios = d.dados_bancarios ?? { ...FORM_BANCARIO_EMPTY };
      setDadosBancarios(db);
      setFormBancario({ banco_codigo: db.banco_codigo ?? '', agencia: db.agencia ?? '', conta: db.conta ?? '', tipo_conta: db.tipo_conta ?? 'corrente', titular_conta: db.titular_conta ?? '', pix_chave: db.pix_chave ?? '', pix_tipo: db.pix_tipo ?? null });
    } catch { setErroBancario('Nao foi possivel carregar os dados bancarios.'); }
    finally { setLoadingBancario(false); }
  };

  const salvarDadosBancarios = async (vendedorId: number) => {
    setSalvandoBancario(true);
    setErroBancario(null);
    try {
      const res = await fetch(`/api/suporte/vendedores/${vendedorId}/dados-bancarios`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formBancario) });
      if (!res.ok) { const d = await res.json().catch(() => ({})) as { error?: string }; throw new Error(d.error ?? 'Erro ao salvar'); }
      const updated = await res.json() as { dados_bancarios?: DadosBancarios };
      setDadosBancarios(updated.dados_bancarios ?? formBancario);
    } catch (e: unknown) { setErroBancario(e instanceof Error ? e.message : 'Erro desconhecido'); }
    finally { setSalvandoBancario(false); }
  };

  return {
    state: { tab, editando, salvando, erroSalvar, form, vendedorBancario, dadosBancarios, loadingBancario, salvandoBancario, erroBancario, formBancario },
    handlers: { setTab, setEditando, setErroSalvar, setForm, setFormBancario, salvarRepresentante, abrirDadosBancarios, salvarDadosBancarios },
  };
}
