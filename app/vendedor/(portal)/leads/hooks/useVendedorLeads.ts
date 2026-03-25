'use client';

import { useState, useCallback } from 'react';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';
import {
  CUSTO_POR_AVALIACAO,
  MAX_PERCENTUAL_COMISSAO,
  calcularRequerAprovacao,
  calcularValoresComissao,
  type TipoCliente,
  type ValoresComissao,
} from '@/lib/leads-config';
import type { NovoLeadVendedorForm, ErrosCamposVendedor } from '../types';

const FORM_INICIAL: NovoLeadVendedorForm = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  valor_negociado: '',
  percentual_comissao: '',
  observacoes: '',
  tipo_cliente: 'entidade',
  num_vidas_estimado: '',
};

const ERROS_INICIAL: ErrosCamposVendedor = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  percentual_comissao: '',
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

export function useVendedorLeads() {
  const [form, setForm] = useState<NovoLeadVendedorForm>(FORM_INICIAL);
  const [errosCampos, setErrosCampos] =
    useState<ErrosCamposVendedor>(ERROS_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleCNPJChange = (valor: string) => {
    const mascarado = aplicarMascaraCNPJ(valor);
    setForm((p) => ({ ...p, cnpj: mascarado }));
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
    setForm((p) => ({ ...p, contato_telefone: mascarado }));
    if (mascarado && !validarTelefone(mascarado))
      setErrosCampos((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
    else setErrosCampos((p) => ({ ...p, contato_telefone: '' }));
  };

  const handleEmailChange = (valor: string) => {
    setForm((p) => ({ ...p, contato_email: valor }));
    if (valor && !validarEmail(valor))
      setErrosCampos((p) => ({ ...p, contato_email: 'E-mail inválido' }));
    else setErrosCampos((p) => ({ ...p, contato_email: '' }));
  };

  const handleTipoClienteChange = (tipo: TipoCliente) => {
    setForm((p) => ({ ...p, tipo_cliente: tipo }));
  };

  const valorNegociadoNum =
    parseFloat(form.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')) ||
    0;

  const percentualComissaoNum =
    parseFloat(
      form.percentual_comissao.replace(/[^\d,]/g, '').replace(',', '.')
    ) || 0;

  const numVidasEstimadoNum =
    parseInt(form.num_vidas_estimado.replace(/\D/g, ''), 10) || 0;

  const custoAtual = CUSTO_POR_AVALIACAO[form.tipo_cliente];
  const requerAprovacao = calcularRequerAprovacao(
    valorNegociadoNum,
    percentualComissaoNum,
    form.tipo_cliente
  );
  const valoresComissao: ValoresComissao = calcularValoresComissao(
    valorNegociadoNum,
    percentualComissaoNum,
    0,
    form.tipo_cliente
  );

  const formValido =
    form.contato_nome.trim().length >= 3 &&
    !errosCampos.contato_email &&
    !errosCampos.contato_telefone &&
    !errosCampos.cnpj;

  const salvar = useCallback(
    async (onSuccess: () => void) => {
      if (!form.contato_nome.trim()) {
        setErro('Nome do contato é obrigatório.');
        return;
      }
      setSalvando(true);
      setErro(null);
      try {
        const body: Record<string, unknown> = {
          contato_nome: form.contato_nome.trim(),
          tipo_cliente: form.tipo_cliente,
        };
        if (form.contato_email.trim())
          body.contato_email = form.contato_email.trim();
        if (form.contato_telefone.trim())
          body.contato_telefone = form.contato_telefone.trim();
        if (form.cnpj.trim()) body.cnpj = normalizeCNPJ(form.cnpj);
        if (form.valor_negociado.trim())
          body.valor_negociado = valorNegociadoNum;
        if (form.percentual_comissao.trim())
          body.percentual_comissao = percentualComissaoNum;
        if (form.observacoes.trim()) body.observacoes = form.observacoes.trim();
        if (numVidasEstimadoNum > 0)
          body.num_vidas_estimado = numVidasEstimadoNum;

        const res = await fetch('/api/vendedor/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error ?? 'Erro ao salvar');
        }
        setForm(FORM_INICIAL);
        setErrosCampos(ERROS_INICIAL);
        onSuccess();
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setSalvando(false);
      }
    },
    [form, valorNegociadoNum, percentualComissaoNum, numVidasEstimadoNum]
  );

  const resetForm = () => {
    setForm(FORM_INICIAL);
    setErrosCampos(ERROS_INICIAL);
    setErro(null);
  };

  return {
    form,
    setForm,
    errosCampos,
    salvando,
    erro,
    formValido,
    handleCNPJChange,
    handleTelefoneChange,
    handleEmailChange,
    handleTipoClienteChange,
    requerAprovacao,
    custoAtual,
    valoresComissao,
    MAX_PERCENTUAL_COMISSAO,
    salvar,
    resetForm,
  };
}
