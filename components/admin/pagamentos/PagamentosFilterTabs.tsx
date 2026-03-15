'use client';

import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  CalendarClock,
} from 'lucide-react';
import type { FilterTab } from './types';

interface PagamentosFilterTabsProps {
  filterTab: FilterTab;
  setFilterTab: (tab: FilterTab) => void;
  getTabCount: (tab: FilterTab) => number;
}

const TABS: { key: FilterTab; label: string; icon: typeof Clock }[] = [
  { key: 'aguardando_cobranca', label: 'Aguardando Cobrança', icon: Clock },
  {
    key: 'aguardando_pagamento',
    label: 'Aguardando Pagamento',
    icon: CreditCard,
  },
  { key: 'a_vencer', label: 'A Vencer', icon: CalendarClock },
  { key: 'pago', label: 'Pagos', icon: CheckCircle },
  { key: 'todos', label: 'Todos', icon: DollarSign },
];

export function PagamentosFilterTabs({
  filterTab,
  setFilterTab,
  getTabCount,
}: PagamentosFilterTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = getTabCount(tab.key);
          const isActive = filterTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`
                group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {count >= 0 && (
                <span
                  className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                  ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
