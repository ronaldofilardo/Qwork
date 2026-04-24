import type { AuditoriaSubTab } from './types';

interface AuditoriaSubNavProps {
  auditoriaSubTab: AuditoriaSubTab;
  setAuditoriaSubTab: (tab: AuditoriaSubTab) => void;
}

const TABS: { key: AuditoriaSubTab; label: string }[] = [
  { key: 'gestores', label: 'Gestores' },
  { key: 'avaliacoes', label: 'Avaliações' },
  { key: 'lotes', label: 'Lotes' },
  { key: 'laudos', label: 'Laudos' },
  { key: 'operacionais', label: 'Operacionais' },
  { key: 'aceites', label: 'Aceites' },
  { key: 'acesso-suporte', label: 'Suporte' },
  { key: 'comissoes-leads', label: 'Comissões' },
  { key: 'delecao', label: 'Deleção' },
];

export function AuditoriaSubNav({
  auditoriaSubTab,
  setAuditoriaSubTab,
}: AuditoriaSubNavProps) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow p-2">
      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAuditoriaSubTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              auditoriaSubTab === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
