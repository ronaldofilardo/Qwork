'use client';

import { User, Wallet, Check, Loader2, AlertCircle } from 'lucide-react';
import type { Representante, Vendedor, DadosBancarios } from './types';
import { fmtCPF } from './types';

interface VendedoresTabProps {
  rep: Representante;
  vendedorBancario: number | null;
  formBancario: DadosBancarios;
  loadingBancario: boolean;
  salvandoBancario: boolean;
  erroBancario: string | null;
  setFormBancario: React.Dispatch<React.SetStateAction<DadosBancarios>>;
  onAbrirBancario: (id: number) => void;
  onSalvarBancario: (id: number) => void;
}

const BANCARIO_FIELDS = [
  {
    key: 'banco_codigo',
    label: 'Codigo do Banco',
    placeholder: '001',
    span: false,
  },
  { key: 'agencia', label: 'Agencia', placeholder: '0001', span: false },
  { key: 'conta', label: 'Conta', placeholder: '12345-6', span: false },
  {
    key: 'titular_conta',
    label: 'Titular',
    placeholder: 'Nome completo',
    span: true,
  },
  {
    key: 'pix_chave',
    label: 'Chave PIX',
    placeholder: 'CPF, e-mail...',
    span: true,
  },
] as const;

interface VendedorRowProps {
  v: Vendedor;
  vendedorBancario: number | null;
  formBancario: DadosBancarios;
  loadingBancario: boolean;
  salvandoBancario: boolean;
  erroBancario: string | null;
  setFormBancario: React.Dispatch<React.SetStateAction<DadosBancarios>>;
  onAbrirBancario: (id: number) => void;
  onSalvarBancario: (id: number) => void;
}

function DadosBancariosForm({
  v,
  formBancario,
  salvandoBancario,
  erroBancario,
  setFormBancario,
  onSalvarBancario,
}: Pick<
  VendedorRowProps,
  | 'v'
  | 'formBancario'
  | 'salvandoBancario'
  | 'erroBancario'
  | 'setFormBancario'
  | 'onSalvarBancario'
>) {
  return (
    <div className="px-4 pb-4 border-t bg-gray-50/60 space-y-3 pt-3">
      {erroBancario && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-xs">
          <AlertCircle size={12} className="shrink-0" />
          {erroBancario}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {BANCARIO_FIELDS.map(({ key, label, placeholder, span }) => (
          <div key={key} className={span ? 'col-span-2' : ''}>
            <label className="block text-[10px] text-gray-500 mb-1">
              {label}
            </label>
            <input
              type="text"
              placeholder={placeholder}
              value={formBancario[key] ?? ''}
              onChange={(e) =>
                setFormBancario((f) => ({
                  ...f,
                  [key]: e.target.value || null,
                }))
              }
              className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
        ))}
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">
            Tipo Conta
          </label>
          <select
            value={formBancario.tipo_conta ?? 'corrente'}
            onChange={(e) =>
              setFormBancario((f) => ({ ...f, tipo_conta: e.target.value }))
            }
            className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
          >
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupanca</option>
            <option value="pagamento">Pagamento</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">
            Tipo PIX
          </label>
          <select
            value={formBancario.pix_tipo ?? ''}
            onChange={(e) =>
              setFormBancario((f) => ({
                ...f,
                pix_tipo: e.target.value || null,
              }))
            }
            className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
          >
            <option value="">-</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Aleatoria</option>
          </select>
        </div>
      </div>
      <button
        onClick={() => onSalvarBancario(v.vendedor_id)}
        disabled={salvandoBancario}
        className="w-full py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
      >
        {salvandoBancario ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Salvando...
          </>
        ) : (
          <>
            <Check size={12} /> Salvar dados bancarios
          </>
        )}
      </button>
    </div>
  );
}

function VendedorRow({
  v,
  vendedorBancario,
  formBancario,
  loadingBancario,
  salvandoBancario,
  erroBancario,
  setFormBancario,
  onAbrirBancario,
  onSalvarBancario,
}: VendedorRowProps) {
  const isExpanded = vendedorBancario === v.vendedor_id;
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          {v.nome[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{v.nome}</p>
          <p className="text-xs text-gray-400 font-mono">{fmtCPF(v.cpf)}</p>
        </div>
      </div>
      <div className="px-4 py-2 border-t">
        <button
          onClick={() => onAbrirBancario(v.vendedor_id)}
          className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          <Wallet size={12} />
          {isExpanded ? 'Fechar dados bancarios' : 'Editar dados bancarios'}
        </button>
      </div>
      {isExpanded &&
        (loadingBancario ? (
          <div className="px-4 pb-4 pt-3 border-t bg-gray-50/60 flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Carregando...
          </div>
        ) : (
          <DadosBancariosForm
            v={v}
            formBancario={formBancario}
            salvandoBancario={salvandoBancario}
            erroBancario={erroBancario}
            setFormBancario={setFormBancario}
            onSalvarBancario={onSalvarBancario}
          />
        ))}
    </div>
  );
}

export function DrawerVendedoresTab({
  rep,
  vendedorBancario,
  formBancario,
  loadingBancario,
  salvandoBancario,
  erroBancario,
  setFormBancario,
  onAbrirBancario,
  onSalvarBancario,
}: VendedoresTabProps) {
  if (rep.vendedores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <User size={32} className="opacity-30" />
        <p className="text-sm">Nenhum vendedor vinculado.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {rep.vendedores.map((v) => (
        <VendedorRow
          key={v.vinculo_id}
          v={v}
          vendedorBancario={vendedorBancario}
          formBancario={formBancario}
          loadingBancario={loadingBancario}
          salvandoBancario={salvandoBancario}
          erroBancario={erroBancario}
          setFormBancario={setFormBancario}
          onAbrirBancario={onAbrirBancario}
          onSalvarBancario={onSalvarBancario}
        />
      ))}
    </div>
  );
}
