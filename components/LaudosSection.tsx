'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, Calendar, Building, User } from 'lucide-react';

interface Laudo {
  id: number;
  lote_id: number;
  codigo: string;
  titulo: string;
  empresa_nome: string;
  clinica_nome: string;
  emissor_nome: string;
  enviado_em: string;
  hash: string;
}

export default function LaudosSection({
  empresaId,
}: {
  empresaId?: number | string;
}) {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  const fetchLaudos = async () => {
    try {
      setLoading(true);
      const url = empresaId
        ? `/api/rh/laudos?empresa_id=${empresaId}`
        : '/api/rh/laudos';
      const response = await fetch(url);
      const data = await response.json();

      if (data?.success) {
        setLaudos(data.laudos || []);
      }
    } catch (error: unknown) {
      console.error('Erro ao buscar laudos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaudos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const handleDownload = async (laudo: Laudo) => {
    try {
      setDownloading(laudo.id);
      const response = await fetch(`/api/rh/laudos/${laudo.id}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Erro ao baixar laudo: ${errorData.error}`);
        return;
      }

      // Criar blob e download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${laudo.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do laudo');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-800">Laudos</h3>
      </div>

      {laudos.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum laudo disponível
          </h4>
          <p className="text-gray-500">
            Os laudos aparecerão aqui quando forem enviados pelos emissores.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {laudos.map((laudo) => (
            <div
              key={laudo.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {laudo.titulo}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Lote: {laudo.codigo}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building size={14} />
                      <span>{laudo.empresa_nome}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>Emissor: {laudo.emissor_nome}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Enviado em {formatDate(laudo.enviado_em)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      <span className="flex items-center gap-2">
                        <span>Hash: {truncateHash(laudo.hash)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard
                              .writeText(laudo.hash)
                              .then(() => toast.success('Hash copiado'))
                              .catch(() =>
                                toast.error('Não foi possível copiar o hash')
                              );
                          }}
                          aria-label={`Copiar hash do laudo ${laudo.id}`}
                          title="Copiar hash"
                          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                          Copiar
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(laudo)}
                  disabled={downloading === laudo.id}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors ml-4"
                >
                  {downloading === laudo.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
