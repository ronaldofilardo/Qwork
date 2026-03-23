'use client';

/**
 * ModalTermosVendedor — mesmo fluxo do ModalTermosRepresentante,
 * mas registra aceites em /api/vendedor/aceitar-termos.
 */

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
    titulo: 'Contrato de Prestação de Serviços',
    subtitulo: 'Contrato Independente — Sem Vínculo CLT',
    icon: <ScrollText className="text-green-600" size={22} />,
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

function DocViewer({
  config,
  onAceitar,
  onVoltar,
}: {
  config: DocConfig;
  onAceitar: () => void;
  onVoltar: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(
    !config.requireScroll
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !config.requireScroll) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, config.requireScroll]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <button
          onClick={onVoltar}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ←
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900">{config.titulo}</p>
          <p className="text-xs text-gray-500">{config.subtitulo}</p>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed"
      >
        <DocContent tipo={config.tipo} />
      </div>
      <div className="p-4 border-t bg-white">
        {config.requireScroll && !scrolledToBottom && (
          <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
            <AlertCircle size={12} /> Role até o fim para aceitar
          </p>
        )}
        <button
          onClick={onAceitar}
          disabled={!scrolledToBottom}
          className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Li e Aceito
        </button>
      </div>
    </div>
  );
}

export default function ModalTermosVendedor({ onConcluir }: Props) {
  const [aceitos, setAceitos] = useState<Set<TipoDoc>>(new Set());
  const [docAtivo, setDocAtivo] = useState<TipoDoc | null>(null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const todosAceitos = DOCS.every((d) => aceitos.has(d.tipo));
  const docAtivoConfig = DOCS.find((d) => d.tipo === docAtivo);

  const handleAceitarDoc = async (tipo: TipoDoc) => {
    setErro('');
    const tipos =
      tipo === 'termos_unificados'
        ? (['politica_privacidade', 'termos_uso'] as const)
        : ([tipo] as const);

    for (const t of tipos) {
      const res = await fetch('/api/vendedor/aceitar-termos', {
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

  if (docAtivoConfig) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <DocViewer
          config={docAtivoConfig}
          onAceitar={handleErroAceite(docAtivoConfig.tipo)}
          onVoltar={() => setDocAtivo(null)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white">
          <h2 className="text-lg font-bold">Aceite de Documentos</h2>
          <p className="text-sm text-green-100 mt-1">
            Leia e aceite os documentos abaixo para acessar o portal do
            Vendedor.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-6 py-3 flex gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erro}
          </div>
        )}

        <div className="divide-y">
          {DOCS.map((doc) => {
            const aceito = aceitos.has(doc.tipo);
            return (
              <button
                key={doc.tipo}
                onClick={() => !aceito && setDocAtivo(doc.tipo)}
                disabled={aceito}
                className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                  aceito
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="shrink-0">{doc.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {doc.titulo}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {doc.subtitulo}
                  </p>
                </div>
                {aceito ? (
                  <CheckCircle size={18} className="text-green-500 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleConcluir}
            disabled={!todosAceitos || confirmando}
            className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {confirmando && <Loader2 size={14} className="animate-spin" />}
            {todosAceitos
              ? 'Acessar Portal'
              : `Aceite todos os documentos (${aceitos.size}/${DOCS.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
