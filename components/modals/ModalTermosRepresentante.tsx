'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  ScrollText,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import ContratoRepresentante from '@/components/terms/ContratoRepresentante';
import TermosUnificados from '@/components/terms/TermosUnificados';

type TipoDoc = 'contrato_nao_clt' | 'termos_unificados';

interface DocConfig {
  tipo: TipoDoc;
  titulo: string;
  subtitulo: string;
  icon: React.ReactNode;
  requireScroll: boolean;
}

interface Props {
  onConcluir: () => void;
}

const DOCS: DocConfig[] = [
  {
    tipo: 'contrato_nao_clt',
    titulo: 'Contrato de Representação Comercial',
    subtitulo: 'Contrato Independente — Sem Vínculo CLT',
    icon: <ScrollText className="text-orange-600" size={22} />,
    requireScroll: true,
  },
  {
    tipo: 'termos_unificados',
    titulo: 'Termos de Uso e Política de Privacidade',
    subtitulo: 'Condições de utilização e tratamento de dados (LGPD)',
    icon: <FileText className="text-blue-600" size={22} />,
    requireScroll: false,
  },
];

function DocContent({ tipo }: { tipo: TipoDoc }) {
  switch (tipo) {
    case 'contrato_nao_clt':
      return <ContratoRepresentante />;
    case 'termos_unificados':
      return <TermosUnificados />;
  }
}

interface SubModalProps {
  doc: DocConfig;
  onAceitar: () => Promise<void>;
  onVoltar: () => void;
}

function SubModalLeitura({ doc, onAceitar, onVoltar }: SubModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(!doc.requireScroll);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!doc.requireScroll) return;

    const checkInitialScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.clientHeight >= el.scrollHeight) {
        setScrolledToEnd(true);
      }
    };
    const t = setTimeout(checkInitialScroll, 150);
    return () => clearTimeout(t);
  }, [doc.requireScroll]);

  const handleScroll = useCallback(() => {
    if (!doc.requireScroll || !scrollRef.current) return;
    const el = scrollRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
      setScrolledToEnd(true);
    }
  }, [doc.requireScroll]);

  const handleAceitar = async () => {
    if (processando) return;
    setProcessando(true);
    try {
      await onAceitar();
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0 bg-gray-50 rounded-t-xl">
          {doc.icon}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{doc.titulo}</h2>
            <p className="text-xs text-gray-500">{doc.subtitulo}</p>
          </div>
        </div>

        {/* Aviso scroll — apenas para o contrato */}
        {doc.requireScroll && !scrolledToEnd && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm flex-shrink-0">
            <AlertCircle size={16} />
            <span>
              Role até o final do documento para habilitar o botão &ldquo;Li e
              Concordo&rdquo;.
            </span>
          </div>
        )}

        {/* Conteúdo scrollável */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          <DocContent tipo={doc.tipo} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between rounded-b-xl flex-shrink-0">
          <button
            onClick={onVoltar}
            disabled={processando}
            className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>

          <button
            onClick={handleAceitar}
            disabled={!scrolledToEnd || processando}
            className="flex items-center gap-2 px-6 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-orange-400 focus:outline-none"
            aria-label={`Aceitar ${doc.titulo}`}
          >
            {processando ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Processando...
              </>
            ) : (
              <>
                <CheckCircle size={15} /> Li e Concordo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ModalTermosRepresentante
 *
 * Modal bloqueante exibido no primeiro acesso do representante ao portal.
 * Exige a leitura e aceite de 2 documentos:
 *   1. Contrato de Representação (exige scroll até o fim)
 *   2. Termos de Uso e Política de Privacidade (unificado)
 *
 * Só libera o acesso à plataforma após todos os 2 aceites.
 */
export default function ModalTermosRepresentante({ onConcluir }: Props) {
  const [aceitos, setAceitos] = useState<Set<TipoDoc>>(new Set());
  const [docAtivo, setDocAtivo] = useState<TipoDoc | null>(null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const todosAceitos = DOCS.every((d) => aceitos.has(d.tipo));
  const docAtivoConfig = DOCS.find((d) => d.tipo === docAtivo);

  const handleAceitarDoc = async (tipo: TipoDoc) => {
    setErro('');

    // termos_unificados registra dois aceites no backend: politica_privacidade + termos_uso
    const tipos =
      tipo === 'termos_unificados'
        ? (['politica_privacidade', 'termos_uso'] as const)
        : ([tipo] as const);

    for (const t of tipos) {
      const res = await fetch('/api/representante/aceitar-termos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: t }),
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? 'Erro ao registrar aceite'
        );
      }
    }

    setAceitos((prev) => new Set([...prev, tipo]));
    setDocAtivo(null);
  };

  const handleConcluir = () => {
    if (!todosAceitos || confirmando) return;
    setConfirmando(true);
    try {
      onConcluir();
    } finally {
      setConfirmando(false);
    }
  };

  const handleErroAceite = (tipo: TipoDoc) => async () => {
    try {
      await handleAceitarDoc(tipo);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Erro ao registrar aceite. Tente novamente.'
      );
    }
  };

  return (
    <>
      {/* Backdrop + modal principal */}
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-termos-rep-titulo"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white">
            <h2 id="modal-termos-rep-titulo" className="text-xl font-bold mb-1">
              Bem-vindo(a) ao Portal QWork
            </h2>
            <p className="text-orange-100 text-sm">
              Para acessar a plataforma, leia e aceite os documentos abaixo.
            </p>
          </div>

          {/* Corpo */}
          <div className="px-8 py-6">
            <p className="text-sm text-gray-600 mb-5">
              A leitura e aceite são obrigatórios. O acesso à plataforma só é
              liberado após a conclusão de todos os itens.
            </p>

            {/* Lista de documentos */}
            <div className="space-y-3 mb-6">
              {DOCS.map((doc, idx) => {
                const aceito = aceitos.has(doc.tipo);
                return (
                  <button
                    key={doc.tipo}
                    onClick={() => !aceito && setDocAtivo(doc.tipo)}
                    disabled={aceito}
                    aria-label={`${aceito ? 'Aceito' : 'Ler e aceitar'}: ${doc.titulo}`}
                    className={[
                      'w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-150',
                      aceito
                        ? 'border-green-400 bg-green-50 cursor-default'
                        : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50 cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-600">
                        {aceito ? (
                          <CheckCircle className="text-green-600" size={18} />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div>
                        <div
                          className={`text-sm font-semibold ${aceito ? 'text-green-800' : 'text-gray-900'}`}
                        >
                          {doc.titulo}
                        </div>
                        <div
                          className={`text-xs ${aceito ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {aceito ? 'Aceito ✓' : doc.subtitulo}
                        </div>
                      </div>
                    </div>
                    {!aceito && (
                      <ChevronRight
                        className="text-gray-400 flex-shrink-0"
                        size={18}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            {/* Botão de acesso */}
            <button
              onClick={handleConcluir}
              disabled={!todosAceitos || confirmando}
              className={[
                'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer',
                todosAceitos && !confirmando
                  ? 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              ].join(' ')}
              aria-disabled={!todosAceitos || confirmando}
            >
              {confirmando ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Acessando...
                </>
              ) : todosAceitos ? (
                <>
                  <CheckCircle size={16} /> Acessar a Plataforma
                </>
              ) : (
                'Aceite todos os documentos para continuar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal de leitura do documento ativo */}
      {docAtivo && docAtivoConfig && (
        <SubModalLeitura
          doc={docAtivoConfig}
          onAceitar={handleErroAceite(docAtivo)}
          onVoltar={() => setDocAtivo(null)}
        />
      )}
    </>
  );
}
