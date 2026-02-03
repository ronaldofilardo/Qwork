'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, FileText, Download } from 'lucide-react';

interface Laudo {
  id: number;
  lote_id: number;
  lote_titulo: string;
  empresa_nome?: string;
  status: string;
  data_emissao?: string;
  arquivos: {
    relatorio_individual?: string;
    relatorio_lote?: string;
    relatorio_setor?: string;
  };
}

export default function LaudosSection() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLaudos = async () => {
    try {
      const res = await fetch('/api/rh/laudos');
      if (res.ok) {
        const data = await res.json();
        setLaudos(data.laudos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar laudos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'emitido':
      case 'enviado':
        return 'bg-green-100 text-green-800';
      case 'rascunho':
        return 'bg-yellow-100 text-yellow-800';
      case 'processando':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laudos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Laudos emitidos para empresas clientes
        </p>
      </div>

      {/* Estatísticas de Laudos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FolderOpen className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {laudos.length}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total de Laudos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {
                laudos.filter((l) => l.status.toLowerCase() === 'emitido')
                  .length
              }
            </span>
          </div>
          <p className="text-sm text-gray-600">Laudos Emitidos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="text-yellow-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {
                laudos.filter((l) => l.status.toLowerCase() === 'rascunho')
                  .length
              }
            </span>
          </div>
          <p className="text-sm text-gray-600">Laudos em Elaboração</p>
        </div>
      </div>

      {/* Tabela de Laudos */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lista de Laudos
        </h2>

        {laudos.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4">Nenhum laudo disponível</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Lote
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                    Empresa
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                    Data Emissão
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {laudos.map((laudo) => (
                  <tr
                    key={laudo.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Lote #{laudo.lote_id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {laudo.lote_titulo}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 hidden md:table-cell">
                      {laudo.empresa_nome || '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-700 hidden lg:table-cell">
                      {formatDate(laudo.data_emissao)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(laudo.status)}`}
                      >
                        {laudo.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {laudo.status.toLowerCase() === 'emitido' &&
                        laudo.arquivos.relatorio_lote && (
                          <a
                            href={laudo.arquivos.relatorio_lote}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded text-xs font-medium transition-colors"
                          >
                            <Download size={14} />
                            Baixar
                          </a>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
