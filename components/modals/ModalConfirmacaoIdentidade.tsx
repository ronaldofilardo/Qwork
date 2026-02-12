'use client';

import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface ModalConfirmacaoIdentidadeProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  nome: string;
  cpf: string;
  dataNascimento: string; // Formato: YYYY-MM-DD ou DD/MM/YYYY
}

export default function ModalConfirmacaoIdentidade({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  nome,
  cpf,
  dataNascimento,
}: ModalConfirmacaoIdentidadeProps) {
  if (!isOpen) return null;

  // Formatar CPF: 000.000.000-00
  const formatarCPF = (cpfValue: string): string => {
    const apenasNumeros = cpfValue.replace(/\D/g, '');
    if (apenasNumeros.length !== 11) return cpfValue;
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9)}`;
  };

  // Formatar Data: DD/MM/AAAA
  const formatarData = (dataValue: string): string => {
    if (!dataValue) return '';

    // Se é ISO date string com T (2011-02-02T00:00:00Z), extrair data
    let dataParte = dataValue;
    if (dataParte.includes('T')) {
      dataParte = dataParte.split('T')[0];
    }

    // Se está em YYYY-MM-DD, converter para DD/MM/YYYY
    const partes = dataParte.split('-');
    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }

    // Se já está em formato DD/MM/YYYY, retornar como está
    if (dataParte.includes('/')) return dataParte;

    return dataValue;
  };

  const cpfFormatado = formatarCPF(cpf);
  const dataFormatada = formatarData(dataNascimento);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Confirmação de Identidade
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Texto principal */}
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                Você está prestes a acessar o sistema de avaliação de risco
                psicossocial.
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700">
              Por favor, confirme se os dados abaixo correspondem à sua
              identidade:
            </p>

            {/* Dados do funcionário */}
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600">•</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">Nome: </span>
                  <span className="text-gray-900">{nome}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600">•</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">CPF: </span>
                  <span className="font-mono text-gray-900">
                    {cpfFormatado}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600">•</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">
                    Data de Nascimento:{' '}
                  </span>
                  <span className="text-gray-900">{dataFormatada}</span>
                </div>
              </div>
            </div>

            {/* Declaração */}
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                Confirmo que sou <strong>{nome}</strong>, CPF{' '}
                <strong>{cpfFormatado}</strong>, e estou respondendo esta
                avaliação de forma <strong>voluntária e consciente</strong>.
              </p>
            </div>

            {/* Observação legal */}
            <p className="text-xs text-gray-500">
              Esta confirmação é obrigatória para garantir a autenticidade das
              respostas e a validade jurídica do processo avaliativo. A
              autenticidade é garantida por mecanismos de autenticação e
              integridade técnica.
            </p>
          </div>
        </div>

        {/* Footer com botões */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 p-6 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Confirmando...' : 'Confirmar Identidade'}
          </button>
        </div>
      </div>
    </div>
  );
}
