'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  DollarSign,
} from 'lucide-react';

interface PropostaData {
  valido: boolean;
  contratacao_id: number;
  contratante_id: number;
  contratante_nome: string;
  cnpj: string;
  responsavel_nome: string;
  responsavel_email: string;
  plano_nome: string;
  plano_tipo: string;
  numero_funcionarios: number;
  valor_por_funcionario: number;
  valor_total: number;
  expira_em: string;
  error?: string;
}

export default function PropostaPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [proposta, setProposta] = useState<PropostaData | null>(null);
  const [aceito, setAceito] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const carregarProposta = async () => {
      if (!token) {
        setErro('Link inválido');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/proposta/${token}`);
        const data = await response.json();

        if (!data.valido) {
          throw new Error(data.error || 'Proposta inválida ou expirada');
        }

        setProposta(data);
      } catch (error) {
        console.error('Erro ao carregar proposta:', error);
        setErro(
          error instanceof Error ? error.message : 'Erro ao carregar proposta'
        );
      } finally {
        setLoading(false);
      }
    };

    carregarProposta();
  }, [token]);

  const handleAceitar = async () => {
    if (!aceito || !proposta || processando) return;

    setProcessando(true);
    try {
      const response = await fetch('/api/proposta/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratacao_id: proposta.contratacao_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar proposta');
      }

      // Redirecionar para página de contrato
      router.push(data.redirect_url);
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao aceitar proposta'
      );
      setProcessando(false);
    }
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarCNPJ = (cnpj: string): string => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (erro || !proposta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Erro</h2>
          </div>
          <p className="text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <QworkLogo size="lg" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Proposta de Plano Personalizado
          </h1>
          <p className="mt-2 text-gray-600">
            Revise os detalhes da sua proposta personalizada
          </p>
        </div>

        {/* Alerta de Validade */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Link válido até {formatarData(proposta.expira_em)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Esta proposta foi especialmente preparada para você. Aceite
                dentro do prazo para garantir estes valores.
              </p>
            </div>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Informações do Contratante */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Dados do Contratante
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Empresa:
                </span>
                <p className="text-gray-900">{proposta.contratante_nome}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">CNPJ:</span>
                <p className="text-gray-900">{formatarCNPJ(proposta.cnpj)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Responsável:
                </span>
                <p className="text-gray-900">{proposta.responsavel_nome}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  E-mail:
                </span>
                <p className="text-gray-900">{proposta.responsavel_email}</p>
              </div>
            </div>
          </div>

          {/* Detalhes da Proposta */}
          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Detalhes da Proposta
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plano */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-500">
                    Tipo de Plano
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {proposta.plano_nome}
                </p>
              </div>

              {/* Número de Funcionários */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-500">
                    Funcionários
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {proposta.numero_funcionarios}
                </p>
              </div>

              {/* Valor por Funcionário */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-500">
                    Valor por Funcionário
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatarMoeda(proposta.valor_por_funcionario)}
                </p>
              </div>

              {/* Valor Total */}
              <div className="bg-orange-600 text-white rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">
                    Valor Total
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {formatarMoeda(proposta.valor_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Aceite */}
          <div className="p-6 border-t border-gray-200">
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={(e) => setAceito(e.target.checked)}
                  className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Declaro que li e estou de acordo com os valores e condições
                  apresentados nesta proposta. Ao aceitar, serei direcionado
                  para o contrato padrão de prestação de serviços.
                </span>
              </label>
            </div>

            <button
              onClick={handleAceitar}
              disabled={!aceito || processando}
              className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                aceito && !processando
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {processando ? 'Processando...' : 'Aceitar Proposta e Continuar'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Após aceitar a proposta, você será direcionado para revisar e
              aceitar o contrato de prestação de serviços.
            </p>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Precisa de ajuda? Entre em contato conosco através do e-mail{' '}
            <a
              href="mailto:suporte@qwork.com.br"
              className="text-orange-600 hover:underline"
            >
              suporte@qwork.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
