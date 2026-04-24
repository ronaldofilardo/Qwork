'use client';

import { useLaudo } from './useLaudo';
import LaudoHeader from './components/LaudoHeader';
import LaudoEtapa1 from './components/LaudoEtapa1';
import LaudoEtapa2 from './components/LaudoEtapa2';
import LaudoEtapa3 from './components/LaudoEtapa3';
import LaudoEtapa4 from './components/LaudoEtapa4';
import ModalUploadLaudo from '@/components/modals/ModalUploadLaudo';

export default function EditarLaudo() {
  const {
    loteId,
    lote,
    laudoPadronizado,
    loading,
    mensagem,
    isPrevia,
    laudoStatus,
    gerandoLaudo,
    assinandoLaudo,
    modalUploadOpen,
    setModalUploadOpen,
    handleGerarLaudo,
    handleAssinarDigitalmente,
    handleDownloadLaudo,
    handleUploadSuccess,
    router,
  } = useLaudo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando laudo...</p>
        </div>
      </div>
    );
  }

  if (!lote || !laudoPadronizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Laudo não encontrado</p>
          <button
            onClick={() => router.push('/emissor')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-3 py-4">
        <LaudoHeader
          onBack={() => router.push('/emissor')}
          isPrevia={isPrevia}
          laudoStatus={laudoStatus}
          gerandoLaudo={gerandoLaudo}
          assinandoLaudo={assinandoLaudo}
          onOpenUploadModal={() => setModalUploadOpen(true)}
          onGerarLaudo={handleGerarLaudo}
          onAssinarDigitalmente={handleAssinarDigitalmente}
        />

        {mensagem && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{mensagem}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8 pb-4 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1
              / GRO)
            </h1>
            <h2 className="text-base text-gray-700 mb-2">
              Avaliação de Saúde Mental no Trabalho
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Baseada no instrumento COPSOQ III
            </p>
          </div>

          <LaudoEtapa1 etapa1={laudoPadronizado.etapa1} />
          <LaudoEtapa2 etapa2={laudoPadronizado.etapa2} />
          <LaudoEtapa3 etapa3={laudoPadronizado.etapa3} />
          <LaudoEtapa4
            etapa4={laudoPadronizado.etapa4}
            observacoesEmissor={laudoPadronizado.observacoesEmissor}
            mensagem={mensagem}
            criadoEm={laudoPadronizado.criadoEm}
            emitidoEm={laudoPadronizado.emitidoEm}
            enviadoEm={laudoPadronizado.enviadoEm}
            status={laudoPadronizado.status}
            isPrevia={isPrevia}
            loteNumero={lote?.numero_ordem}
            onDownloadLaudo={handleDownloadLaudo}
          />
        </div>
      </div>

      <ModalUploadLaudo
        loteId={loteId}
        isOpen={modalUploadOpen}
        onClose={() => setModalUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
