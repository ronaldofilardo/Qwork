/**
 * Componente: Visualizador de Hash SHA-256
 *
 * Exibe o hash SHA-256 do PDF do laudo com:
 * - Formatação para fácil leitura
 * - Tooltip explicativo
 * - Botão para copiar
 * - Indicador de integridade
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface HashVisualizerProps {
  hash: string | null | undefined;
  exibirLabel?: boolean;
  compacto?: boolean;
  className?: string;
}

export function HashVisualizer({
  hash,
  exibirLabel = true,
  compacto = false,
  className = '',
}: HashVisualizerProps) {
  const [copiado, setCopiado] = useState(false);

  // Se não tem hash, exibir indicador
  if (!hash) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {exibirLabel && (
          <span className="text-xs font-medium text-gray-500">Hash:</span>
        )}
        <span
          className="text-xs text-gray-400 italic"
          title="Hash não disponível (laudo antigo ou ainda não gerado)"
        >
          Indisponível
        </span>
      </div>
    );
  }

  // Copiar hash para clipboard
  const copiarHash = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiado(true);
      toast.success('Hash copiado!', { duration: 2000 });

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch (erro) {
      console.error('[HASH] Erro ao copiar:', erro);
      toast.error('Erro ao copiar hash');
    }
  };

  // Formatar hash para exibição (quebrar em blocos)
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const formatarHash = (hash: string): string => {
    if (compacto) {
      // Compacto: primeiros 8 + ... + últimos 8
      return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    }

    // Completo: quebrar em blocos de 8 caracteres
    return hash.match(/.{1,8}/g)?.join(' ') || hash;
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      {exibirLabel && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            Hash SHA-256:
          </span>
          <span
            className="text-xs text-green-600 font-medium"
            title="Hash presente - integridade verificável"
          >
            ✓ Verificável
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
        {/* Hash */}
        <code
          className="text-xs font-mono text-gray-700 flex-1 select-all"
          title={`Hash completo: ${hash}\n\nClique no botão para copiar`}
        >
          {formatarHash(hash)}
        </code>

        {/* Botão copiar */}
        <button
          onClick={copiarHash}
          className="
            px-2 py-1 
            text-xs font-medium
            bg-blue-100 text-blue-700 
            hover:bg-blue-200 
            active:bg-blue-300
            rounded
            transition-colors
            flex items-center gap-1
          "
          title="Copiar hash completo"
        >
          {copiado ? (
            <>
              <span>✓</span>
              <span>Copiado</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Explicação */}
      {!compacto && (
        <p className="text-xs text-gray-500 mt-1">
          Este hash garante a integridade do PDF. Qualquer alteração no arquivo
          mudaria o hash.
        </p>
      )}
    </div>
  );
}

/**
 * Badge compacto de hash (para uso em cards/listas)
 */
export function HashBadge({ hash }: { hash: string | null | undefined }) {
  if (!hash) {
    return (
      <span
        className="
          inline-flex items-center gap-1 
          px-2 py-1 
          text-xs font-medium 
          bg-gray-100 text-gray-500 
          border border-gray-300 
          rounded-full
        "
        title="Hash não disponível"
      >
        <span>🔒</span>
        <span>Sem hash</span>
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex items-center gap-1 
        px-2 py-1 
        text-xs font-medium 
        bg-green-100 text-green-700 
        border border-green-300 
        rounded-full
        cursor-help
      "
      title={`Hash SHA-256: ${hash}\n\nGarante a integridade do PDF`}
    >
      <span>🔒</span>
      <span>{hash.slice(0, 8)}...</span>
    </span>
  );
}

/**
 * Comparador de hashes (para verificação de integridade)
 */
interface HashComparadorProps {
  hashEsperado: string;
  hashCalculado: string;
  className?: string;
}

export function HashComparador({
  hashEsperado,
  hashCalculado,
  className = '',
}: HashComparadorProps) {
  const saoIguais = hashEsperado === hashCalculado;

  return (
    <div
      className={`p-4 border rounded-lg ${
        saoIguais ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{saoIguais ? '✓' : '✗'}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-2">
            {saoIguais
              ? 'Integridade Verificada'
              : 'Falha na Verificação de Integridade'}
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">Hash Esperado:</span>
              <code className="block mt-1 p-2 bg-white rounded border font-mono">
                {hashEsperado}
              </code>
            </div>

            <div>
              <span className="font-medium text-gray-600">Hash Calculado:</span>
              <code className="block mt-1 p-2 bg-white rounded border font-mono">
                {hashCalculado}
              </code>
            </div>
          </div>

          {!saoIguais && (
            <p className="mt-3 text-sm text-red-700 font-medium">
              ⚠️ Os hashes não correspondem. O arquivo pode ter sido alterado ou
              corrompido.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
