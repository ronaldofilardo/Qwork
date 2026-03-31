'use client';

import { useState } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import ModalConteudoTermo from './ModalConteudoTermo';

interface Props {
  onConcluir: () => void;
  redirectTo?: string;
}

export default function ModalTermosAceite({ onConcluir, redirectTo }: Props) {
  const [aceito, setAceito] = useState(false);
  const [termoAtivo, setTermoAtivo] = useState<'termos_unificados' | null>(
    null
  );
  const [erro, setErro] = useState('');

  const handleAceitarUnificado = async () => {
    try {
      setErro('');

      // Registrar termos_uso
      const r1 = await fetch('/api/termos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo_tipo: 'termos_uso' }),
        credentials: 'same-origin',
      });
      if (!r1.ok) throw new Error('Erro ao registrar termos de uso');

      // Registrar politica_privacidade
      const r2 = await fetch('/api/termos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo_tipo: 'politica_privacidade' }),
        credentials: 'same-origin',
      });
      if (!r2.ok) throw new Error('Erro ao registrar política de privacidade');

      setAceito(true);
      setTermoAtivo(null);

      console.log('[TERMOS] Termos unificados aceitos - redirecionando');
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        onConcluir();
      }
    } catch (err) {
      console.error('Erro ao aceitar termos:', err);
      setErro('Erro ao registrar aceite. Tente novamente.');
    }
  };

  const handleContinuar = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      onConcluir();
    }
  };

  const todosPendentes = !aceito;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Aceite Obrigatório
          </h2>

          <p className="text-gray-600 mb-6">
            Para acessar a plataforma, você precisa ler e aceitar o documento
            abaixo:
          </p>

          {/* Botão único do documento unificado */}
          <div className="mb-6">
            <button
              onClick={() => setTermoAtivo('termos_unificados')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-orange-500" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    Termos de Uso e Política de Privacidade – QWORK
                  </div>
                  <div className="text-sm text-gray-500">
                    Condições de utilização e tratamento de dados pessoais
                  </div>
                </div>
              </div>
              {aceito ? (
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
              ? 'Aceite o documento para continuar'
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
          onAceitar={handleAceitarUnificado}
          onVoltar={() => setTermoAtivo(null)}
        />
      )}
    </>
  );
}
