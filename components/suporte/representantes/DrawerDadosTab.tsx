'use client';

import { AlertCircle, Pencil, Check, Loader2 } from 'lucide-react';
import type { Representante, FormRepresentante } from './types';
import { STATUS_LABEL, STATUS_OPTIONS, fmtCPF, fmtCNPJ } from './types';

interface DrawerDadosTabProps {
  rep: Representante;
  form: FormRepresentante;
  editando: boolean;
  salvando: boolean;
  erroSalvar: string | null;
  setForm: React.Dispatch<React.SetStateAction<FormRepresentante>>;
  setEditando: (v: boolean) => void;
  setErroSalvar: (v: string | null) => void;
  onSalvar: () => void;
}

const EDIT_FIELDS = [
  { key: 'nome', label: 'Nome', type: 'text' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'telefone', label: 'Telefone', type: 'text' },
  { key: 'percentual_comissao', label: '% Comissao', type: 'number' },
  { key: 'percentual_vendedor_direto', label: '% Venda Direta', type: 'number' },
] as const;

function RepresentanteInfoTabela({ rep }: { rep: Representante }) {
  const rows: [string, string][] = [
    ['Codigo', rep.codigo ?? '-'],
    ['Documento', rep.tipo_pessoa === 'pj' ? fmtCNPJ(rep.cnpj) : fmtCPF(rep.cpf)],
    ['Tipo', rep.tipo_pessoa === 'pj' ? 'Pessoa Juridica' : 'Pessoa Fisica'],
    ['Cadastro', new Date(rep.criado_em).toLocaleDateString('pt-BR')],
  ];
  return (
    <div className="bg-gray-50 rounded-lg divide-y text-sm">
      {rows.map(([label, val]) => (
        <div key={label} className="flex justify-between px-4 py-2.5">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-900 font-mono text-xs">{val}</span>
        </div>
      ))}
    </div>
  );
}

export function DrawerDadosTab({ rep, form, editando, salvando, erroSalvar, setForm, setEditando, setErroSalvar, onSalvar }: DrawerDadosTabProps) {
  const st = STATUS_LABEL[rep.status] ?? { label: rep.status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <div className="space-y-5">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${st.cls}`}>{st.label}</span>
      <RepresentanteInfoTabela rep={rep} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editar Representante</p>
          {!editando && (
            <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>
        {erroSalvar && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={14} className="shrink-0" />{erroSalvar}
          </div>
        )}
        <div className="space-y-2.5">
          {EDIT_FIELDS.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input type={type} disabled={!editando} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select disabled={!editando} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white">
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
        </div>
        {editando && (
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setEditando(false); setErroSalvar(null); }} disabled={salvando} className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">Cancelar</button>
            <button onClick={onSalvar} disabled={salvando} className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
