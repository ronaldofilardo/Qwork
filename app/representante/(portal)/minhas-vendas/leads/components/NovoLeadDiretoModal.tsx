'use client';

import { X, Loader2, Plus, AlertCircle, AlertTriangle } from 'lucide-react';
import { useState, useCallback } from 'react';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';
import {
  CUSTO_PRODUTO,
  calcularRequerAprovacao,
  TIPO_CLIENTE_LABEL,
  TIPOS_CLIENTE,
  type TipoCliente,
} from '@/lib/leads-config';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface Form {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  valor_negociado: string;
  percentual_comissao: string;
  tipo_cliente: TipoCliente;
}

interface Erros {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  percentual_comissao: string;
}

const FORM_INICIAL: Form = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  valor_negociado: '',
  percentual_comissao: '',
  tipo_cliente: 'entidade',
};

const ERROS_INICIAL: Erros = {
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

export default function RepNovoLeadDiretoModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Form>(FORM_INICIAL);
  const [erros, setErros] = useState<Erros>(ERROS_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const handleCNPJChange = (valor: string) => {
    const mascarado = aplicarMascaraCNPJ(valor);
    setForm((p) => ({ ...p, cnpj: mascarado }));
    const limpo = normalizeCNPJ(mascarado);
    if (limpo.length === 0) setErros((p) => ({ ...p, cnpj: '' }));
    else if (limpo.length < 14)
      setErros((p) => ({ ...p, cnpj: 'CNPJ incompleto' }));
    else if (!validarCNPJ(limpo))
      setErros((p) => ({ ...p, cnpj: 'CNPJ inválido' }));
    else setErros((p) => ({ ...p, cnpj: '' }));
  };

  const handleTelefoneChange = (valor: string) => {
    const mascarado = aplicarMascaraTelefone(valor);
    setForm((p) => ({ ...p, contato_telefone: mascarado }));
    if (mascarado && !validarTelefone(mascarado))
      setErros((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
    else setErros((p) => ({ ...p, contato_telefone: '' }));
  };

  const handleEmailChange = (valor: string) => {
    setForm((p) => ({ ...p, contato_email: valor }));
    if (valor && !validarEmail(valor))
      setErros((p) => ({ ...p, contato_email: 'E-mail inválido' }));
    else setErros((p) => ({ ...p, contato_email: '' }));
  };

  const valorNegociadoNum =
    parseFloat(form.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')) ||
    0;

  const percentualComissaoNum =
    parseFloat(
      form.percentual_comissao.replace(/[^\d,]/g, '').replace(',', '.')
    ) || 0;

  const custoAtual = CUSTO_PRODUTO[form.tipo_cliente];
  const requerAprovacao = calcularRequerAprovacao(
    valorNegociadoNum,
    percentualComissaoNum,
    form.tipo_cliente
  );

  const formValido =
    form.contato_nome.trim().length >= 3 &&
    !erros.contato_email &&
    !erros.contato_telefone &&
    !erros.cnpj;

  const salvar = useCallback(async () => {
    if (!form.contato_nome.trim()) {
      setErroGeral('Nome do contato é obrigatório.');
      return;
    }
    setSalvando(true);
    setErroGeral(null);
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
      if (form.valor_negociado.trim()) body.valor_negociado = valorNegociadoNum;
      if (form.percentual_comissao.trim())
        body.percentual_comissao = percentualComissaoNum;

      const res = await fetch('/api/representante/minhas-vendas/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      onSuccess();
    } catch (e: unknown) {
      setErroGeral(e instanceof Error ? e.message : 'Erro ao salvar lead');
    } finally {
      setSalvando(false);
    }
  }, [form, valorNegociadoNum, percentualComissaoNum, onSuccess]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Novo Lead Direto</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {erroGeral && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {erroGeral}
            </div>
          )}

          {/* Tipo de Cliente */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tipo de Cliente
            </label>
            <div className="flex rounded-lg border overflow-hidden">
              {TIPOS_CLIENTE.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo_cliente: tipo }))}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                    form.tipo_cliente === tipo
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {TIPO_CLIENTE_LABEL[tipo]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Custo mínimo:{' '}
              <span className="font-semibold text-gray-700">
                R$ {custoAtual},00
              </span>
            </p>
          </div>

          {/* Nome do Contato */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome do contato <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.contato_nome}
              onChange={(e) =>
                setForm((f) => ({ ...f, contato_nome: e.target.value }))
              }
              placeholder="Nome da empresa ou pessoa"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              E-mail do contato
            </label>
            <input
              type="email"
              value={form.contato_email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="email@empresa.com.br"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${erros.contato_email ? 'border-red-400 focus:ring-red-400' : form.contato_email && !erros.contato_email ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {erros.contato_email && (
              <p className="mt-1 text-xs text-red-500">{erros.contato_email}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={form.contato_telefone}
              onChange={(e) => handleTelefoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${erros.contato_telefone ? 'border-red-400 focus:ring-red-400' : form.contato_telefone.replace(/\D/g, '').length >= 10 && !erros.contato_telefone ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {erros.contato_telefone && (
              <p className="mt-1 text-xs text-red-500">
                {erros.contato_telefone}
              </p>
            )}
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              CNPJ (se disponível)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.cnpj}
              onChange={(e) => handleCNPJChange(e.target.value)}
              placeholder="00.000.000/0000-00"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${erros.cnpj ? 'border-red-400 focus:ring-red-400' : normalizeCNPJ(form.cnpj).length === 14 && !erros.cnpj ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {erros.cnpj && (
              <p className="mt-1 text-xs text-red-500">{erros.cnpj}</p>
            )}
          </div>

          {/* Valor + Comissão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Valor negociado (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.valor_negociado}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  if (!raw) {
                    setForm((f) => ({ ...f, valor_negociado: '' }));
                    return;
                  }
                  const formatted = (Number(raw) / 100).toLocaleString(
                    'pt-BR',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  );
                  setForm((f) => ({
                    ...f,
                    valor_negociado: `R$ ${formatted}`,
                  }));
                }}
                placeholder="R$ 0,00"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Comissão (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.percentual_comissao}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    percentual_comissao: e.target.value,
                  }));
                  const n = parseFloat(e.target.value);
                  if (isNaN(n) || n < 0 || n > 100)
                    setErros((p) => ({
                      ...p,
                      percentual_comissao: 'Entre 0 e 100',
                    }));
                  else setErros((p) => ({ ...p, percentual_comissao: '' }));
                }}
                placeholder="0.0"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${erros.percentual_comissao ? 'border-red-400 focus:ring-red-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
              />
              {erros.percentual_comissao && (
                <p className="mt-1 text-xs text-red-500">
                  {erros.percentual_comissao}
                </p>
              )}
            </div>
          </div>

          {/* Aviso de aprovação comercial */}
          {requerAprovacao && form.contato_nome.trim().length >= 3 && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Este lead requer <strong>aprovação do Comercial</strong> antes
                de ser processado (margem abaixo do custo mínimo de R${' '}
                {custoAtual},00).
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => void salvar()}
            disabled={salvando || !formValido}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {salvando && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} />
            {salvando ? 'Salvando...' : 'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
