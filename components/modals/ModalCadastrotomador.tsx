'use client';

import { FormEvent, useEffect } from 'react';
import { X, Check, AlertCircle, Building2, Stethoscope } from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';
import { TipoEntidade } from '@/lib/cadastroTomador';

import { useCadastroTomador } from '@/hooks/useCadastroTomador';
import DadosStep from './ModalCadastroTomadorSteps/DadosStep';
import ResponsavelStep from './ModalCadastroTomadorSteps/ResponsavelStep';
import ConfirmacaoStep from './ModalCadastroTomadorSteps/ConfirmacaoStep';

type _Etapa = 'tipo' | 'dados' | 'responsavel' | 'confirmacao';

interface ModalCadastroTomadorProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: TipoEntidade; // Agora opcional
}

interface _DadosTomador {
  nome: string;
  cnpj: string;
  inscricao_estadual: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface _DadosResponsavel {
  nome: string;
  cpf: string;
  cargo: string;
  email: string;
  celular: string;
}

interface _Arquivos {
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}

export default function ModalCadastroTomador({
  isOpen,
  onClose,
  tipo: tipoInicial,
}: ModalCadastroTomadorProps) {
  // Estado e handlers agora são gerenciados pelo hook `useCadastroTomador`
  // (aliases abaixo mapeiam os nomes antigos para a API do hook)

  // Novos estados para planos
  // Extrair estados e handlers para hook `useCadastroTomador`
  const hook = useCadastroTomador({ initialTipo: tipoInicial });
  const {
    etapaAtual: etapaHook,
    erro: erroHook,
    sucesso: sucessoHook,
    enviando: enviandoHook,
    tipo: tipoHook,
    setTipo: setTipoHook,
    cnpjError: cnpjErrorHook,
    numeroFuncionarios: numeroFuncionariosHook,
    setNumeroFuncionarios: setNumeroFuncionariosHook,
    contratoAceito: contratoAceitoHook,
    setContratoAceito: setContratoAceitoHook,
    contratoGerado: contratoGeradoHook,
    confirmacaoFinalAceita: confirmacaoFinalAceitaHook,
    setConfirmacaoFinalAceita: setConfirmacaoFinalAceitaHook,
    codigoRepresentante: codigoRepresentanteHook,
    setCodigoRepresentante: setCodigoRepresentanteHook,
    semIndicacao: semIndicacaoHook,
    setSemIndicacao: setSemIndicacaoHook,
    dadosContratante: dadosContratanteHook,
    setDadosContratante: setDadosContratanteHook,
    dadosResponsavel: dadosResponsavelHook,
    setDadosResponsavel: setDadosResponsavelHook,
    arquivos: arquivosHook,
    handleDadosChange,
    handleResponsavelChange,
    handleFileChange,
    avancarEtapa: avancarEtapaHook,
    voltarEtapa: voltarEtapaHook,
    submit: submitHook,
    resetarFormulario: resetarFormularioHook,
    redirectUrl: redirectUrlHook,
  } = hook;

  // Mapear nomes antigos para evitar editar todo o JSX de uma vez
  const etapaAtual = etapaHook;
  const erro = erroHook;
  const sucesso = sucessoHook;
  const enviando = enviandoHook;
  const tipo = tipoHook;
  const setTipo = setTipoHook;
  const cnpjError = cnpjErrorHook;
  const _numeroFuncionarios = numeroFuncionariosHook;
  const _setNumeroFuncionarios = setNumeroFuncionariosHook;
  const _contratoAceito = contratoAceitoHook;
  const _setContratoAceito = setContratoAceitoHook;
  const _contratoGerado = contratoGeradoHook;
  const confirmacaoFinalAceita = confirmacaoFinalAceitaHook;
  const setConfirmacaoFinalAceita = setConfirmacaoFinalAceitaHook;
  const codigoRepresentante = codigoRepresentanteHook;
  const setCodigoRepresentante = setCodigoRepresentanteHook;
  const semIndicacao = semIndicacaoHook;
  const setSemIndicacao = setSemIndicacaoHook;
  const dadosContratante = dadosContratanteHook;
  const _setDadosContratante = setDadosContratanteHook;
  const dadosResponsavel = dadosResponsavelHook;
  const _setDadosResponsavel = setDadosResponsavelHook;
  const arquivos = arquivosHook;
  const avancarEtapa = avancarEtapaHook;
  const voltarEtapa = voltarEtapaHook;
  const submit = submitHook;
  const resetarFormulario = resetarFormularioHook;
  const redirectUrl = redirectUrlHook;

  // Redireciona para URL gerada pelo backend (quando aplicável)
  useEffect(() => {
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }
  }, [redirectUrl]);

  // Fetch e ajustes de plano são gerenciados pelo hook `useCadastroTomador` (internamente já faz getPlanos e ajuste de número de funcionários).

  // A geração de contrato foi extraída para `lib/cadastroTomador.ts` e deve ser
  // chamada via `gerarContratoSimulado({ plano, dadosTomador, dadosResponsavel, numeroFuncionarios, tipo })` quando necessário.
  // Local implementation removed to avoid duplicação e manter domínio testável.

  if (!isOpen) return null;

  const responsavelLabel = tipo === 'clinica' ? 'Gestor' : 'Responsável';

  // Validator logic moved to `lib/cadastroTomador` (use validarEtapaDados)

  // Validator logic moved to `lib/cadastroTomador` (use validarEtapaResponsavel)

  const handleClose = () => {
    // reset via hook and then fechar modal
    resetarFormulario();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await submit();
      if (res && res.redirect) {
        setTimeout(() => {
          window.location.href = res.redirect as string;
        }, 100);
      }
    } catch (err) {
      // erro já tratado pelo hook
      console.error('Erro ao submeter formulário:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <QworkLogo size="sm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Cadastro de Empresa
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {etapaAtual === 'tipo' && 'Tipo de cadastro'}
                {etapaAtual === 'dados' && 'Dados da empresa'}
                {etapaAtual === 'responsavel' && `Dados do ${responsavelLabel}`}
                {etapaAtual === 'confirmacao' && 'Confirmar e enviar'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            {/* Etapa 1: Tipo */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                etapaAtual === 'tipo'
                  ? 'bg-orange-500 text-white'
                  : ['dados', 'responsavel', 'confirmacao'].includes(etapaAtual)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {['dados', 'responsavel', 'confirmacao'].includes(etapaAtual) ? (
                <Check size={16} />
              ) : (
                '1'
              )}
            </div>
            <div className="w-8 h-1 bg-gray-300">
              <div
                className={`h-full ${['dados', 'responsavel', 'confirmacao'].includes(etapaAtual) ? 'bg-orange-500' : ''}`}
              />
            </div>

            {/* Etapa 2: Dados */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                etapaAtual === 'dados'
                  ? 'bg-orange-500 text-white'
                  : ['responsavel', 'confirmacao'].includes(etapaAtual)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {['responsavel', 'confirmacao'].includes(etapaAtual) ? (
                <Check size={16} />
              ) : (
                '2'
              )}
            </div>
            <div className="w-8 h-1 bg-gray-300">
              <div
                className={`h-full ${['responsavel', 'confirmacao'].includes(etapaAtual) ? 'bg-orange-500' : ''}`}
              />
            </div>

            {/* Etapa 3: Responsável */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                etapaAtual === 'responsavel'
                  ? 'bg-orange-500 text-white'
                  : etapaAtual === 'confirmacao'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {etapaAtual === 'confirmacao' ? <Check size={16} /> : '3'}
            </div>
            <div className="w-8 h-1 bg-gray-300">
              <div
                className={`h-full ${etapaAtual === 'confirmacao' ? 'bg-orange-500' : ''}`}
              />
            </div>

            {/* Etapa 4: Confirmação */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                etapaAtual === 'confirmacao'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              4
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {sucesso ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Cadastro Enviado com Sucesso!
              </h3>
              <p className="text-gray-600 mb-6">
                Seu cadastro está em análise. Você receberá um email com o
                resultado em breve.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Etapa 1: Tipo */}
              {etapaAtual === 'tipo' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de cadastro:
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <label data-testid="tipo-entidade" className="relative">
                        <input
                          type="radio"
                          name="tipo"
                          value="entidade"
                          checked={tipo === 'entidade'}
                          onChange={(e) =>
                            setTipo(e.target.value as TipoEntidade)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            tipo === 'entidade'
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-orange-600" />
                            <div>
                              <div className="font-medium">Empresa Privada</div>
                              <div className="text-sm text-gray-600">
                                Contrato direto com funcionários
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>

                      <label data-testid="tipo-clinica" className="relative">
                        <input
                          type="radio"
                          name="tipo"
                          value="clinica"
                          checked={tipo === 'clinica'}
                          onChange={(e) =>
                            setTipo(e.target.value as TipoEntidade)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            tipo === 'clinica'
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-orange-600" />
                            <div>
                              <div className="font-medium">
                                Serviço de Medicina Ocupacional
                              </div>
                              <div className="text-sm text-gray-600">
                                Atendimento a múltiplas empresas
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Etapa 2: Dados */}
              {etapaAtual === 'dados' && (
                <DadosStep
                  dadostomador={dadosContratante}
                  arquivos={arquivos}
                  cnpjError={cnpjError}
                  onChange={handleDadosChange}
                  onFileChange={handleFileChange}
                />
              )}

              {/* Etapa 3: Responsável */}
              {etapaAtual === 'responsavel' && (
                <ResponsavelStep
                  dadosResponsavel={dadosResponsavel}
                  arquivos={arquivos}
                  onChange={handleResponsavelChange}
                  onFileChange={handleFileChange}
                />
              )}

              {/* Etapa 3: Confirmação */}
              {etapaAtual === 'confirmacao' && (
                <ConfirmacaoStep
                  dadostomador={dadosContratante}
                  dadosResponsavel={dadosResponsavel}
                  arquivos={arquivos}
                  confirmacaoFinalAceita={confirmacaoFinalAceita}
                  setConfirmacaoFinalAceita={setConfirmacaoFinalAceita}
                  responsavelLabel={responsavelLabel}
                  codigoRepresentante={codigoRepresentante}
                  onCodigoRepresentanteChange={setCodigoRepresentante}
                  semIndicacao={semIndicacao}
                  setSemIndicacao={setSemIndicacao}
                />
              )}

              {erro && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle
                    size={20}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-800">{erro}</p>
                </div>
              )}

              {/* Actions (sticky para sempre visível) */}
              <div className="sticky bottom-0 bg-white z-30 py-4 px-6 flex items-center justify-between mt-6 pt-4 border-t">
                {etapaAtual !== 'tipo' && etapaAtual !== 'dados' && (
                  <button
                    type="button"
                    onClick={voltarEtapa}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={enviando}
                  >
                    Voltar
                  </button>
                )}

                <div className="ml-auto flex items-center gap-4">
                  {/* Se estiver na etapa de confirmação e o usuário ainda não
                      aceitou, mostramos uma dica visível para orientar */}
                  {etapaAtual === 'confirmacao' && !confirmacaoFinalAceita && (
                    <div className="text-sm text-gray-600">
                      ⚠️ Marque a caixa{' '}
                      <strong>Confirmo que revisei todos os dados</strong> para
                      habilitar o envio
                    </div>
                  )}

                  {etapaAtual !== 'confirmacao' ? (
                    <button
                      type="button"
                      onClick={avancarEtapa}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={
                        enviando || (etapaAtual === 'dados' && !!cnpjError)
                      }
                      title={undefined}
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={
                        enviando ||
                        !confirmacaoFinalAceita ||
                        (!codigoRepresentante.trim() && !semIndicacao)
                      }
                      title={
                        !confirmacaoFinalAceita
                          ? 'Você precisa confirmar que revisou todos os dados'
                          : undefined
                      }
                    >
                      {enviando ? 'Enviando...' : 'Confirmar e Enviar'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
