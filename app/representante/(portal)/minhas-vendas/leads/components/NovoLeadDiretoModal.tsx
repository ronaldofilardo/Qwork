'use client';

import { X, Loader2, Plus, AlertCircle, AlertTriangle } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';
import {
  TIPO_CLIENTE_LABEL,
  TIPOS_CLIENTE,
  CUSTO_POR_AVALIACAO,
  calcularValoresComissao,
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
  tipo_cliente: TipoCliente;
  num_vidas_estimado: string;
}

interface Erros {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  num_vidas_estimado: string;
}

const FORM_INICIAL: Form = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  valor_negociado: '',
  tipo_cliente: 'entidade',
  num_vidas_estimado: '',
};

const ERROS_INICIAL: Erros = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  num_vidas_estimado: '',
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
  const [percRep, setPercRep] = useState(0);
  const [percComercial, setPercComercial] = useState(0);

  // Buscar percentuais do representante logado
  useEffect(() => {
    void fetch('/api/representante/me')
      .then((r) => r.json())
      .then((d: { representante?: { percentual_comissao?: number | null; percentual_comissao_comercial?: number | null } }) => {
        setPercRep(Number(d.representante?.percentual_comissao ?? 0));
        setPercComercial(Number(d.representante?.percentual_comissao_comercial ?? 0));
      })
      .catch(() => {/* silencioso */});
  }, []);

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

  const handleNumVidasChange = (valor: string) => {
    const limpo = valor.replace(/\D/g, '');
    setForm((p) => ({ ...p, num_vidas_estimado: limpo }));
    if (!limpo || parseInt(limpo) < 1)
      setErros((p) => ({ ...p, num_vidas_estimado: 'Informe ao menos 1 vida' }));
    else setErros((p) => ({ ...p, num_vidas_estimado: '' }));
  };

  const valorNegociadoNum =
    parseFloat(form.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')) ||
    0;

  const numVidasNum = parseInt(form.num_vidas_estimado) || 0;

  // Calcular breakdown em tempo real
  const breakdown = valorNegociadoNum > 0
    ? calcularValoresComissao(valorNegociadoNum, percRep, percComercial, form.tipo_cliente)
    : null;

  const custoMinimo = CUSTO_POR_AVALIACAO[form.tipo_cliente];

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formValido =
    form.contato_nome.trim().length >= 3 &&
    !erros.contato_email &&
    !erros.contato_telefone &&
    !erros.cnpj &&
    numVidasNum >= 1 &&
    !erros.num_vidas_estimado;

  const salvar = useCallback(async () => {
    if (!form.contato_nome.trim()) {
      setErroGeral('Nome do contato é obrigatório.');
      return;
    }
    if (numVidasNum < 1) {
      setErroGeral('Quantidade de vidas estimada é obrigatória.');
      return;
    }
    setSalvando(true);
    setErroGeral(null);
    try {
      const body: Record<string, unknown> = {
        contato_nome: form.contato_nome.trim(),
        tipo_cliente: form.tipo_cliente,
        num_vidas_estimado: numVidasNum,
      };
      if (form.contato_email.trim())
        body.contato_email = form.contato_email.trim();
      if (form.contato_telefone.trim())
        body.contato_telefone = form.contato_telefone.trim();
      if (form.cnpj.trim()) body.cnpj = normalizeCNPJ(form.cnpj);
      if (form.valor_negociado.trim()) body.valor_negociado = valorNegociadoNum;

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
  }, [form, valorNegociadoNum, numVidasNum, onSuccess]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
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
              CNPJ <span className="text-red-500">*</span>
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

          {/* Qtde de Vidas Estimada */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Qtde de vidas estimada <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={form.num_vidas_estimado}
              onChange={(e) => handleNumVidasChange(e.target.value)}
              placeholder="Ex: 50"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${erros.num_vidas_estimado ? 'border-red-400 focus:ring-red-400' : numVidasNum >= 1 ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {erros.num_vidas_estimado && (
              <p className="mt-1 text-xs text-red-500">{erros.num_vidas_estimado}</p>
            )}
          </div>

          {/* Valor negociado */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valor negociado por vida (R$) <span className="text-red-500">*</span>
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
                const formatted = (Number(raw) / 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setForm((f) => ({
                  ...f,
                  valor_negociado: `R$ ${formatted}`,
                }));
              }}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors"
            />
          </div>

          {/* Breakdown de comissão */}
          {breakdown && (
            <div className={`rounded-lg px-4 py-3 space-y-1.5 text-xs border ${breakdown.abaixoCusto ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Simulação de Comissão</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor por vida</span>
                <span className="font-semibold">{fmtBRL(valorNegociadoNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sua comissão ({percRep.toFixed(1)}%)</span>
                <span className="text-green-700 font-medium">{fmtBRL(breakdown.valorRep)}</span>
              </div>
              {percComercial > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Comissão comercial ({percComercial.toFixed(1)}%)</span>
                  <span className="text-blue-700 font-medium">{fmtBRL(breakdown.valorComercial)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5">
                <span className={breakdown.abaixoCusto ? 'text-amber-700 font-semibold' : 'text-gray-600 font-semibold'}>
                  QWork recebe
                </span>
                <span className={breakdown.abaixoCusto ? 'text-amber-700 font-semibold' : 'text-gray-700 font-semibold'}>
                  {fmtBRL(breakdown.valorQWork)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Custo mínimo ({form.tipo_cliente})</span>
                <span>R$ {custoMinimo},00</span>
              </div>
              {breakdown.abaixoCusto && (
                <div className="flex items-start gap-1.5 bg-amber-100 border border-amber-300 rounded px-2 py-1.5 mt-1">
                  <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-xs">
                    Valor abaixo do custo mínimo — este lead precisará de aprovação do comercial.
                  </p>
                </div>
              )}
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
