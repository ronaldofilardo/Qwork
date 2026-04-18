'use client';

import { X, Loader2, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';
import {
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
  tipo_cliente: TipoCliente;
  num_vidas_estimado: string;
  valor_negociado: string;
  observacoes: string;
}

interface Erros {
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  num_vidas_estimado: string;
  valor_negociado: string;
}

const FORM_INICIAL: Form = {
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  tipo_cliente: 'entidade',
  num_vidas_estimado: '',
  valor_negociado: '',
  observacoes: '',
};

const ERROS_INICIAL: Erros = {
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
  num_vidas_estimado: '',
  valor_negociado: '',
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

export default function NovoLeadVendedorModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Form>(FORM_INICIAL);
  const [erros, setErros] = useState<Erros>(ERROS_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

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
      setErros((p) => ({
        ...p,
        num_vidas_estimado: 'Informe ao menos 1 vida',
      }));
    else setErros((p) => ({ ...p, num_vidas_estimado: '' }));
  };

  const handleValorNegociadoChange = (valor: string) => {
    const raw = valor.replace(/[^\d]/g, '');
    if (!raw) {
      setForm((p) => ({ ...p, valor_negociado: '' }));
      setErros((p) => ({
        ...p,
        valor_negociado: 'Valor negociado é obrigatório',
      }));
      return;
    }
    const num = Number(raw) / 100;
    if (num < 0.01) {
      setErros((p) => ({
        ...p,
        valor_negociado: 'Valor deve ser maior que 0',
      }));
    } else {
      setErros((p) => ({ ...p, valor_negociado: '' }));
    }
    const formatted = num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setForm((p) => ({ ...p, valor_negociado: `R$ ${formatted}` }));
  };

  const numVidasNum = parseInt(form.num_vidas_estimado) || 0;
  const valorNegociadoNum =
    parseFloat(form.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')) ||
    0;

  const formValido =
    form.contato_nome.trim().length >= 3 &&
    !erros.contato_email &&
    !erros.contato_telefone &&
    !erros.cnpj &&
    numVidasNum >= 1 &&
    !erros.num_vidas_estimado &&
    valorNegociadoNum > 0 &&
    !erros.valor_negociado;

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
      if (valorNegociadoNum > 0) body.valor_negociado = valorNegociadoNum;
      if (form.observacoes.trim()) body.observacoes = form.observacoes.trim();

      const res = await fetch('/api/vendedor/leads', {
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
  }, [form, numVidasNum, valorNegociadoNum, onSuccess]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setMostrarConfirmacao(true);
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Novo Lead</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
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
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer ${
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                erros.contato_email
                  ? 'border-red-400 focus:ring-red-400'
                  : form.contato_email && !erros.contato_email
                    ? 'border-green-400 focus:ring-green-400'
                    : 'focus:ring-green-500/30 focus:border-green-400'
              }`}
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                erros.contato_telefone
                  ? 'border-red-400 focus:ring-red-400'
                  : form.contato_telefone.replace(/\D/g, '').length >= 10 &&
                      !erros.contato_telefone
                    ? 'border-green-400 focus:ring-green-400'
                    : 'focus:ring-green-500/30 focus:border-green-400'
              }`}
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                erros.cnpj
                  ? 'border-red-400 focus:ring-red-400'
                  : normalizeCNPJ(form.cnpj).length === 14 && !erros.cnpj
                    ? 'border-green-400 focus:ring-green-400'
                    : 'focus:ring-green-500/30 focus:border-green-400'
              }`}
            />
            {erros.cnpj && (
              <p className="mt-1 text-xs text-red-500">{erros.cnpj}</p>
            )}
          </div>

          {/* Qtde de Vidas */}
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                erros.num_vidas_estimado
                  ? 'border-red-400 focus:ring-red-400'
                  : numVidasNum >= 1
                    ? 'border-green-400 focus:ring-green-400'
                    : 'focus:ring-green-500/30 focus:border-green-400'
              }`}
            />
            {erros.num_vidas_estimado && (
              <p className="mt-1 text-xs text-red-500">
                {erros.num_vidas_estimado}
              </p>
            )}
          </div>

          {/* Valor negociado por vida */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valor negociado por vida (R$){' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.valor_negociado}
              onChange={(e) => handleValorNegociadoChange(e.target.value)}
              placeholder="R$ 0,00"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                erros.valor_negociado
                  ? 'border-red-400 focus:ring-red-400'
                  : valorNegociadoNum > 0
                    ? 'border-green-400 focus:ring-green-400'
                    : 'focus:ring-green-500/30 focus:border-green-400'
              }`}
            />
            {erros.valor_negociado && (
              <p className="mt-1 text-xs text-red-500">
                {erros.valor_negociado}
              </p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) =>
                setForm((f) => ({ ...f, observacoes: e.target.value }))
              }
              placeholder="Informações adicionais sobre o lead..."
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void salvar()}
            disabled={!formValido || salvando}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {salvando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Salvando...
              </>
            ) : (
              'Cadastrar Lead'
            )}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Deseja encerrar o cadastro do lead?
              </h3>
            </div>
            <p className="px-6 py-4 text-sm text-gray-600">
              Os dados preenchidos serão descartados.
            </p>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Não, continuar
              </button>
              <button
                onClick={() => {
                  setMostrarConfirmacao(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
              >
                Sim, encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
