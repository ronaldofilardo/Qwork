'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, FileText } from 'lucide-react';

interface Laudo {
  id: number;
  lote_id: number;
  lote_id: number;
  lote_titulo: string;
  status: string;
  data_emissao?: string;
  arquivos: {
    relatorio_individual?: string;
    relatorio_lote?: string;
    relatorio_setor?: string;
  };
}

export default function LaudosEntidadePage() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLaudos = async () => {
      try {
        const res = await fetch('/api/entidade/laudos');
        if (res.ok) {
          const data = await res.json();
          setLaudos(data.laudos || []);
        }
      } catch (error) {
        console.error('Erro ao buscar laudos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLaudos();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laudos</h1>
        <p className="text-gray-600">
          Dossiês de laudos emitidos para os lotes de avaliação
        </p>
      </div>

      {laudos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <FolderOpen className="mx-auto text-gray-400" size={48} />
          <p className="text-gray-600 mt-4">Nenhum laudo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laudos.map((laudo) => (
            <div
              key={laudo.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {laudo.lote_titulo}
                  </h3>
                  <p className="text-sm text-gray-500">{laudo.lote_codigo}</p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    laudo.status === 'emitido'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {laudo.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>Arquivos do dossiê:</p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" />
                      <span className="text-xs">
                        {laudo.arquivos.relatorio_individual
                          ? 'Relatório Individual'
                          : 'Relatório Individual (pendente)'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText size={14} className="text-purple-500" />
                      <span className="text-xs">
                        {laudo.arquivos.relatorio_lote
                          ? 'Relatório de Lote'
                          : 'Relatório de Lote (pendente)'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText size={14} className="text-green-500" />
                      <span className="text-xs">
                        {laudo.arquivos.relatorio_setor
                          ? 'Relatório Setorial'
                          : 'Relatório Setorial (pendente)'}
                      </span>
                    </li>
                  </ul>
                </div>

                {laudo.data_emissao && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    Emitido em: {formatDate(laudo.data_emissao)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
