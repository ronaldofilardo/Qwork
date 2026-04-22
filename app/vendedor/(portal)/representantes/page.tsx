'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users } from 'lucide-react';

interface Vinculo {
  vinculo_id: number;
  representante_id: number;
  representante_nome: string;
  representante_email: string;
  representante_status: string;
  leads_ativos_representante: number;
  vinculado_em: string;
}

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto: 'bg-green-100 text-green-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-600',
};

export default function VendedorRepresentantesPage() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/vendedor/vinculos');
      if (res.ok) {
        const d = await res.json();
        setVinculos(d.vinculos ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Representantes</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {vinculos.length} representante{vinculos.length !== 1 ? 's' : ''}{' '}
          vinculado{vinculos.length !== 1 ? 's' : ''} à sua conta
        </p>
      </div>

      {vinculos.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            Nenhum representante vinculado ainda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Entre em contato com o departamento comercial para solicitar
            vínculos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Leads Ativos</th>
                <th className="px-4 py-3 text-right">Vinculado em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vinculos.map((v) => (
                <tr key={v.vinculo_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {v.representante_nome}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.representante_email ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    #{v.representante_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[v.representante_status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {v.representante_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">
                    {v.leads_ativos_representante}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {new Date(v.vinculado_em).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
