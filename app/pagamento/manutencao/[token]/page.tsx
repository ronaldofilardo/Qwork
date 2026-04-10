'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, Building2, Wrench } from 'lucide-react';
import CheckoutAsaas from '@/components/CheckoutAsaas';

interface PageProps {
  params: {
    token: string;
  };
}

interface DadosManutencao {
  pagamento_id: number;
  tomador_id: number;
  valor: number;
  nome: string;
  cnpj: string;
  clinica_nome: string | null;
  enviado_em: string;
}

export default function PagamentoManutencaoPage({ params }: PageProps) {
  const [dados, setDados] = useState<DadosManutencao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pago, setPago] = useState(false);
  const router = useRouter();

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pagamento/manutencao/${params.token}/info`);
      const data = await res.json();

      if (res.ok) {
        setDados(data);
      } else {
        if (data.already_paid) {
          setPago(true);
        }
        setErro(data.error || 'Erro ao carregar dados');
      }
    } catch {
      setErro('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleAsaasSuccess = () => {
    router.push('/pagamento/emissao/sucesso');
  };

  const handleAsaasError = (errorMsg: string) => {
    setErro(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 p-6 text-center">
          <Clock className="animate-spin h-12 w-12 mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando informações...
          </p>
        </div>
      </div>
    );
  }

  if (erro || pago) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              {pago ? 'Já Foi Pago' : 'Erro'}
            </h2>
          </div>
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{erro}</p>
            {pago && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Este link já foi utilizado. O pagamento da taxa de manutenção
                foi confirmado.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!dados) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Taxa de Manutenção</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete o pagamento para manter o acesso ao sistema
          </p>
        </div>

        {/* Card de Informações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Informações do Pagamento
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{dados.nome}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  CNPJ: {dados.cnpj}
                </p>
                {dados.clinica_nome && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clínica: {dados.clinica_nome}
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Taxa de Manutenção Anual
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {dados.valor.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg mt-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>⚠️ Link de uso único:</strong> Este link será invalidado
                após o pagamento.
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Asaas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-bold text-lg">Escolha a Forma de Pagamento</h2>
          </div>
          <div className="p-4">
            <CheckoutAsaas
              tomadorId={dados.tomador_id}
              numeroFuncionarios={1}
              valor={dados.valor}
              contratoId={null}
              loteId={null}
              onSuccess={handleAsaasSuccess}
              onError={handleAsaasError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
