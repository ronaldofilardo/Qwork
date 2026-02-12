'use client';

import { useState } from 'react';
import { FileText, Lock, CheckCircle } from 'lucide-react';
import ModalConteudoTermo from './ModalConteudoTermo';

interface Props {
  onConcluir: () => void;
  redirectTo?: string;
}

export default function ModalTermosAceite({ onConcluir, redirectTo }: Props) {
  const [aceitos, setAceitos] = useState({
    termos_uso: false,
    politica_privacidade: false,
  });
  const [termoAtivo, setTermoAtivo] = useState<
    'termos_uso' | 'politica_privacidade' | null
  >(null);
  const [erro, setErro] = useState('');

  const handleAceitarTermo = async (
    tipo: 'termos_uso' | 'politica_privacidade'
  ) => {
    try {
      setErro('');

      const response = await fetch('/api/termos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo_tipo: tipo }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar aceite');
      }

      // Atualizar estado local de aceitos
      const novoEstado = { ...aceitos, [tipo]: true };
      setAceitos(novoEstado);
      setTermoAtivo(null);

      // Se é o segundo termo sendo aceito, redirecionar imediatamente
      if (novoEstado.termos_uso && novoEstado.politica_privacidade) {
        // Ambos foram aceitos - redirecionar sem delay
        console.log(
          '[TERMOS] Ambos os termos aceitos - redirecionando imediatamente'
        );
        if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          onConcluir();
        }
      }
    } catch (err) {
      console.error('Erro ao aceitar termo:', err);
      setErro('Erro ao registrar aceite. Tente novamente.');
    }
  };

  const handleContinuar = () => {
    // Redirecionar para página apropriada
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      onConcluir();
    }
  };

  const todosPendentes = !aceitos.termos_uso || !aceitos.politica_privacidade;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Aceite Obrigatório
          </h2>

          <p className="text-gray-600 mb-6">
            Para acessar a plataforma, você precisa ler e aceitar os seguintes
            documentos:
          </p>

          {/* Botões de termos */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => setTermoAtivo('termos_uso')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-orange-500" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    Termos de Uso
                  </div>
                  <div className="text-sm text-gray-500">
                    Condições de utilização da plataforma
                  </div>
                </div>
              </div>
              {aceitos.termos_uso ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <span className="text-sm text-gray-400 group-hover:text-orange-500">
                  Clique para ler
                </span>
              )}
            </button>

            <button
              onClick={() => setTermoAtivo('politica_privacidade')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Lock className="text-orange-500" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    Política de Privacidade
                  </div>
                  <div className="text-sm text-gray-500">
                    Como tratamos seus dados pessoais
                  </div>
                </div>
              </div>
              {aceitos.politica_privacidade ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <span className="text-sm text-gray-400 group-hover:text-orange-500">
                  Clique para ler
                </span>
              )}
            </button>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {erro}
            </div>
          )}

          {/* Botão continuar */}
          <button
            onClick={handleContinuar}
            disabled={todosPendentes}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {todosPendentes
              ? 'Aceite ambos os documentos para continuar'
              : 'Continuar para Dashboard'}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Não é possível acessar a plataforma sem aceitar estes termos
          </p>
        </div>
      </div>

      {/* Modal de conteúdo */}
      {termoAtivo && (
        <ModalConteudoTermo
          tipo={termoAtivo}
          onAceitar={() => handleAceitarTermo(termoAtivo)}
          onVoltar={() => setTermoAtivo(null)}
        />
      )}
    </>
  );
}
