'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import ModalContrato from '@/components/modals/ModalContrato';

export default function SucessoCadastroPage() {
  const searchParams = useSearchParams();
  const contratoIdParam = searchParams.get('contrato_id');
  const idParam = searchParams.get('id');

  const [contratoId, setContratoId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contratoAceito, setContratoAceito] = useState(false);
  const [loginSenha, setLoginSenha] = useState<{
    login: string;
    senha: string;
  } | null>(null);

  // Verificar se contrato já foi aceito
  useEffect(() => {
    if (contratoIdParam && !isModalOpen) {
      const fetchContratoStatus = async () => {
        try {
          const res = await fetch(`/api/contratos/public/${contratoIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data.contrato?.aceito) {
              setContratoAceito(true);
              // Se já aceito, extractar credenciais se disponível
              if (data.credenciais) {
                setLoginSenha(data.credenciais);
              }
            }
          }
        } catch (err) {
          console.error('Erro ao verificar status do contrato:', err);
        }
      };

      fetchContratoStatus();
    }
  }, [contratoIdParam, isModalOpen]);

  // Recuperar credenciais se tiver tomador_id
  useEffect(() => {
    if (idParam && !contratoAceito && !loginSenha) {
      const fetchCredenciais = async () => {
        try {
          const res = await fetch(`/api/tomadores/${idParam}/credenciais`);
          if (res.ok) {
            const data = await res.json();
            setLoginSenha(data.credenciais);
            setContratoAceito(true);
          }
        } catch (err) {
          console.error('Erro ao recuperar credenciais:', err);
        }
      };

      fetchCredenciais();
    }
  }, [idParam, contratoAceito, loginSenha]);

  useEffect(() => {
    if (contratoIdParam) {
      const id = Number(contratoIdParam);
      if (!isNaN(id) && id > 0) {
        setContratoId(id);
        setIsModalOpen(true);
      }
    }
  }, [contratoIdParam]);

  const handleModalClose = async () => {
    setIsModalOpen(false);
    // Verificar se contrato foi aceito após fechar modal
    if (contratoId) {
      try {
        const res = await fetch(`/api/contratos/public/${contratoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.contrato?.aceito) {
            setContratoAceito(true);
            if (data.credenciais) {
              setLoginSenha(data.credenciais);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do contrato:', err);
      }
    }
  };

  const handleAceiteSuccess = () => {
    setContratoAceito(true);
  };

  if (!contratoIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold">Link inválido</p>
          <p className="text-gray-500 mt-2">
            O link de cadastro está incompleto. Solicite um novo link ao
            suporte.
          </p>
        </div>
      </div>
    );
  }

  // Estado: Contrato já foi aceito
  if (contratoAceito) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tudo Pronto!
          </h1>
          <p className="text-gray-600 mb-6">
            Seu cadastro foi confirmado e suas credenciais foram criadas.
          </p>

          {loginSenha && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">
                Suas credenciais de acesso:
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Usuário:</p>
                  <p className="font-mono text-sm bg-white p-2 rounded border border-gray-200">
                    {loginSenha.login}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Senha:</p>
                  <p className="font-mono text-sm bg-white p-2 rounded border border-gray-200">
                    {loginSenha.senha}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg mb-6">
            <p>
              Um email de confirmação foi enviado para você com as informações
              de acesso.
            </p>
          </div>

          <a
            href="/login"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir para Login
          </a>
        </div>
      </div>
    );
  }

  // Estado: Aguardando aceite
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
        <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cadastro Realizado!
        </h1>
        <p className="text-gray-600 mb-6">
          Aceite o contrato para finalizar e receber suas credenciais de acesso.
        </p>

        {!isModalOpen && contratoId && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver e Aceitar Contrato
          </button>
        )}

        {!isModalOpen && contratoId && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Se você fechar esta página sem aceitar o contrato, ele permanecerá
              pendente e poderá ser acessado novamente via email de suporte.
            </p>
          </div>
        )}
      </div>

      {contratoId && (
        <ModalContrato
          isOpen={isModalOpen}
          contratoId={contratoId}
          onClose={handleModalClose}
          onAceiteSuccess={handleAceiteSuccess}
        />
      )}
    </div>
  );
}
