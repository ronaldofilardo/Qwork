'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importar ModalContrato dinamicamente (lazy load)
const ModalContrato = dynamic(
  () => import('@/components/modals/ModalContrato'),
  {
    ssr: false,
  }
);

interface PropostaData {
  valido: boolean;
  tomador_nome: string;
  tomador_cnpj: string;
  valor_por_funcionario: number;
  numero_funcionarios: number;
  valor_total: number;
  plano_nome: string;
  status: string;
}

export default function AceitarPropostaPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [proposta, setProposta] = useState<PropostaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  const [contratoId, setContratoId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProposta() {
      try {
        const res = await fetch(`/api/pagamento/personalizado/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Erro ao carregar proposta');
          return;
        }

        setProposta(data);
      } catch {
        setError('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProposta();
    }
  }, [token]);

  const handleAceitar = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/pagamento/personalizado/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aceitar' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao aceitar proposta');
        return;
      }

      // Abrir modal de contrato ao invés de redirecionar
      if (data.contrato?.id) {
        setContratoId(data.contrato.id);
        setMostrarModalContrato(true);
      } else {
        setError('Erro ao criar contrato');
      }
    } catch {
      setError('Erro ao processar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecusar = async () => {
    if (!confirm('Tem certeza que deseja recusar esta proposta?')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/pagamento/personalizado/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'recusar' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao recusar proposta');
        return;
      }

      alert(
        'Proposta recusada. O administrador será notificado para renegociação.'
      );
      router.push('/');
    } catch {
      setError('Erro ao processar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600">{error || 'Proposta não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8" />
              <h1 className="text-3xl font-bold">
                Proposta de Plano Personalizado
              </h1>
            </div>
            <p className="text-orange-100">
              Revise os valores e aceite para prosseguir com a contratação
            </p>
          </div>

          {/* Dados da Empresa */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Dados da Empresa
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="text-sm text-gray-500">Nome da Empresa</label>
                <p className="text-lg font-medium text-gray-900">
                  {proposta.tomador_nome}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">CNPJ</label>
                <p className="text-lg font-medium text-gray-900">
                  {proposta.tomador_cnpj}
                </p>
              </div>
            </div>
          </div>

          {/* Valores da Proposta */}
          <div className="p-8 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Valores Propostos
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Valor por Funcionário</span>
                <span className="text-2xl font-bold text-orange-600">
                  R$ {proposta.valor_por_funcionario.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-600">Número de Funcionários</span>
                <span className="text-2xl font-bold text-gray-900">
                  {proposta.numero_funcionarios}
                </span>
              </div>

              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
                <span className="text-lg font-medium">
                  Valor Total Estimado
                </span>
                <span className="text-3xl font-bold">
                  R$ {proposta.valor_total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Próximos Passos:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Aceite os valores propostos</li>
                    <li>Leia e aceite o contrato padrão</li>
                    <li>Confirme o pagamento</li>
                    <li>Crie sua senha de acesso</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <p className="text-red-800 text-center">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="p-8 bg-white border-t border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={handleRecusar}
                disabled={submitting}
                className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processando...' : 'Recusar Proposta'}
              </button>

              <button
                onClick={handleAceitar}
                disabled={submitting}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </span>
                ) : (
                  'Aceitar e Prosseguir'
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Ao aceitar, você será direcionado para a visualização do contrato
              padrão
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Contrato */}
      {mostrarModalContrato && contratoId && (
        <ModalContrato
          isOpen={mostrarModalContrato}
          onClose={() => setMostrarModalContrato(false)}
          contratoId={contratoId}
        />
      )}
    </div>
  );
}
