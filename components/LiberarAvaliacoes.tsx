'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function LiberarAvaliacoes() {
  const [loading, setLoading] = useState(false);

  async function liberar() {
    setLoading(true);

    try {
      const res = await fetch('/api/avaliacao/liberar-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forcarNova: true }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Avaliações liberadas com sucesso!\nNovas criadas: ${data.criadas}\nTotal: ${data.total} funcionário(s)`,
          {
            duration: 8000,
            style: { whiteSpace: 'pre-line' },
          }
        );
      } else {
        toast.error(data.error || 'Erro ao liberar');
      }
    } catch {
      toast.error('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button
        onClick={liberar}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-70"
      >
        {loading
          ? 'Liberando...'
          : 'Liberar Avaliações para Todos Funcionários Ativos'}
      </button>
    </div>
  );
}
