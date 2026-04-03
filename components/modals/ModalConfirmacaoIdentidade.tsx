'use client';

import { X, ShieldCheck, Loader2, Lock } from 'lucide-react';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="relative w-full max-w-lg sm:max-w-2xl rounded-lg bg-white shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="rounded-full bg-green-100 p-1.5 sm:p-2 flex-shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
              Confirmação de Identidade
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 flex-shrink-0 touch-target"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - scrollável */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="space-y-4 sm:space-y-6">
            {/* Banner de anonimização */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
              <div className="flex-shrink-0 mt-0.5">
                <Lock
                  className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                  Suas respostas são anônimas e confidenciais
                </p>
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  Nenhuma pessoa — incluindo seu RH, gestores ou a empresa —
                  terá acesso às suas respostas individuais. Somente relatórios
                  consolidados do grupo são gerados, garantindo total sigilo das
                  suas respostas.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-gray-700">
              Por favor, confirme se os dados abaixo correspondem à sua
              identidade:
            </p>

            {/* Dados do funcionário */}
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600 flex-shrink-0">•</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-700 text-sm">
                    Nome:{' '}
                  </span>
                  <span className="text-gray-900 text-sm break-words">
                    {nome}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600 flex-shrink-0">•</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-700 text-sm">
                    CPF:{' '}
                  </span>
                  <span className="text-gray-900 text-sm tracking-wide">
                    {cpfFormatado}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-orange-600 flex-shrink-0">•</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-700 text-sm">
                    Data de Nascimento:{' '}
                  </span>
                  <span className="text-gray-900 text-sm">{dataFormatada}</span>
                </div>
              </div>
            </div>

            {/* Declaração — incisos I–V */}
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                Ao acessar a plataforma QWORK utilizando CPF e data de
                nascimento, declaro que:
              </p>
              <ol className="list-none space-y-1">
                <li className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">I –</span> sou o próprio
                  colaborador autorizado pela empresa para responder ao
                  questionário;
                </li>
                <li className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">II –</span> estou acessando a
                  plataforma de forma pessoal e voluntária;
                </li>
                <li className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">III –</span> compreendo que o
                  questionário possui finalidade exclusivamente organizacional;
                </li>
                <li className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">IV –</span> estou ciente de que
                  não se trata de avaliação psicológica clínica individual;
                </li>
                <li className="text-xs sm:text-sm text-gray-700">
                  <span className="font-medium">V –</span> autorizo a utilização
                  das respostas para elaboração de relatório organizacional
                  consolidado.
                </li>
              </ol>
            </div>

            {/* Declaração de Ausência de Prontuário Psicológico */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                Declaração de Ausência de Prontuário Psicológico
              </p>
              <p className="text-xs sm:text-sm text-gray-700 mb-1">
                A utilização da plataforma QWORK não gera prontuário psicológico
                individual.
              </p>
              <p className="text-xs sm:text-sm text-gray-700 mb-1">
                As respostas fornecidas pelos colaboradores são utilizadas
                exclusivamente para fins estatísticos e organizacionais, não
                constituindo avaliação clínica, diagnóstico psicológico ou
                registro terapêutico.
              </p>
              <p className="text-xs sm:text-sm text-gray-700">
                A plataforma opera como instrumento de apoio à gestão
                organizacional de riscos psicossociais.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com botões */}
        <div
          className="flex flex-col-reverse gap-3 border-t border-gray-200 p-4 sm:p-6 sm:flex-row sm:justify-end flex-shrink-0"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Confirmando...' : 'Confirmar Identidade'}
          </button>
        </div>
      </div>
    </div>
  );
}
