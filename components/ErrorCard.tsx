/**
 * Componente: Card de Erro para Emissor
 *
 * Exibe erros de forma estruturada e legível, com:
 * - Mensagem amigável para usuário
 * - Código de erro para suporte
 * - Detalhes técnicos (colapsável)
 * - Ações sugeridas
 */

/* eslint-disable */
'use client';

import { useState } from 'react';
import type { ErroEstruturado, CodigoErro } from '@/lib/services/error-logger';

interface ErrorCardProps {
  erro: ErroEstruturado | Error | any;
  onTentarNovamente?: () => void;
  onVoltar?: () => void;
}

export function ErrorCard({
  erro,
  onTentarNovamente,
  onVoltar,
}: ErrorCardProps) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Extrair informações do erro
  const codigo = erro?.codigo || 'E5004';
  const mensagemUsuario =
    erro?.mensagemUsuario ||
    erro?.message ||
    'Ocorreu um erro inesperado. Tente novamente.';
  const mensagemTecnica = erro?.mensagem || erro?.message;
  const contexto = erro?.contexto;
  const stackTrace = erro?.stackTrace || erro?.stack;
  const timestamp = erro?.timestamp
    ? new Date(erro.timestamp).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  // Obter ações sugeridas baseado no código
  const acoesSugeridas = getAcoesSugeridas(codigo);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-red-50 border-2 border-red-300 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-900 mb-1">
            Erro na Emissão do Laudo
          </h3>
          <p className="text-sm text-red-700 leading-relaxed">
            {mensagemUsuario}
          </p>
        </div>
      </div>

      {/* Código e Timestamp */}
      <div className="mb-4 p-3 bg-white border border-red-200 rounded-lg">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="font-semibold text-gray-600">Código:</span>{' '}
            <code className="font-mono text-red-700 font-bold">{codigo}</code>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Horário:</span>{' '}
            <span className="text-gray-700">{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Ações Sugeridas */}
      {acoesSugeridas.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            💡 O que fazer:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            {acoesSugeridas.map((acao, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{acao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-3 mb-4">
        {onTentarNovamente && (
          <button
            onClick={onTentarNovamente}
            className="
              flex-1 px-4 py-2
              bg-blue-600 text-white
              hover:bg-blue-700
              active:bg-blue-800
              rounded-lg
              font-semibold
              transition-colors
              flex items-center justify-center gap-2
            "
          >
            <span>🔄</span>
            <span>Tentar Novamente</span>
          </button>
        )}

        {onVoltar && (
          <button
            onClick={onVoltar}
            className="
              flex-1 px-4 py-2
              bg-gray-200 text-gray-700
              hover:bg-gray-300
              active:bg-gray-400
              rounded-lg
              font-semibold
              transition-colors
              flex items-center justify-center gap-2
            "
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
        )}
      </div>

      {/* Detalhes Técnicos (colapsável) */}
      <div>
        <button
          onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
          className="
            w-full px-3 py-2
            text-sm font-medium text-gray-600
            bg-gray-100 hover:bg-gray-200
            rounded-lg
            transition-colors
            flex items-center justify-between
          "
        >
          <span>Detalhes Técnicos (para suporte)</span>
          <span className="text-lg">{mostrarDetalhes ? '▼' : '▶'}</span>
        </button>

        {mostrarDetalhes && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-2">
            {mensagemTecnica && (
              <div>
                <span className="font-semibold text-gray-700">Mensagem:</span>
                <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto">
                  {mensagemTecnica}
                </pre>
              </div>
            )}

            {contexto && Object.keys(contexto).length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Contexto:</span>
                <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto">
                  {JSON.stringify(contexto, null, 2)}
                </pre>
              </div>
            )}

            {stackTrace && (
              <div>
                <span className="font-semibold text-gray-700">
                  Stack Trace:
                </span>
                <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto text-xs">
                  {stackTrace}
                </pre>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-gray-600">
                <strong>
                  Ao reportar este erro ao suporte, informe o código{' '}
                  <code className="font-mono font-bold text-red-700">
                    {codigo}
                  </code>{' '}
                  e o horário <code className="font-mono">{timestamp}</code>.
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Obter ações sugeridas baseado no código de erro
 */
function getAcoesSugeridas(codigo: string): string[] {
  const acoes: Record<string, string[]> = {
    E4001: [
      'Verifique se o número do lote está correto',
      'Atualize a página e tente novamente',
    ],
    E4002: [
      'Aguarde a conclusão de todas as avaliações',
      'Verifique o status do lote no dashboard',
    ],
    E4003: [
      'Verifique se o laudo já foi emitido anteriormente',
      'Se necessário, entre em contato com o suporte',
    ],
    E4004: [
      'Complete todas as avaliações pendentes',
      'Verifique se há avaliações inativas que devem ser reativadas',
    ],
    E4005: ['Verifique suas permissões com o administrador'],
    E5001: [
      'Aguarde alguns instantes e tente novamente',
      'Se o problema persistir, reduza o número de avaliações no lote',
    ],
    E5002: [
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns minutos',
    ],
    E5003: [
      'Tente novamente em alguns instantes',
      'Se o problema persistir, contate o suporte técnico',
    ],
    E5005: [
      'Reduza o número de avaliações no lote',
      'Tente novamente quando o servidor estiver menos sobrecarregado',
    ],
    E5101: ['Entre em contato com o suporte técnico imediatamente'],
    E5102: [
      'Tente gerar o PDF novamente',
      'Se o problema persistir, contate o suporte',
    ],
  };

  return (
    acoes[codigo] || [
      'Aguarde alguns instantes e tente novamente',
      'Se o problema persistir, entre em contato com o suporte técnico',
    ]
  );
}
