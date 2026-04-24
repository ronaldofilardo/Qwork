'use client';

import { useEffect, useState, useCallback, useContext } from 'react';
import { RepContext } from '../../rep-context';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';
import {
  type TipoCliente,
  valorMinimoCustoFixoTotal,
} from '@/lib/leads-config';
import type { Lead, NovoLeadForm, ErrosCampos } from '../types';

interface RepMe {
  representante?: {
    percentual_comissao?: number | null;
    percentual_comissao_comercial?: number | null;
    modelo_comissionamento?: string | null;
    valor_custo_fixo_entidade?: number | null;
    valor_custo_fixo_clinica?: number | null;
  };
}

const FORM_INICIAL: NovoLeadForm = {
  cnpj: '',
  razao_social: '',
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  valor_negociado: '',
  tipo_cliente: 'entidade',
  num_vidas_estimado: '',
};

const ERROS_INICIAL: ErrosCampos = {
  cnpj: '',
  contato_email: '',
  contato_telefone: '',
};

function aplicarMascaraCNPJ(valor: string): string {
  const d = normalizeCNPJ(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function aplicarMascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function useLeads() {
  const { session: repSession } = useContext(RepContext);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<number | null>(null);
  const [showNovo, setShowNovo] = useState(false);
  const [novoForm, setNovoForm] = useState<NovoLeadForm>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [errosCampos, setErrosCampos] = useState<ErrosCampos>(ERROS_INICIAL);
  const [contagens, setContagens] = useState<Record<string, number>>({
    pendente: 0,
    convertido: 0,
    expirado: 0,
  });
  const [ordenacao, setOrdenacao] = useState<
    'recente' | 'antigo' | 'expirando'
  >('recente');
  const [percRep, setPercRep] = useState(0);
  const [percComercial, setPercComercial] = useState(0);
  const [modeloComissionamento, setModeloComissionamento] = useState<
    string | null
  >(null);
  const [valorCustoFixoEntidade, setValorCustoFixoEntidade] = useState<
    number | null
  >(null);
  const [valorCustoFixoClinica, setValorCustoFixoClinica] = useState<
    number | null
  >(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const carregarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/representante/leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      if (data.contagens) setContagens(data.contagens);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);

  useEffect(() => {
    void fetch('/api/representante/me')
      .then((r) => r.json())
      .then((d: RepMe) => {
        setPercRep(Number(d.representante?.percentual_comissao ?? 0));
        setPercComercial(
          Number(d.representante?.percentual_comissao_comercial ?? 0)
        );
        setModeloComissionamento(
          d.representante?.modelo_comissionamento ?? null
        );
        setValorCustoFixoEntidade(
          d.representante?.valor_custo_fixo_entidade != null
            ? Number(d.representante.valor_custo_fixo_entidade)
            : null
        );
        setValorCustoFixoClinica(
          d.representante?.valor_custo_fixo_clinica != null
            ? Number(d.representante.valor_custo_fixo_clinica)
            : null
        );
      })
      .catch(() => {
        /* silencioso */
      });
  }, []);

  const copiarCodigo = async (lead: Lead) => {
    const id = repSession?.id ?? '';
    const texto = `Olá! Faça o cadastro da sua empresa no QWork:\n${baseUrl}/login\n\nNa etapa de confirmação, informe o id do representante: ${id}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(lead.id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setErro('Não foi possível copiar. Tente manualmente.');
    }
  };

  const handleCNPJChange = (valor: string) => {
    const mascarado = aplicarMascaraCNPJ(valor);
    setNovoForm((p) => ({ ...p, cnpj: mascarado }));
    const limpo = normalizeCNPJ(mascarado);
    if (limpo.length === 0) setErrosCampos((p) => ({ ...p, cnpj: '' }));
    else if (limpo.length < 14)
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ incompleto' }));
    else if (!validarCNPJ(limpo))
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ inválido' }));
    else setErrosCampos((p) => ({ ...p, cnpj: '' }));
  };

  const handleTelefoneChange = (valor: string) => {
    const mascarado = aplicarMascaraTelefone(valor);
    setNovoForm((p) => ({ ...p, contato_telefone: mascarado }));
    if (mascarado && !validarTelefone(mascarado))
      setErrosCampos((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
    else setErrosCampos((p) => ({ ...p, contato_telefone: '' }));
  };

  const handleEmailChange = (valor: string) => {
    setNovoForm((p) => ({ ...p, contato_email: valor }));
    if (valor && !validarEmail(valor))
      setErrosCampos((p) => ({ ...p, contato_email: 'E-mail inválido' }));
    else setErrosCampos((p) => ({ ...p, contato_email: '' }));
  };

  const valorNegociadoNum =
    parseFloat(
      novoForm.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')
    ) || 0;

  const numVidasEstimadoNum =
    parseInt(novoForm.num_vidas_estimado.replace(/\D/g, ''), 10) || 0;

  const handleTipoClienteChange = (tipo: TipoCliente) => {
    setNovoForm((p) => ({ ...p, tipo_cliente: tipo }));
  };

  const custoFixoRep =
    modeloComissionamento === 'custo_fixo'
      ? novoForm.tipo_cliente === 'entidade'
        ? valorCustoFixoEntidade
        : valorCustoFixoClinica
      : null;

  const custoFixoInvalido =
    modeloComissionamento === 'custo_fixo' &&
    custoFixoRep !== null &&
    valorNegociadoNum > 0 &&
    valorNegociadoNum <
      valorMinimoCustoFixoTotal(novoForm.tipo_cliente, custoFixoRep);

  const formValido =
    normalizeCNPJ(novoForm.cnpj).length === 14 &&
    validarCNPJ(normalizeCNPJ(novoForm.cnpj)) &&
    !errosCampos.contato_email &&
    !errosCampos.contato_telefone &&
    valorNegociadoNum > 0 &&
    numVidasEstimadoNum > 0 &&
    !custoFixoInvalido;

  const criarLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cnpjLimpo = normalizeCNPJ(novoForm.cnpj);
    if (!validarCNPJ(cnpjLimpo)) {
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ inválido' }));
      return;
    }
    if (novoForm.contato_email && !validarEmail(novoForm.contato_email)) {
      setErrosCampos((p) => ({ ...p, contato_email: 'E-mail inválido' }));
      return;
    }
    if (
      novoForm.contato_telefone &&
      !validarTelefone(novoForm.contato_telefone)
    ) {
      setErrosCampos((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/representante/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: cnpjLimpo,
          razao_social: novoForm.razao_social || null,
          contato_nome: novoForm.contato_nome || null,
          contato_email: novoForm.contato_email || null,
          contato_telefone: novoForm.contato_telefone || null,
          valor_negociado: valorNegociadoNum,
          tipo_cliente: novoForm.tipo_cliente,
          num_vidas_estimado:
            numVidasEstimadoNum > 0 ? numVidasEstimadoNum : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar lead');
        return;
      }
      setShowNovo(false);
      setNovoForm(FORM_INICIAL);
      setErrosCampos(ERROS_INICIAL);
      const msg = data.requer_aprovacao_comercial
        ? 'Lead registrado! Aguardando aprovação do Comercial.'
        : 'Lead registrado com sucesso!';
      setSucesso(msg);
      setTimeout(() => setSucesso(''), 3000);
      await carregarLeads();
    } finally {
      setSalvando(false);
    }
  };

  return {
    leads,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    loading,
    copiado,
    copiarCodigo,
    showNovo,
    setShowNovo,
    novoForm,
    setNovoForm,
    salvando,
    erro,
    sucesso,
    errosCampos,
    setErrosCampos,
    contagens,
    ordenacao,
    setOrdenacao,
    formValido,
    criarLead,
    carregarLeads,
    handleCNPJChange,
    handleTelefoneChange,
    handleEmailChange,
    handleTipoClienteChange,
    percRep,
    percComercial,
    modeloComissionamento,
    valorCustoFixoEntidade,
    valorCustoFixoClinica,
  };
}
