'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  Eye,
  X,
  Copy,
} from 'lucide-react';
import ModalVerPagamento from '@/components/modals/ModalVerPagamento';
import ModalDefinirValorPersonalizado from '@/components/modals/ModalDefinirValorPersonalizado';
import ModalLinkContratoPersonalizado from '@/components/modals/ModalLinkContratoPersonalizado';

interface Contratante {
  id: number;
  tipo: 'clinica' | 'entidade';
  nome: string;
  razao_social?: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo: string;
  responsavel_email: string;
  responsavel_celular: string;
  cartao_cnpj_path?: string;
  contrato_social_path?: string;
  doc_identificacao_path?: string;
  status:
    | 'pendente'
    | 'aprovado'
    | 'rejeitado'
    | 'em_reanalise'
    | '_pendente'
    | 'aguardando_pagamento'
    | 'pago';
  motivo_rejeicao?: string;
  observacoes_reanalise?: string;
  criado_em: string;
  // Novos campos
  plano_id?: number;
  pagamento_confirmado: boolean;
  data_liberacao_login?: string;
  numero_funcionarios_estimado?: number;
  // Campos de contratacao_personalizada
  contratacao_personalizada_id?: number;
  contratacao_status?: string;
  valor_por_funcionario?: number;
  valor_total_estimado?: number;
  link_enviado_em?: string; // Data/hora do envio do link
  // Coluna computada para controle de aprovação manual
  requer_aprovacao_manual?: boolean;
}

interface NovoscadastrosContentProps {
  onApproved?: () => void;
}

export function NovoscadastrosContent({
  onApproved,
}: NovoscadastrosContentProps) {
  const [contratantes, setContratantes] = useState<Contratante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<
    'todos' | 'clinica' | 'entidade'
  >('todos');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'pendente' | 'aguardando_pagamento' | 'aprovado' | 'rejeitado'
  >('todos');
  const [selectedContratante, setSelectedContratante] =
    useState<Contratante | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<
    'aprovar' | 'rejeitar' | 'reanalise' | 'deletar' | 'regenerar_link'
  >('aprovar');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [observacoesReanalise, setObservacoesReanalise] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Estado para formulário de geração de link: usamos modal em vez do form inline

  // Estados para modais de visualização
  const [_showContratoModal, _setShowContratoModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showValorPersonalizadoModal, setShowValorPersonalizadoModal] =
    useState(false);
  const [showLinkContratoModal, setShowLinkContratoModal] = useState(false);
  const [showRegeneratedLinkModal, setShowRegeneratedLinkModal] =
    useState(false);
  const [regeneratedLinkData, setRegeneratedLinkData] = useState<{
    link: string;
    expiracao: string;
    contratanteNome: string;
  } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [_contratoData, _setContratoData] = useState<any>(null);
  const [pagamentoData, setPagamentoData] = useState<any>(null);
  const [contratoPersonalizadoData, setContratoPersonalizadoData] =
    useState<any>(null);
  const [_loadingContrato, _setLoadingContrato] = useState(false);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [loadingValorPersonalizado, setLoadingValorPersonalizado] =
    useState(false);

  const fetchContratantes = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/admin/novos-cadastros';
      const params = new URLSearchParams();

      if (filtroTipo !== 'todos') {
        params.append('tipo', filtroTipo);
      }

      if (filtroStatus !== 'todos') {
        params.append('status', filtroStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContratantes(data.contratantes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar contratantes:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroStatus]);

  useEffect(() => {
    fetchContratantes();
  }, [filtroTipo, filtroStatus, fetchContratantes]);

  const handleAction = async () => {
    if (!selectedContratante) return;

    setActionLoading(true);
    try {
      const payload: Record<string, unknown> = {
        contratante_id: selectedContratante.id,
        acao: actionType,
      };

      if (actionType === 'rejeitar' && motivoRejeicao) {
        payload.motivo = motivoRejeicao;
      }

      if (actionType === 'reanalise' && observacoesReanalise) {
        payload.observacoes = observacoesReanalise;
      }

      const res = await fetch('/api/admin/novos-cadastros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();

        // Para regenerar_link, mostrar o link gerado
        if (
          actionType === 'regenerar_link' &&
          data.contratante?.link_pagamento
        ) {
          setRegeneratedLinkData({
            link: data.contratante.link_pagamento,
            expiracao: data.contratante.link_expiracao || '48 horas',
            contratanteNome: selectedContratante.nome,
          });
          setShowRegeneratedLinkModal(true);
        }

        setShowModal(false);
        setSelectedContratante(null);
        setMotivoRejeicao('');
        setObservacoesReanalise('');
        await fetchContratantes();
        if (onApproved) {
          onApproved();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao processar ação');
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = async (
    contratante: Contratante,
    action: 'aprovar' | 'rejeitar' | 'reanalise' | 'deletar' | 'regenerar_link'
  ) => {
    setSelectedContratante(contratante);
    setActionType(action);

    // Verificar se é plano personalizado para aprovação
    if (action === 'aprovar' && contratante.plano_id) {
      try {
        const planoRes = await fetch(
          `/api/admin/planos/${contratante.plano_id}`
        );
        if (planoRes.ok) {
          const planoData = await planoRes.json();
          if (planoData.success && planoData.plano?.tipo === 'personalizado') {
            // É plano personalizado - abrir modal específico
            setShowValorPersonalizadoModal(true);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tipo do plano:', error);
      }
    }

    // Modal padrão para outros casos
    setShowModal(true);
  };

  // Função verContrato removida - agora é link direto para /termos/contrato

  const verPagamento = async (contratante: Contratante) => {
    setLoadingPagamento(true);
    setSelectedContratante(contratante);
    try {
      const res = await fetch(`/api/admin/pagamentos/${contratante.id}`);
      if (res.ok) {
        const data = await res.json();
        setPagamentoData(data.pagamento);
        setShowPagamentoModal(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao buscar pagamento');
      }
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      alert('Erro ao buscar pagamento');
    } finally {
      setLoadingPagamento(false);
    }
  };

  const _gerarLinkContratoPersonalizado = async (contratante: Contratante) => {
    setLoadingValorPersonalizado(true);
    setSelectedContratante(contratante);
    try {
      // Buscar dados do contrato personalizado
      const res = await fetch(`/api/admin/contratos/${contratante.id}`);
      if (res.ok) {
        const data = await res.json();
        setContratoPersonalizadoData({
          contratoId: data.contrato.id,
          contratanteNome: contratante.nome,
          valorPorFuncionario: data.contrato.valor_por_funcionario,
          numeroFuncionarios: data.contrato.numero_funcionarios,
          valorTotal: data.contrato.valor_total,
        });
        setShowLinkContratoModal(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao buscar dados do contrato');
      }
    } catch (error) {
      console.error('Erro ao buscar contrato personalizado:', error);
      alert('Erro ao buscar dados do contrato');
    } finally {
      setLoadingValorPersonalizado(false);
    }
  };

  const handleConfirmarValorPersonalizado = async (
    valorPorFuncionario: number,
    numeroFuncionarios?: number
  ) => {
    if (!selectedContratante) return;

    setLoadingValorPersonalizado(true);
    try {
      // Garantir que numeroFuncionarios seja válido
      const numFunc =
        numeroFuncionarios ||
        selectedContratante.numero_funcionarios_estimado ||
        1;

      const payload = {
        acao: 'aprovar_personalizado',
        contratante_id: selectedContratante.id,
        valor_por_funcionario: valorPorFuncionario,
        numero_funcionarios: numFunc,
      };

      const res = await fetch('/api/admin/novos-cadastros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setShowValorPersonalizadoModal(false);

        // Preparar dados para o modal de link usando os dados retornados
        const modalData = {
          contratoId: data.contratante.id,
          contratanteNome: data.contratante.nome,
          valorPorFuncionario: data.contratante.valor_por_funcionario,
          numeroFuncionarios: data.contratante.numero_funcionarios,
          valorTotal: data.contratante.valor_total,
          linkContrato: data.contratante.link_pagamento,
        };

        setContratoPersonalizadoData(modalData);

        // Pequeno delay para garantir que o estado seja atualizado antes de abrir o modal
        setTimeout(() => {
          setShowLinkContratoModal(true);
        }, 100);

        await fetchContratantes();
        if (onApproved) {
          onApproved();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao definir valor personalizado');
      }
    } catch (error) {
      console.error('Erro ao definir valor personalizado:', error);
      alert('Erro ao definir valor personalizado');
    } finally {
      setLoadingValorPersonalizado(false);
    }
  };

  // Abre o modal de definição de valor para contrato personalizado
  const openDefinirValorModal = (contratante: Contratante) => {
    setSelectedContratante(contratante);
    setShowValorPersonalizadoModal(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header com filtros */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Novos Cadastros
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro por tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroTipo === 'todos'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('clinica')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroTipo === 'clinica'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clínicas
            </button>
            <button
              onClick={() => setFiltroTipo('entidade')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroTipo === 'entidade'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entidades
            </button>
          </div>

          {/* Filtro por status (NOVO) */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroStatus === 'todos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos Status
            </button>
            <button
              onClick={() => setFiltroStatus('pendente')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroStatus === 'pendente'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendente
            </button>
            <button
              onClick={() => setFiltroStatus('aguardando_pagamento')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroStatus === 'aguardando_pagamento'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aguardando Pagamento
            </button>
            <button
              onClick={() => setFiltroStatus('aprovado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filtroStatus === 'aprovado'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aprovado
            </button>
          </div>
        </div>
      </div>

      {/* Lista de contratantes */}
      {contratantes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cadastro pendente</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Alerta de Contratações Personalizadas Pendentes */}
          {contratantes.filter(
            (c) =>
              c.contratacao_personalizada_id &&
              c.contratacao_status === 'aguardando_valor_admin'
          ).length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-orange-900 font-semibold mb-2">
                    ⚠️{' '}
                    {
                      contratantes.filter(
                        (c) =>
                          c.contratacao_personalizada_id &&
                          c.contratacao_status === 'aguardando_valor_admin'
                      ).length
                    }{' '}
                    Plano(s) Personalizado(s) Aguardando Definição de Valor
                  </h4>
                  <p className="text-sm text-orange-800 mb-2">
                    As empresas abaixo solicitaram plano personalizado e estão
                    aguardando que você defina:
                  </p>
                  <ul className="text-sm text-orange-800 list-disc list-inside space-y-1">
                    <li>Número de funcionários a serem avaliados</li>
                    <li>Valor por funcionário</li>
                    <li>Geração do link de proposta para aceite</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {contratantes.map((contratante) => (
            <div
              key={contratante.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {contratante.tipo === 'clinica' ? (
                    <Stethoscope className="w-8 h-8 text-blue-500" />
                  ) : (
                    <Building2 className="w-8 h-8 text-green-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contratante.nome}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {contratante.tipo === 'clinica'
                        ? 'Serviço de Medicina Ocupacional'
                        : 'Empresa Privada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Badge PLANO PERSONALIZADO (DESTAQUE) */}
                  {contratante.contratacao_personalizada_id &&
                    contratante.contratacao_status ===
                      'aguardando_valor_admin' && (
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                        🔥 PLANO PERSONALIZADO
                      </span>
                    )}

                  {/* Badge de status de pagamento (NOVO) */}
                  {contratante.pagamento_confirmado ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ✓ Pago
                    </span>
                  ) : contratante.status === 'aguardando_pagamento' ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Aguardando Pagamento
                    </span>
                  ) : null}

                  {contratante.status === 'em_reanalise' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Em Reanálise
                    </span>
                  )}
                  {contratante.status === 'pendente' && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      Pendente
                    </span>
                  )}
                  {contratante.status === 'pago' &&
                    !contratante.data_liberacao_login && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        Pronto para Aprovação
                      </span>
                    )}
                </div>
              </div>

              {/* Informações da empresa */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>CNPJ: {contratante.cnpj}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{contratante.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{contratante.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {contratante.cidade}/{contratante.estado}
                  </span>
                </div>
              </div>

              {/* Informações do responsável */}
              <div className="border-t pt-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Responsável:
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>{contratante.responsavel_nome}</div>
                  <div>CPF: {contratante.responsavel_cpf}</div>
                  <div>{contratante.responsavel_email}</div>
                  <div>{contratante.responsavel_celular}</div>
                </div>
              </div>

              {/* Informações de Plano/Contrato/Pagamento */}
              {(contratante.plano_id || contratante.pagamento_confirmado) && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Contratação:
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    {contratante.plano_id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Plano ID: {contratante.plano_id}
                      </span>
                    )}
                    {contratante.pagamento_confirmado && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Pagamento Confirmado
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/termos/contrato"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Contrato
                    </a>
                    {contratante.pagamento_confirmado && (
                      <button
                        onClick={() => verPagamento(contratante)}
                        disabled={loadingPagamento}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Pagamento
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DESTAQUE: Plano Personalizado Aguardando Valor */}
              {contratante.contratacao_personalizada_id &&
                contratante.contratacao_status === 'aguardando_valor_admin' && (
                  <div className="border-t pt-4 mb-4">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-400 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-orange-900 font-bold mb-1">
                            Plano Personalizado - Ação Necessária
                          </h4>
                          <p className="text-sm text-orange-800 mb-2">
                            Esta empresa solicitou um plano personalizado. Você
                            precisa definir o valor e gerar o link de proposta.
                          </p>
                          <div className="bg-white rounded p-2 text-xs text-gray-700 mb-3">
                            <p>
                              <strong>Funcionários estimados:</strong>{' '}
                              {contratante.numero_funcionarios_estimado ||
                                'Não informado'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedContratante(contratante);
                          setShowValorPersonalizadoModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Definir Valor e Gerar Link de Proposta
                      </button>
                    </div>
                  </div>
                )}

              {/* Anexos */}
              <div className="border-t pt-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Documentos anexados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {contratante.cartao_cnpj_path && (
                    <a
                      href={contratante.cartao_cnpj_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                    >
                      <Download className="w-3 h-3" />
                      Cartão CNPJ
                    </a>
                  )}
                  {contratante.contrato_social_path && (
                    <a
                      href={contratante.contrato_social_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                    >
                      <Download className="w-3 h-3" />
                      Contrato Social
                    </a>
                  )}
                  {contratante.doc_identificacao_path && (
                    <a
                      href={contratante.doc_identificacao_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                    >
                      <Download className="w-3 h-3" />
                      Doc. Identificação
                    </a>
                  )}
                </div>
              </div>

              {/* Observações de reanálise (se houver) */}
              {contratante.status === 'em_reanalise' &&
                contratante.observacoes_reanalise && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm font-medium text-yellow-700 mb-1">
                      Observações para reanálise:
                    </p>
                    <p className="text-sm text-gray-600">
                      {contratante.observacoes_reanalise}
                    </p>
                  </div>
                )}

              {/* Ações */}
              <div className="border-t pt-4">
                {/* Mostrar formulário de geração de link apenas para status pendente ou em_reanalise */}
                {(contratante.status === 'pendente' ||
                  contratante.status === 'em_reanalise') && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700">
                      Gerar Link do Contrato Personalizado:
                    </p>

                    {/* Abre modal para definir valores e gerar link (removido form inline) */}
                    <button
                      onClick={() => openDefinirValorModal(contratante)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Definir Valores e Gerar Link
                    </button>
                  </div>
                )}

                {/* Mensagens para outros status */}
                {contratante.status === '_pendente' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📋</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Link do Contrato Gerado
                        </p>
                        <p className="text-xs text-blue-700">
                          Status: Aguardando aceite e confirmação de pagamento
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-blue-700">
                          <li>• Contratante precisa acessar o link</li>
                          <li>• Aceitar os termos do contrato</li>
                          <li>• Realizar o pagamento</li>
                          <li>
                            • Login será liberado automaticamente após pagamento
                            confirmado
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {contratante.status === 'aguardando_pagamento' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                    ⏳ Contrato aceito. Aguardando confirmação de pagamento pelo
                    contratante.
                  </div>
                )}

                {contratante.status === 'aprovado' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                    ✅ Pagamento confirmado. Login liberado automaticamente para
                    o contratante.
                  </div>
                )}

                {contratante.status === 'rejeitado' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                    ❌ Cadastro rejeitado.
                    {contratante.motivo_rejeicao && (
                      <p className="mt-1">
                        <strong>Motivo:</strong> {contratante.motivo_rejeicao}
                      </p>
                    )}
                  </div>
                )}

                {/* Botões de ação para status não finalizados */}
                {contratante.status !== 'aprovado' && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {contratante.status === 'pendente' &&
                      contratante.requer_aprovacao_manual !== false && (
                        <>
                          <button
                            onClick={() =>
                              openActionModal(contratante, 'aprovar')
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() =>
                              openActionModal(contratante, 'reanalise')
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Reanálise
                          </button>
                          <button
                            onClick={() =>
                              openActionModal(contratante, 'rejeitar')
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </button>
                        </>
                      )}
                    {contratante.status === 'aguardando_pagamento' && (
                      <>
                        <button
                          onClick={() =>
                            openActionModal(contratante, 'regenerar_link')
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Regenerar Link
                        </button>
                        {contratante.requer_aprovacao_manual !== false && (
                          <button
                            onClick={() =>
                              openActionModal(contratante, 'aprovar')
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Forçar Aprovação
                          </button>
                        )}
                      </>
                    )}

                    {contratante.status === '_pendente' && (
                      <button
                        onClick={() => openActionModal(contratante, 'aprovar')}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Forçar Aprovação
                      </button>
                    )}
                    <button
                      onClick={() => openActionModal(contratante, 'deletar')}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Deletar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      {showModal && selectedContratante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'aprovar' && 'Confirmar Aprovação'}
              {actionType === 'rejeitar' && 'Confirmar Rejeição'}
              {actionType === 'reanalise' && 'Solicitar Reanálise'}
              {actionType === 'regenerar_link' &&
                'Confirmar Regeneração de Link'}
              {actionType === 'deletar' && 'Confirmar Exclusão Definitiva'}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {actionType === 'aprovar' &&
                `Tem certeza que deseja aprovar o cadastro de ${selectedContratante.nome}?`}
              {actionType === 'rejeitar' &&
                `Informe o motivo da rejeição de ${selectedContratante.nome}:`}
              {actionType === 'reanalise' &&
                `Informe as observações para reanálise de ${selectedContratante.nome}:`}
              {actionType === 'regenerar_link' &&
                `Tem certeza que deseja regenerar o link de pagamento para ${selectedContratante.nome}? Um novo link será gerado e o anterior será invalidado.`}
              {actionType === 'deletar' &&
                `ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os dados de ${selectedContratante.nome} serão excluídos permanentemente, incluindo contratos e arquivos. Tem certeza?`}
            </p>

            {actionType === 'rejeitar' && (
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Motivo da rejeição..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 h-24 resize-none"
                required
              />
            )}

            {actionType === 'reanalise' && (
              <textarea
                value={observacoesReanalise}
                onChange={(e) => setObservacoesReanalise(e.target.value)}
                placeholder="Observações para reanálise..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 h-24 resize-none"
                required
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-2 text-white rounded-md ${
                  actionType === 'aprovar'
                    ? 'bg-green-500 hover:bg-green-600'
                    : actionType === 'reanalise'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : actionType === 'regenerar_link'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : actionType === 'deletar'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50`}
                disabled={
                  actionLoading ||
                  (actionType === 'rejeitar' && !motivoRejeicao.trim()) ||
                  (actionType === 'reanalise' && !observacoesReanalise.trim())
                }
              >
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Contrato REMOVIDO - agora é link direto */}

      {/* Modal Ver Pagamento */}
      {showPagamentoModal && pagamentoData && selectedContratante && (
        <ModalVerPagamento
          isOpen={showPagamentoModal}
          onClose={() => {
            setShowPagamentoModal(false);
            setPagamentoData(null);
          }}
          pagamento={pagamentoData}
          contratante={{
            nome: selectedContratante.nome,
            cnpj: selectedContratante.cnpj,
          }}
        />
      )}

      {/* Modal Definir Valor Personalizado */}
      {showValorPersonalizadoModal && selectedContratante && (
        <ModalDefinirValorPersonalizado
          isOpen={showValorPersonalizadoModal}
          onClose={() => {
            setShowValorPersonalizadoModal(false);
            setSelectedContratante(null);
          }}
          contratante={{
            ...selectedContratante,
            numero_funcionarios_estimado:
              selectedContratante.numero_funcionarios_estimado,
          }}
          onConfirm={handleConfirmarValorPersonalizado}
          loading={loadingValorPersonalizado}
        />
      )}

      {/* Modal de Link do Contrato Personalizado */}
      {contratoPersonalizadoData && (
        <ModalLinkContratoPersonalizado
          isOpen={showLinkContratoModal}
          onClose={() => {
            setShowLinkContratoModal(false);
            setContratoPersonalizadoData(null);
            setSelectedContratante(null);
          }}
          contratoId={contratoPersonalizadoData.contratoId}
          contratanteNome={contratoPersonalizadoData.contratanteNome}
          valorPorFuncionario={contratoPersonalizadoData.valorPorFuncionario}
          numeroFuncionarios={contratoPersonalizadoData.numeroFuncionarios}
          valorTotal={contratoPersonalizadoData.valorTotal}
          linkContrato={contratoPersonalizadoData.linkContrato}
        />
      )}

      {/* Modal de Link Regenerado */}
      {showRegeneratedLinkModal && regeneratedLinkData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Link Regenerado com Sucesso
              </h3>
              <button
                onClick={() => {
                  setShowRegeneratedLinkModal(false);
                  setRegeneratedLinkData(null);
                  setLinkCopiado(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Novo link de pagamento gerado para{' '}
                <strong>{regeneratedLinkData.contratanteNome}</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link de Pagamento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regeneratedLinkData.link}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(regeneratedLinkData.link);
                      setLinkCopiado(true);
                      setTimeout(() => setLinkCopiado(false), 3000);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    {linkCopiado ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Expira em: {regeneratedLinkData.expiracao}
              </p>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRegeneratedLinkModal(false);
                    setRegeneratedLinkData(null);
                    setLinkCopiado(false);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
