'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import { AlertCircle } from 'lucide-react';

interface DadosPlano {
  tomador_id: number;
  tomador_nome: string;
  plano_id: number;
  plano_nome: string;
  numero_funcionarios: number;
  valor_total: number;
}

export default function AceitePlanoPersonalizadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contratacaoId = searchParams.get('contratacao_id');

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosPlano | null>(null);
  const [aceito, setAceito] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!contratacaoId) {
        setErro('ID da contratação não fornecido');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/contratacao_personalizada/${contratacaoId}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Dados inválidos');
        }

        const data = await response.json();
        if (!data.valido) {
          throw new Error(data.error || 'Dados inválidos');
        }

        setDados({
          tomador_id: data.tomador_id,
          tomador_nome: data.tomador_nome,
          plano_id: 0, // personalizado não tem id de plano fixo aqui
          plano_nome: 'Personalizado',
          numero_funcionarios: data.numero_funcionarios,
          valor_total: data.valor_total,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setErro(
          error instanceof Error ? error.message : 'Erro ao carregar dados'
        );
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [contratacaoId]);

  const handleAceitar = () => {
    if (!aceito || !dados) return;

    setProcessando(true);
    try {
      // Aqui podemos adicionar uma chamada para registrar o aceite se necessário
      // Por enquanto, apenas redirecionar para o simulador (sem token)

      router.push(`/pagamento/simulador?contratacao_id=${contratacaoId}`);
    } catch (error) {
      console.error('Erro ao processar aceite:', error);
      setErro('Erro ao processar aceite');
    } finally {
      setProcessando(false);
    }
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
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
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <QworkLogo size="lg" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Aceite do Plano Personalizado
          </h1>
          <p className="mt-2 text-gray-600">
            Confirme os detalhes do seu plano personalizado antes de prosseguir
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Informações do tomador */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              tomador
            </h2>
            <p className="text-gray-600">{dados.tomador_nome}</p>
          </div>

          {/* Detalhes do Plano */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Detalhes do Plano
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plano:</span>
                <span className="font-semibold text-gray-900">
                  {dados.plano_nome}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Número de funcionários:</span>
                <span className="font-semibold text-gray-900">
                  {dados.numero_funcionarios}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-bold text-gray-900">
                  Valor Total:
                </span>
                <span className="text-lg font-bold text-orange-600">
                  {formatarMoeda(dados.valor_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkbox de Aceite */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceito}
                onChange={(e) => setAceito(e.target.checked)}
                className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                <strong className="text-orange-700">
                  Declaro que aceito o valor e as condições do plano
                  personalizado
                </strong>
                <br />
                Confirmo que o valor de {formatarMoeda(
                  dados.valor_total
                )} para {dados.numero_funcionarios} funcionários está correto e
                estou de acordo com os termos.
              </span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              disabled={processando}
            >
              Voltar
            </button>
            <button
              onClick={handleAceitar}
              disabled={!aceito || processando}
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processando ? 'Processando...' : 'Aceitar e Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
