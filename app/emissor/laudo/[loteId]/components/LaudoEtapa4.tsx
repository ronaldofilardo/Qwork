'use client';

import Image from 'next/image';
import QworkLogo from '@/components/QworkLogo';
import type { LaudoPadronizado } from '@/lib/laudo-tipos';

interface LaudoEtapa4Props {
  etapa4: LaudoPadronizado['etapa4'];
  observacoesEmissor?: string | null;
  mensagem?: string | null;
  criadoEm?: string | null;
  emitidoEm?: string | null;
  enviadoEm?: string | null;
  status?: string;
  isPrevia?: boolean;
  loteNumero?: number | null;
  onDownloadLaudo: () => void;
}

function fmtDt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}`;
}

export default function LaudoEtapa4({
  etapa4,
  observacoesEmissor,
  mensagem,
  criadoEm,
  emitidoEm,
  enviadoEm,
  status,
  isPrevia,
  loteNumero,
  onDownloadLaudo,
}: LaudoEtapa4Props) {
  if (!etapa4) return null;

  const signDate = emitidoEm
    ? new Date(emitidoEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }) +
      ' ' +
      new Date(emitidoEm).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      }) +
      ' -0300'
    : new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }) +
      ' ' +
      new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      }) +
      ' -0300';

  return (
    <>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-600">
          4. OBSERVAÇÕES E CONCLUSÃO
        </h2>
        {etapa4.observacoesLaudo && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Observações do Laudo
            </h3>
            <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {etapa4.observacoesLaudo}
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Conclusão
          </h3>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium text-base">
              {etapa4.textoConclusao}
            </div>
            <div className="mt-10 pt-8">
              <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-2xl mx-auto text-center shadow-sm">
                <div className="text-lg font-bold text-black mb-6">
                  {etapa4.dataEmissao}
                </div>
                <div className="flex items-center justify-center gap-3 mb-5">
                  <Image
                    src="https://www.gov.br/++theme++padrao_govbr/img/govbr-logo-large.png"
                    alt="gov.br"
                    width={100}
                    height={48}
                    className="h-12 w-auto"
                    unoptimized
                  />
                  <span className="text-gray-600 text-sm">
                    Documento assinado digitalmente
                  </span>
                </div>
                <div className="text-base font-bold uppercase text-black mb-2 tracking-wide">
                  {etapa4.assinatura.nome}
                </div>
                <div className="text-gray-600 text-sm mb-2">
                  Data: {signDate}
                </div>
                <div className="text-gray-500 text-xs mb-5">
                  Verifique em https://verificador.iti.br
                </div>
                <div className="text-sm font-medium text-black mt-5">
                  Coordenador Responsável Técnico – Qwork
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-4 border-gray-300 my-10"></div>

      {mensagem && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">ℹ️ {mensagem}</p>
        </div>
      )}

      {observacoesEmissor && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-orange-400">
            4. OBSERVAÇÕES DO EMISSOR
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {observacoesEmissor}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
        <div className="text-sm text-gray-600 space-y-1">
          {isPrevia && (
            <p className="text-orange-600 font-semibold">
              ⚠️ Pré-visualização - Laudo ainda não emitido
            </p>
          )}
          {loteNumero != null && <p>📋 Lote nº {loteNumero}</p>}
          {criadoEm && <p>📅 Criado em {fmtDt(criadoEm)}</p>}
          {emitidoEm && <p>✅ Emitido automaticamente em {fmtDt(emitidoEm)}</p>}
          {enviadoEm && <p>📤 Enviado automaticamente em {fmtDt(enviadoEm)}</p>}
          {status === 'enviado' && (
            <p className="text-green-600 font-semibold">
              ✓ Status: Enviado para clínica
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {status === 'enviado' && (
            <button
              onClick={onDownloadLaudo}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
            >
              📄 Baixar PDF
            </button>
          )}
          {isPrevia && (
            <span className="text-sm text-gray-500 italic self-center">
              Aguardando emissão automática do sistema
            </span>
          )}
        </div>
      </div>

      {status === 'enviado' && (
        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
          <QworkLogo size="md" showSlogan={false} />
        </div>
      )}
    </>
  );
}
