'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Stethoscope, FileText } from 'lucide-react';

interface tomador {
  id: number;
  tipo: 'clinica' | 'entidade';
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status:
    | 'pendente'
    | 'aprovado'
    | 'rejeitado'
    | 'em_reanalise'
    | '_pendente'
    | 'aguardando_pagamento'
    | 'pago';
  criado_em: string;
  pagamento_confirmado: boolean;
  data_liberacao_login?: string;
}

interface NovoscadastrosContentProps {
  _onApproved?: () => void;
}

export function NovoscadastrosContent({
  _onApproved,
}: NovoscadastrosContentProps) {
  const [tomadores, settomadores] = useState<tomador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<
    'todos' | 'clinica' | 'entidade'
  >('todos');
  const [cadastrosVisualizados, setCadastrosVisualizados] = useState<
    Set<number>
  >(new Set());

  const fetchtomadores = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/admin/novos-cadastros';
      const params = new URLSearchParams();

      if (filtroTipo !== 'todos') {
        params.append('tipo', filtroTipo);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        settomadores(data.tomadores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar tomadores:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo]);

  useEffect(() => {
    fetchtomadores();
  }, [filtroTipo, fetchtomadores]);

  const toggleVisualizacao = (id: number) => {
    const novoSet = new Set(cadastrosVisualizados);
    if (novoSet.has(id)) {
      novoSet.delete(id);
    } else {
      novoSet.add(id);
    }
    setCadastrosVisualizados(novoSet);
  };

  const getStatusBadge = (tomador: tomador) => {
    if (tomador.pagamento_confirmado) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          ✓ Pago
        </span>
      );
    }
    if (tomador.status === 'aguardando_pagamento') {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          Aguardando Pagamento
        </span>
      );
    }
    if (tomador.status === 'em_reanalise') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Em Reanálise
        </span>
      );
    }
    if (tomador.status === 'pendente') {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
          Pendente
        </span>
      );
    }
    if (tomador.status === 'pago' && !tomador.data_liberacao_login) {
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
          Pronto para Aprovação
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header com filtros */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Novos Cadastros
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filtroTipo === 'todos'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('clinica')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filtroTipo === 'clinica'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Clínicas
          </button>
          <button
            onClick={() => setFiltroTipo('entidade')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filtroTipo === 'entidade'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Entidades
          </button>
        </div>
      </div>

      {/* Lista de tomadores */}
      {tomadores.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cadastro pendente</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tomadores.map((tomador) => (
            <div
              key={tomador.id}
              className={`border border-gray-200 rounded-lg p-4 transition-all ${
                cadastrosVisualizados.has(tomador.id)
                  ? 'opacity-60 bg-gray-50'
                  : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={cadastrosVisualizados.has(tomador.id)}
                  onChange={() => toggleVisualizacao(tomador.id)}
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                />

                {/* Ícone e informações */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {tomador.tipo === 'clinica' ? (
                    <Stethoscope className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Building2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {tomador.nome}
                    </h3>
                    <p className="text-xs text-gray-500">
                      CNPJ: {tomador.cnpj}
                    </p>
                  </div>
                </div>

                {/* Tipo */}
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {tomador.tipo === 'clinica' ? 'Clínica' : 'Entidade'}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">{getStatusBadge(tomador)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
