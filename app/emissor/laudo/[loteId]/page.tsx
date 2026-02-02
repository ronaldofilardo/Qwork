'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { LaudoPadronizado } from '@/lib/laudo-tipos';
import QworkLogo from '@/components/QworkLogo';
import ModalUploadLaudo from '@/components/modals/ModalUploadLaudo';

interface Lote {
  id: number;
  codigo: string;
  empresa_nome: string;
  clinica_nome: string;
}

export default function EditarLaudo() {
  const params = useParams();
  const loteId = parseInt(params.loteId as string);
  const router = useRouter();

  const [lote, setLote] = useState<Lote | null>(null);
  const [laudoPadronizado, setLaudoPadronizado] =
    useState<LaudoPadronizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [_emissaoAutomatica, setEmissaoAutomatica] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [isPrevia, setIsPrevia] = useState(false);
  const [gerandoLaudo, setGerandoLaudo] = useState(false);
  const [modalUploadOpen, setModalUploadOpen] = useState(false);

  const fetchLaudo = useCallback(async () => {
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`);
      const data = await response.json();

      if (data.success) {
        setLote(data.lote);
        setLaudoPadronizado(data.laudoPadronizado);
        setIsPrevia(Boolean(data.previa));
        setEmissaoAutomatica(Boolean(data.emissao_automatica));
        setMensagem(data.mensagem || null);
      } else {
        toast.error(data.error || 'Erro ao carregar laudo');
        router.push('/emissor');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar laudo:', err);
      toast.error('Erro ao conectar com o servidor');
      router.push('/emissor');
    } finally {
      setLoading(false);
    }
  }, [loteId, router]);

  useEffect(() => {
    fetchLaudo();
  }, [loteId, router, fetchLaudo]);

  const handleGerarLaudo = async () => {
    if (!lote) return;

    try {
      setGerandoLaudo(true);
      toast.loading('Gerando laudo...', { id: 'gerar-laudo' });

      const response = await fetch(`/api/emissor/laudos/${loteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.dismiss('gerar-laudo');
        toast.success('Laudo gerado com sucesso!');
        // Recarregar a página para mostrar o laudo gerado
        await fetchLaudo();
      } else {
        toast.dismiss('gerar-laudo');
        toast.error(data.error || 'Erro ao gerar laudo');
      }
    } catch (error) {
      console.error('Erro ao gerar laudo:', error);
      toast.dismiss('gerar-laudo');
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setGerandoLaudo(false);
    }
  };

  const handleDownloadLaudo = async () => {
    try {
      toast.loading('Baixando laudo...', { id: 'download-laudo' });
      const response = await fetch(`/api/emissor/laudos/${loteId}/download`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss('download-laudo');
        toast.error(`Erro ao baixar laudo: ${errorData.error}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${lote?.codigo || loteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss('download-laudo');
      toast.success('Laudo baixado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.dismiss('download-laudo');
      toast.error('Erro ao fazer download do laudo');
    }
  };

  const handleOpenUploadModal = () => {
    setModalUploadOpen(true);
  };

  const handleUploadSuccess = async (laudoId: number) => {
    setModalUploadOpen(false);
    toast.success(`Laudo ${laudoId} emitido com sucesso!`);
    // Recarregar para mostrar laudo emitido
    await fetchLaudo();
  };

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
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/emissor')}
            className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
          >
            ← Voltar ao Dashboard
          </button>

          {isPrevia && (
            <div className="flex gap-3">
              <button
                onClick={handleOpenUploadModal}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload de Laudo
              </button>
              <button
                onClick={handleGerarLaudo}
                disabled={gerandoLaudo}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {gerandoLaudo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Gerar Automaticamente
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {mensagem && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{mensagem}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Cabeçalho Visual - Padrão BPS */}
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

          {/* Seção Etapa 1 - Dados Gerais da Empresa */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-600">
              1. DADOS GERAIS DA EMPRESA AVALIADA
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  Empresa Avaliada:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {laudoPadronizado.etapa1.empresaAvaliada}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  CNPJ:
                </span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.cnpj}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  Endereço:
                </span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.endereco}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  Período das Avaliações Consideradas:
                </span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.periodoAvaliacoes.dataLiberacao} a{' '}
                  {
                    laudoPadronizado.etapa1.periodoAvaliacoes
                      .dataUltimaConclusao
                  }
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  Total de Funcionários Avaliados:
                </span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.totalFuncionariosAvaliados}{' '}
                  <span className="text-green-600 font-semibold">
                    ({laudoPadronizado.etapa1.percentualConclusao}% das
                    avaliações liberadas foram concluídas)
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  Amostra:
                </span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.amostra.operacional} funcionários do
                  nível <span className="font-semibold">Operacional</span> +{' '}
                  {laudoPadronizado.etapa1.amostra.gestao} do nível{' '}
                  <span className="font-semibold">Gestão</span>
                </span>
              </div>
            </div>
          </div>

          {/* Seção Etapa 2 - Tabela de Scores por Grupo */}
          {laudoPadronizado.etapa2 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-600">
                2. SCORES MÉDIOS POR GRUPO DE QUESTÕES (escala 0-100)
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                      <th
                        className="border border-gray-500 px-3 py-2 text-center text-xs font-bold text-white"
                        style={{ minWidth: '60px' }}
                      >
                        Grupo
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-left text-xs font-bold text-white">
                        Domínio
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-left text-xs font-bold text-white">
                        Descrição
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Tipo
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                        x̄ - s
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Média Geral
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                        x̄ + s
                      </th>
                      <th className="border border-gray-500 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Categoria de Risco
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {laudoPadronizado.etapa2.map((score, index) => (
                      <tr
                        key={score.grupo}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-900 text-sm font-bold">
                            {score.grupo}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="text-xs font-medium text-gray-800">
                            {score.dominio}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="text-xs text-gray-600">
                            {score.descricao}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              score.tipo === 'positiva'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {score.tipo === 'positiva'
                              ? 'Positiva'
                              : 'Negativa'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs text-gray-700">
                            {score.mediaMenosDP.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs font-bold text-gray-900">
                            {score.media.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs text-gray-700">
                            {score.mediaMaisDP.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                              score.classificacaoSemaforo === 'verde'
                                ? 'bg-green-100 text-green-800'
                                : score.classificacaoSemaforo === 'amarelo'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {score.categoriaRisco === 'baixo'
                              ? 'Excelente'
                              : score.categoriaRisco === 'medio'
                                ? 'Monitorar'
                                : 'Atenção Necessária'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 bg-gray-50 rounded p-2 border-l-4 border-gray-500">
                <p className="text-xs text-gray-700">
                  <strong>x̄</strong> = média, <strong>s</strong> = desvio-padrão
                </p>
              </div>

              <div className="mt-4 bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
                <p className="text-sm text-gray-800 leading-relaxed text-justify">
                  A amostragem acima descrita foi submetida à avaliação
                  psicossocial para verificação de seu estado de saúde mental,
                  como condição necessária à realização do trabalho. Durante o
                  período da avaliação, foi possível identificar os pontos acima
                  descritos.
                </p>
              </div>
            </div>
          )}

          {/* Seção Etapa 3 - Interpretação e Recomendações */}
          {laudoPadronizado.etapa3 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-600">
                3. INTERPRETAÇÃO E RECOMENDAÇÕES
              </h2>

              {/* Texto Principal */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed">
                    {laudoPadronizado.etapa3.conclusao}
                  </p>
                </div>
              </div>

              {/* Resumo dos grupos por categoria */}
              <div className="space-y-6">
                {/* Excelente - Verde */}
                {laudoPadronizado.etapa3.gruposExcelente &&
                  laudoPadronizado.etapa3.gruposExcelente.length > 0 && (
                    <div className="rounded-lg p-5">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">🟢</span>
                        <h4 className="font-bold text-green-800 text-base">
                          1. Risco Psicossocial Baixo (menor que 33%)
                        </h4>
                      </div>
                      <p className="text-xs text-green-700 font-medium mb-2">
                        Consideração final detalhada:
                      </p>
                      <p className="text-sm text-green-800 mb-3">
                        Os resultados obtidos no Questionário Psicossocial de
                        Copenhague (COPSOQ) indicam um baixo risco psicossocial
                        no ambiente de trabalho, correspondendo ao tertil
                        inferior de exposição a fatores de risco. Isso significa
                        que, de modo geral, as condições organizacionais
                        favorecem o bem-estar e a saúde mental dos
                        trabalhadores. Os fatores psicossociais avaliados — como
                        demandas quantitativas, emocionais, apoio social,
                        influência no trabalho, reconhecimento e equilíbrio
                        entre vida pessoal e profissional — estão sendo geridos
                        de forma adequada, sem evidências de impactos negativos
                        relevantes.
                      </p>
                      <p className="text-sm text-green-800 mb-3">
                        De acordo com a NR-01, um cenário de baixo risco não
                        elimina a necessidade de monitoramento contínuo, mas
                        demonstra que as ações preventivas e de promoção à saúde
                        mental estão sendo eficazes. Recomenda-se que a
                        organização mantenha as boas práticas atuais, como:
                      </p>
                      <ul className="text-sm text-green-800 space-y-1 ml-4">
                        <li>• Comunicação aberta entre equipes e gestores;</li>
                        <li>
                          • Políticas de reconhecimento e valorização
                          profissional;
                        </li>
                        <li>
                          • Programas de qualidade de vida e equilíbrio
                          emocional;
                        </li>
                        <li>
                          • Incentivo ao diálogo e à escuta ativa em todos os
                          níveis hierárquicos.
                        </li>
                      </ul>
                      <p className="text-sm text-green-800 mt-3">
                        Mesmo em ambientes com baixo risco, a manutenção do
                        clima organizacional e da motivação depende de atenção
                        constante. Sugere-se incluir este resultado no
                        Inventário de Riscos do Programa de Gerenciamento de
                        Riscos (PGR), assegurando que as condições favoráveis
                        atuais sejam acompanhadas e mantidas de forma
                        sistemática, alinhando-se às diretrizes do COPSOQ para
                        avaliações periódicas.
                      </p>
                      <div className="mt-4">
                        <p className="text-xs text-green-700 font-medium mb-2">
                          Grupos identificados:
                        </p>
                        <div className="space-y-3">
                          {laudoPadronizado.etapa3.gruposExcelente.map(
                            (g, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-green-300 pl-3"
                              >
                                <p className="text-sm text-green-800 font-semibold mb-1">
                                  {g.grupo}. {g.dominio}
                                </p>
                                <p className="text-xs text-green-700 leading-relaxed">
                                  {g.acaoRecomendada}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Monitorar - Amarelo */}
                {laudoPadronizado.etapa3.gruposMonitoramento &&
                  laudoPadronizado.etapa3.gruposMonitoramento.length > 0 && (
                    <div className="rounded-lg p-5">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">🟡</span>
                        <h4 className="font-bold text-yellow-800 text-base">
                          2. Risco Psicossocial Moderado (entre 33% e 66%)
                        </h4>
                      </div>
                      <p className="text-xs text-yellow-700 font-medium mb-2">
                        Consideração final detalhada:
                      </p>
                      <p className="text-sm text-yellow-800 mb-3">
                        O resultado do Questionário Psicossocial de Copenhague
                        (COPSOQ) aponta para um nível moderado de risco
                        psicossocial, correspondendo ao tertil médio de
                        exposição, indicando que o ambiente de trabalho
                        apresenta algumas situações ou percepções que merecem
                        atenção preventiva. Isso pode envolver fatores como
                        demandas moderadas de trabalho, falhas na comunicação
                        interna, falta de clareza nas metas, períodos de
                        estresse temporário ou desafios pontuais no
                        relacionamento entre equipes e gestores.
                      </p>
                      <p className="text-sm text-yellow-800 mb-3">
                        Conforme a NR-01, cabe à organização identificar as
                        causas desses resultados e implantar ações de controle e
                        prevenção antes que se agravem. As medidas podem
                        incluir:
                      </p>
                      <ul className="text-sm text-yellow-800 space-y-1 ml-4">
                        <li>
                          • Reuniões de alinhamento sobre papéis e
                          responsabilidades;
                        </li>
                        <li>• Adequação das cargas e jornadas de trabalho;</li>
                        <li>
                          • Programas de apoio psicológico ou rodas de conversa
                          internas;
                        </li>
                        <li>
                          • Treinamentos voltados à gestão empática e ao
                          fortalecimento do trabalho em equipe.
                        </li>
                      </ul>
                      <p className="text-sm text-yellow-800 mt-3">
                        É essencial que essas ações sejam documentadas e
                        acompanhadas no Programa de Gerenciamento de Riscos
                        (PGR), com reavaliações periódicas para medir a eficácia
                        das melhorias implementadas, utilizando os benchmarks do
                        COPSOQ como referência. Embora o risco moderado não
                        represente uma situação crítica, ele sinaliza pontos de
                        atenção que, se não tratados, podem evoluir para um
                        risco elevado no futuro.
                      </p>
                      <div className="mt-4">
                        <p className="text-xs text-yellow-700 font-medium mb-2">
                          Grupos identificados:
                        </p>
                        <div className="space-y-3">
                          {laudoPadronizado.etapa3.gruposMonitoramento.map(
                            (g, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-yellow-300 pl-3"
                              >
                                <p className="text-sm text-yellow-800 font-semibold mb-1">
                                  {g.grupo}. {g.dominio}
                                </p>
                                <p className="text-xs text-yellow-700 leading-relaxed">
                                  {g.acaoRecomendada}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Atenção Necessária - Laranja/Vermelho */}
                {laudoPadronizado.etapa3.gruposAltoRisco &&
                  laudoPadronizado.etapa3.gruposAltoRisco.length > 0 && (
                    <div className="rounded-lg p-5">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">🔴</span>
                        <h4 className="font-bold text-red-800 text-base">
                          3. Risco Psicossocial Elevado (maior que 66%)
                        </h4>
                      </div>
                      <p className="text-xs text-red-700 font-medium mb-2">
                        Consideração final detalhada:
                      </p>
                      <p className="text-sm text-red-800 mb-3">
                        O resultado do Questionário Psicossocial de Copenhague
                        (COPSOQ) indica um risco psicossocial elevado,
                        correspondendo ao tertil superior de exposição, o que
                        significa que há fatores importantes interferindo na
                        saúde mental e emocional dos trabalhadores. Esse cenário
                        pode estar relacionado a demandas altas de trabalho,
                        falta de reconhecimento, pressão excessiva, ausência de
                        apoio da liderança, conflitos interpessoais ou ambiente
                        organizacional desgastante, potencialmente levando a
                        condições como ansiedade, depressão ou burnout.
                      </p>
                      <p className="text-sm text-red-800 mb-3">
                        Segundo a NR-01, quando um risco é classificado como
                        elevado, a empresa deve agir de forma estruturada e
                        imediata, buscando identificar as causas raiz e
                        implantar medidas corretivas e preventivas eficazes.
                        Essas medidas podem incluir:
                      </p>
                      <ul className="text-sm text-red-800 space-y-1 ml-4">
                        <li>
                          • Implementação de programas de apoio psicológico e
                          escuta ativa;
                        </li>
                        <li>
                          • Revisão de processos organizacionais e distribuição
                          de tarefas;
                        </li>
                        <li>
                          • Capacitação de gestores em liderança humanizada e
                          prevenção de assédio moral;
                        </li>
                        <li>
                          • Melhoria na comunicação interna e nos canais de
                          feedback;
                        </li>
                        <li>
                          • Promoção de ações voltadas à saúde mental e ao
                          equilíbrio entre trabalho e vida pessoal, com
                          intervenção prioritária.
                        </li>
                      </ul>
                      <p className="text-sm text-red-800 mt-3">
                        Esse nível de risco exige registro detalhado no
                        inventário de riscos do PGR, bem como acompanhamento
                        contínuo por parte da alta gestão e dos responsáveis
                        pelo SESMT ou equipe de saúde e segurança, alinhando-se
                        aos critérios de risco do COPSOQ. A ausência de ações
                        concretas pode gerar adoecimento ocupacional,
                        absenteísmo e queda de produtividade, devendo a
                        organização priorizar planos de intervenção imediata
                        para mitigar os impactos.
                      </p>
                      <div className="mt-4">
                        <p className="text-xs text-red-700 font-medium mb-2">
                          Grupos identificados:
                        </p>
                        <div className="space-y-3">
                          {laudoPadronizado.etapa3.gruposAltoRisco.map(
                            (g, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-red-300 pl-3"
                              >
                                <p className="text-sm text-red-800 font-semibold mb-1">
                                  {g.grupo}. {g.dominio}
                                </p>
                                <p className="text-xs text-red-700 leading-relaxed">
                                  {g.acaoRecomendada}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Seção Etapa 4 - Observações e Conclusão */}
          {laudoPadronizado.etapa4 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-600">
                4. OBSERVAÇÕES E CONCLUSÃO
              </h2>

              {/* Observações do Laudo (opcional) */}
              {laudoPadronizado.etapa4.observacoesLaudo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Observações do Laudo
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
                    <div
                      className="text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: laudoPadronizado.etapa4.observacoesLaudo,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Conclusão */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Conclusão
                </h3>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium text-base">
                    {laudoPadronizado.etapa4.textoConclusao}
                  </div>

                  {/* Assinatura Digital gov.br */}
                  <div className="mt-10 pt-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-2xl mx-auto text-center shadow-sm">
                      {/* Cabeçalho com Data */}
                      <div className="text-lg font-bold text-black mb-6">
                        {laudoPadronizado.etapa4.dataEmissao}
                      </div>

                      {/* Logo e Status */}
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

                      {/* Nome do Assinante */}
                      <div className="text-base font-bold uppercase text-black mb-2 tracking-wide">
                        {laudoPadronizado.etapa4.assinatura.nome}
                      </div>

                      {/* Data/Hora da Assinatura */}
                      <div className="text-gray-600 text-sm mb-2">
                        Data:{' '}
                        {laudoPadronizado.emitidoEm
                          ? new Date(
                              laudoPadronizado.emitidoEm
                            ).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }) +
                            ' ' +
                            new Date(
                              laudoPadronizado.emitidoEm
                            ).toLocaleTimeString('pt-BR') +
                            ' -0300'
                          : new Date().toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }) +
                            ' ' +
                            new Date().toLocaleTimeString('pt-BR') +
                            ' -0300'}
                      </div>

                      {/* Link do Verificador */}
                      <div className="text-gray-500 text-xs mb-5">
                        Verifique em https://verificador.iti.br
                      </div>

                      {/* Cargo/Função */}
                      <div className="text-sm font-medium text-black mt-5">
                        Coordenador Responsável Técnico – Qwork
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divisor antes da seção de Observações do Emissor */}
          <div className="border-t-4 border-gray-300 my-10"></div>

          {/* Mensagem de Status - Emissão Automática */}
          {mensagem && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">ℹ️ {mensagem}</p>
            </div>
          )}

          {/* Seção Observações do Emissor - Apenas Visualização */}
          {laudoPadronizado.observacoesEmissor && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-orange-400">
                4. OBSERVAÇÕES DO EMISSOR
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {laudoPadronizado.observacoesEmissor}
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
              {laudoPadronizado.criadoEm && (
                <p>
                  📅 Criado em{' '}
                  {new Date(laudoPadronizado.criadoEm).toLocaleDateString(
                    'pt-BR'
                  )}{' '}
                  às{' '}
                  {new Date(laudoPadronizado.criadoEm).toLocaleTimeString(
                    'pt-BR',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              )}
              {laudoPadronizado.emitidoEm && (
                <p>
                  ✅ Emitido automaticamente em{' '}
                  {new Date(laudoPadronizado.emitidoEm).toLocaleDateString(
                    'pt-BR'
                  )}{' '}
                  às{' '}
                  {new Date(laudoPadronizado.emitidoEm).toLocaleTimeString(
                    'pt-BR',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              )}
              {laudoPadronizado.enviadoEm && (
                <p>
                  📤 Enviado automaticamente em{' '}
                  {new Date(laudoPadronizado.enviadoEm).toLocaleDateString(
                    'pt-BR'
                  )}{' '}
                  às{' '}
                  {new Date(laudoPadronizado.enviadoEm).toLocaleTimeString(
                    'pt-BR',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              )}
              {laudoPadronizado.status === 'enviado' && (
                <p className="text-green-600 font-semibold">
                  ✓ Status: Enviado para clínica
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {laudoPadronizado.status === 'enviado' && (
                <button
                  onClick={handleDownloadLaudo}
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

          {/* Logo ao final da tela */}
          {laudoPadronizado.status === 'enviado' && (
            <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
              <QworkLogo size="md" showSlogan={false} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Upload */}
      <ModalUploadLaudo
        loteId={loteId}
        loteCodigo={lote?.codigo || ''}
        isOpen={modalUploadOpen}
        onClose={() => setModalUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
