'use client';

import { X, Building2, Users } from 'lucide-react';
import type { Representante } from './types';
import type { DrawerTab } from './types';
import { useRepresentanteDrawer } from './useRepresentanteDrawer';
import { DrawerDadosTab } from './DrawerDadosTab';
import { DrawerVendedoresTab } from './DrawerVendedoresTab';

interface RepresentanteDrawerProps {
  rep: Representante | null;
  onClose: () => void;
  onUpdated: () => void;
}

function DrawerHeader({ rep, onClose }: { rep: Representante | null; onClose: () => void }) {
  const initials = rep?.nome.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">{initials}</div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{rep?.nome}</p>
          <p className="text-xs text-gray-400 leading-tight">{rep?.email ?? rep?.codigo ?? '-'}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" aria-label="Fechar"><X size={18} /></button>
    </div>
  );
}

function DrawerTabs({ tab, setTab, rep }: { tab: DrawerTab; setTab: (t: DrawerTab) => void; rep: Representante | null }) {
  return (
    <div className="flex border-b shrink-0">
      {(['dados', 'vendedores'] as const).map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
          {t === 'dados' ? (
            <span className="flex items-center justify-center gap-1.5"><Building2 size={14} /> Dados</span>
          ) : (
            <span className="flex items-center justify-center gap-1.5"><Users size={14} /> Vendedores ({rep?.total_vendedores ?? 0})</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function RepresentanteDrawer({ rep, onClose, onUpdated }: RepresentanteDrawerProps) {
  const { state, handlers } = useRepresentanteDrawer(rep, onUpdated);
  const isOpen = rep !== null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} aria-hidden="true" />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true">
        <DrawerHeader rep={rep} onClose={onClose} />
        <DrawerTabs tab={state.tab} setTab={handlers.setTab} rep={rep} />
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {state.tab === 'dados' && rep && (
            <DrawerDadosTab rep={rep} form={state.form} editando={state.editando} salvando={state.salvando} erroSalvar={state.erroSalvar} setForm={handlers.setForm} setEditando={handlers.setEditando} setErroSalvar={handlers.setErroSalvar} onSalvar={() => { void handlers.salvarRepresentante(); }} />
          )}
          {state.tab === 'vendedores' && rep && (
            <DrawerVendedoresTab rep={rep} vendedorBancario={state.vendedorBancario} formBancario={state.formBancario} loadingBancario={state.loadingBancario} salvandoBancario={state.salvandoBancario} erroBancario={state.erroBancario} setFormBancario={handlers.setFormBancario} onAbrirBancario={(id) => { void handlers.abrirDadosBancarios(id); }} onSalvarBancario={(id) => { void handlers.salvarDadosBancarios(id); }} />
          )}
        </div>
      </div>
    </>
  );
}
