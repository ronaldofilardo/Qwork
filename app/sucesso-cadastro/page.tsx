'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  CreditCard,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import ModalPagamento from '@/components/modals/ModalPagamento';
import ModalContrato from '@/components/modals/ModalContrato';

interface Tomador {
  id: number;
  nome: string;
  pagamento_confirmado: boolean;
  contrato_aceito?: boolean;
  tipo?: string;
}

export default function SucessoCadastroPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tomadorId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [tomador, setTomador] = useState<Tomador | null>(null);
  const [aguardandoEnvioLink, setAguardandoEnvioLink] = useState(false);
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
  // Fallback para cenários em que o simulador não retorna `id` na URL,
  // mas o cadastro foi efetivamente realizado. Mostraremos uma tela de
  // confirmação amigável em vez do alerta de erro confuso.
  const [contaCriadaSucesso, setContaCriadaSucesso] = useState(false);

  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const contratoIdParam = searchParams.get('contrato_id');
  const [contratoIdFromParam, setContratoIdFromParam] = useState<number | null>(
    contratoIdParam ? parseInt(contratoIdParam) : null
  );
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  // Lista de próximos passos/instruções para exibir quando o pagamento for confirmado
  const [proximosPassos, setProximosPassos] = useState<string[] | null>(null);
  // Modal de sucesso que deve abrir imediatamente após confirmação do pagamento
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false);

  // Definir a função antes de usá-la
  const getProximosPassosForTipo = useCallback((tipo?: string) => {
    if (tipo === 'clinica') {
      return [
        'Acesso ao sistema liberado imediatamente',
        'Login: use CPF do responsável e senha = últimos 6 dígitos do CNPJ',
        'Recibo disponível sob demanda: Conta > Plano > Baixar Comprovante',
      ];
    }

    if (tipo === 'entidade') {
      return [
        'Acesso ao sistema liberado imediatamente para gestores',
        'Login: use CPF do responsável e senha = últimos 6 dígitos do CNPJ',
        'Recibo disponível sob demanda: Conta > Plano > Baixar Comprovante',
      ];
    }

    return [
      'Acesso ao sistema liberado imediatamente',
      'Login: use CPF do responsável e senha = últimos 6 dígitos do CNPJ',
      'Recibo disponível sob demanda: Conta > Plano > Baixar Comprovante',
    ];
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro('');
    setContaCriadaSucesso(false);

    try {
      // Primeiro, tentar obter a sessão (se o fluxo de pagamento/simulador não retornou `id`)
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      // Se a sessão contém o tomador, utilizamos esses dados preferencialmente
      if (sessionRes.ok && sessionData?.tomador) {
        setTomador(sessionData.tomador);

        if (sessionData.tomador.status === 'aguardando_pagamento') {
          setAguardandoEnvioLink(true);
          setLoading(false);
          return;
        }

        // Para novos fluxos (ex.: clinica, entidade) o pagamento confirmado deve
        // mostrar imediatamente a tela de confirmação mesmo se não houver um
        // contrato aceito explicitamente. Portanto consideramos apenas
        // `pagamento_confirmado` para liberar a tela de pagamento concluído.
        if (sessionData.tomador.pagamento_confirmado) {
          setPagamentoConcluido(true);
          setProximosPassos(getProximosPassosForTipo(sessionData.tomador.tipo));
          setLoading(false);
          return;
        }

        setLoading(false);
        return;
      }

      // Se não há tomador na sessão, tentar buscar pelo parâmetro `id` quando presente
      if (tomadorId) {
        const tomadorRes = await fetch(`/api/public/tomador?id=${tomadorId}`);
        const tomadorData = await tomadorRes.json();

        if (!tomadorRes.ok) {
          throw new Error(tomadorData.error || 'Erro ao carregar dados');
        }

        setTomador(tomadorData.tomador);

        if (tomadorData.tomador.status === 'aguardando_pagamento') {
          setAguardandoEnvioLink(true);
          setLoading(false);
          return;
        }

        // Mesma lógica aplicada aqui: liberar tela de confirmação quando o
        // pagamento estiver confirmado, mesmo que o contrato não esteja
        // explicitamente marcado como aceito (casos de clinica/entidade).
        if (tomadorData.tomador.pagamento_confirmado) {
          setPagamentoConcluido(true);
          setProximosPassos(getProximosPassosForTipo(tomadorData.tomador.tipo));
          setLoading(false);
          return;
        }

        setLoading(false);
        return;
      }

      // Fallback amigável: não há `id` e não há tomador na sessão —
      // provavelmente fluxo do simulador completou a criação; mostrar sucesso neutro
      setContaCriadaSucesso(true);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);

      setErro(
        error instanceof Error ? error.message : 'Erro ao carregar dados'
      );
    } finally {
      setLoading(false);
    }
  }, [tomadorId, getProximosPassosForTipo]);

  useEffect(() => {
    // Sempre tentar carregar dados — carregador lida com ausência de `id`
    carregarDados();

    // Auto-open contrato modal se contrato_id foi passado na querystring
    if (contratoIdParam) {
      setContratoIdFromParam(parseInt(contratoIdParam));
      setMostrarModalContrato(true);
    }
  }, [tomadorId, carregarDados, contratoIdParam]);

  const handlePagamentoConfirmado = (data?: any) => {
    setMostrarModalPagamento(false);

    if (data?.proximos_passos) {
      alert('Pagamento confirmado!\n\n' + data.proximos_passos.join('\n'));
      setProximosPassos(data.proximos_passos);
    } else {
      // Manter mensagem padrão (compatível com testes) e ainda preencher próximos passos na UI
      alert(
        'Pagamento confirmado!\n\n' +
          'Seu acesso foi liberado.\n' +
          'O comprovante de pagamento está disponível em:\n' +
          'Informações da Conta > Plano > Baixar Comprovante'
      );
      setProximosPassos(getProximosPassosForTipo(tomador?.tipo));
    }

    setPagamentoConcluido(true);
    // Abrir o modal de sucesso imediatamente para o usuário ver instruções antes de qualquer redirecionamento
    setMostrarModalSucesso(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (contaCriadaSucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div
          data-testid="conta-criada"
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Conta criada com sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            Seu cadastro foi concluído com sucesso. Se o pagamento foi
            realizado, sua conta será ativada em breve.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Aviso</h2>
          </div>
          <p className="text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finalize seu Cadastro
          </h1>
          <p className="text-gray-600">
            Complete o pagamento para ativar sua conta
          </p>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {aguardandoEnvioLink && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-sm text-yellow-800">
              ⏳ Conta aguardando aprovação do Administrador. Aguarde o envio de
              link para pagamento
            </div>
          )}

          {!pagamentoConcluido && !aguardandoEnvioLink && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Realizar Pagamento
              </h2>
              <p className="text-gray-600 mb-6">
                Finalize seu cadastro realizando o pagamento.
              </p>

              {contratoIdFromParam &&
              !pagamentoConcluido &&
              !aguardandoEnvioLink ? (
                <>
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      📄 <strong>Contrato Pendente:</strong> Para prosseguir ao
                      pagamento, você precisa ler e aceitar o contrato de
                      serviço.
                    </p>
                    <button
                      onClick={() => setMostrarModalContrato(true)}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                    >
                      <FileText size={20} />
                      Ver e Aceitar Contrato
                    </button>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    <p>
                      Após aceitar o contrato, você será direcionado
                      automaticamente para o simulador de pagamento.
                    </p>
                  </div>
                </>
              ) : !contratoIdFromParam &&
                !pagamentoConcluido &&
                !aguardandoEnvioLink ? (
                <button
                  onClick={() => setMostrarModalPagamento(true)}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Realizar Pagamento
                </button>
              ) : null}
            </>
          )}

          {pagamentoConcluido && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Cadastro Concluído!
              </h2>
              <p className="text-gray-600 mb-2">
                Seu cadastro foi realizado com sucesso e o pagamento foi
                confirmado.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Aguarde a aprovação final do administrador. Você receberá um
                e-mail quando seu acesso for liberado.
              </p>

              {proximosPassos && (
                <div className="mb-6 text-left max-w-xl mx-auto">
                  {proximosPassos.map((p, i) => (
                    <p key={i} className="text-gray-600 mb-1">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Ir para Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {mostrarModalPagamento && tomador && (
        <ModalPagamento
          isOpen={mostrarModalPagamento}
          onClose={() => setMostrarModalPagamento(false)}
          tomadorId={tomador.id}
          contratoId={contratoIdFromParam}
          valor={0}
          titulo={'Serviço de Avaliação'}
          onPagamentoConfirmado={handlePagamentoConfirmado}
          initialMetodo={null}
        />
      )}

      {/* Modal de Sucesso: abrir imediatamente após confirmação do pagamento */}
      {mostrarModalSucesso && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sucesso-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 id="sucesso-title" className="text-xl font-bold">
                Cadastro Concluído!
              </h3>
              <button
                aria-label="Fechar"
                onClick={() => setMostrarModalSucesso(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Seu cadastro foi realizado com sucesso e o pagamento foi
                confirmado.
              </p>
              {proximosPassos ? (
                proximosPassos.map((p, i) => (
                  <p key={i} className="text-gray-600 mb-1">
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-gray-600">
                  Aguarde a aprovação final do administrador. Você receberá um
                  e-mail quando seu acesso for liberado.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModalSucesso(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Ir para Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contrato (abrir quando houver contrato pendente) */}
      {mostrarModalContrato && contratoIdFromParam && (
        // Abrimos o ModalContrato para o contrato gerado em cadastro
        <ModalContrato
          isOpen={mostrarModalContrato}
          onClose={() => setMostrarModalContrato(false)}
          contratoId={contratoIdFromParam}
          onAceiteSuccess={() => {
            setContratoIdFromParam(null);
            carregarDados();
          }}
        />
      )}
    </div>
  );
}
