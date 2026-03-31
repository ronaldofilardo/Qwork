'use client';

import { X, Loader2, Plus, AlertCircle, AlertTriangle } from 'lucide-react';
import { normalizeCNPJ } from '@/lib/validators';
import { TIPO_CLIENTE_LABEL, TIPOS_CLIENTE } from '@/lib/leads-config';
import { useVendedorLeads } from '../hooks/useVendedorLeads';

interface VendedorNovoLeadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendedorNovoLeadModal({
  onClose,
  onSuccess,
}: VendedorNovoLeadModalProps) {
  const {
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
    salvar,
  } = useVendedorLeads();

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Novo Lead</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {erro}
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
                  onClick={() => handleTipoClienteChange(tipo)}
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
            <p className="mt-1 text-xs text-gray-500">
              Custo por avaliação:{' '}
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errosCampos.contato_email ? 'border-red-400 focus:ring-red-400' : form.contato_email && !errosCampos.contato_email ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {errosCampos.contato_email && (
              <p className="mt-1 text-xs text-red-500">
                {errosCampos.contato_email}
              </p>
            )}
            {!errosCampos.contato_email && form.contato_email && (
              <p className="mt-1 text-xs text-green-600">E-mail válido ✓</p>
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errosCampos.contato_telefone ? 'border-red-400 focus:ring-red-400' : form.contato_telefone.replace(/\D/g, '').length >= 10 && !errosCampos.contato_telefone ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {errosCampos.contato_telefone && (
              <p className="mt-1 text-xs text-red-500">
                {errosCampos.contato_telefone}
              </p>
            )}
            {!errosCampos.contato_telefone &&
              form.contato_telefone.replace(/\D/g, '').length >= 10 && (
                <p className="mt-1 text-xs text-green-600">Telefone válido ✓</p>
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errosCampos.cnpj ? 'border-red-400 focus:ring-red-400' : normalizeCNPJ(form.cnpj).length === 14 && !errosCampos.cnpj ? 'border-green-400 focus:ring-green-400' : 'focus:ring-green-500/30 focus:border-green-400'}`}
            />
            {errosCampos.cnpj && (
              <p className="mt-1 text-xs text-red-500">{errosCampos.cnpj}</p>
            )}
            {!errosCampos.cnpj && normalizeCNPJ(form.cnpj).length === 14 && (
              <p className="mt-1 text-xs text-green-600">CNPJ válido ✓</p>
            )}
          </div>

          {/* Valor negociado */}
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

          {/* Nº de Vidas Estimado */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nº de Vidas Estimado
              <span className="ml-1 text-xs font-normal text-gray-400">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 150"
              value={form.num_vidas_estimado}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setForm((f) => ({ ...f, num_vidas_estimado: raw }));
              }}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">
              Número estimado de funcionários/vidas do cliente
            </p>
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
              rows={3}
              placeholder="Informações adicionais sobre o lead..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none transition-colors"
            />
          </div>

          {/* Banner de aprovação */}
          {requerAprovacao && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Aprovação comercial necessária
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  A margem QWork ficará abaixo do custo por avaliação (R${' '}
                  {custoAtual}
                  ,00).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => salvar(onSuccess)}
            disabled={salvando || !formValido}
            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {salvando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {salvando ? 'Enviando...' : 'Enviar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
