'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
} from 'lucide-react';

interface PlanoInfo {
  id: number;
  plano_nome: string;
  plano_tipo: string;
  plano_descricao: string;
  numero_funcionarios_estimado: number;
  numero_funcionarios_atual: number;
  valor_pago: number | null;
  tipo_pagamento: string | null;
  modalidade_pagamento: string | null;
  numero_parcelas: number | null;
  status: string;
  data_contratacao: string;
  data_fim_vigencia: string;
  contrato_numero: string | null;
  contrato_conteudo: string | null;
}

interface MeuPlanoSectionProps {
  contratanteId: number;
}

export default function MeuPlanoSection({
  contratanteId,
}: MeuPlanoSectionProps) {
  const [plano, setPlano] = useState<PlanoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const fetchPlanoInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contratante/meu-plano`);
      if (response.ok) {
        const data = await response.json();
        setPlano(data.plano || null);
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanoInfo();
  }, [contratanteId]);

  const handleBaixarContrato = async () => {
    if (!plano?.contrato_numero) return;

    try {
      setDownloadingPDF(true);
      const response = await fetch(`/api/contratante/contrato-pdf`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato-${plano.contrato_numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao baixar contrato');
      }
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      alert('Erro ao baixar contrato');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatarValor = (valor: number | null) => {
    if (!valor) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getTipoPagamentoLabel = (tipo: string | null) => {
    const tipos: Record<string, string> = {
      boleto: 'Boleto',
      cartao: 'Cartão',
      pix: 'PIX',
    };
    return tipos[tipo || ''] || 'Não informado';
  };

  const getModalidadeLabel = (modalidade: string | null) => {
    const modalidades: Record<string, string> = {
      a_vista: 'À vista',
      parcelado: 'Parcelado',
    };
    return modalidades[modalidade || ''] || 'Não informado';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">Meu Plano</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-400">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">Meu Plano</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Nenhum plano ativo encontrado
          </h3>
          <p className="text-yellow-700">
            Entre em contato com o administrador para mais informações.
          </p>
        </div>
      </div>
    );
  }

  const diasRestantes = Math.ceil(
    (new Date(plano.data_fim_vigencia).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900">Meu Plano</h2>
        </div>
        {plano.contrato_numero && (
          <button
            onClick={handleBaixarContrato}
            disabled={downloadingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {downloadingPDF ? 'Gerando PDF...' : 'Baixar Contrato PDF'}
          </button>
        )}
      </div>

      {/* Status do plano */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {plano.plano_nome}
            </h3>
            <p className="text-sm text-gray-600">{plano.plano_descricao}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              plano.status === 'ativo'
                ? 'bg-green-100 text-green-800'
                : plano.status === 'vencido'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {plano.status.toUpperCase()}
          </span>
        </div>

        {/* Alerta de vencimento próximo */}
        {diasRestantes > 0 && diasRestantes <= 30 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Seu plano vence em {diasRestantes}{' '}
                dia(s). Entre em contato para renovação.
              </p>
            </div>
          </div>
        )}

        {/* Grid de informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Funcionários
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {plano.numero_funcionarios_atual}
            </div>
            <div className="text-xs text-gray-500">
              de {plano.numero_funcionarios_estimado} estimados
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Valor Pago
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatarValor(plano.valor_pago)}
            </div>
            <div className="text-xs text-gray-500">
              {getModalidadeLabel(plano.modalidade_pagamento)}
              {plano.numero_parcelas &&
                plano.modalidade_pagamento === 'parcelado' &&
                ` (${plano.numero_parcelas}x)`}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                Tipo de Pagamento
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {getTipoPagamentoLabel(plano.tipo_pagamento)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">
                Vigência
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatarData(plano.data_contratacao)}
            </div>
            <div className="text-xs text-gray-500">
              até {formatarData(plano.data_fim_vigencia)}
            </div>
          </div>
        </div>
      </div>

      {/* Informações do contrato */}
      {plano.contrato_numero && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Informações do Contrato
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Número do Contrato:</span>
              <span className="font-semibold text-gray-900">
                {plano.contrato_numero}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data de Contratação:</span>
              <span className="font-semibold text-gray-900">
                {formatarData(plano.data_contratacao)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Validade:</span>
              <span className="font-semibold text-gray-900">
                {formatarData(plano.data_fim_vigencia)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
