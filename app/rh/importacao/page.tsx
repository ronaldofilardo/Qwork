'use client';

import { useState, useCallback, useRef } from 'react';
import { FileSpreadsheet, ArrowLeft, BookmarkPlus } from 'lucide-react';
import Link from 'next/link';
import UploadArea from '@/components/importacao/UploadArea';
import ColumnMapper from '@/components/importacao/ColumnMapper';
import DataPreview from '@/components/importacao/DataPreview';
import ImportResult from '@/components/importacao/ImportResult';
import NivelCargoModal, {
  type NivelCargo,
} from '@/components/importacao/NivelCargoModal';
import {
  TemplatePicker,
  SaveTemplateForm,
  type ImportTemplate,
  updateTemplateNivelCargo,
} from '@/components/importacao/TemplateManager';

type Step = 'upload' | 'mapeamento' | 'validacao' | 'resultado';

interface AnalyzeData {
  totalLinhas: number;
  colunasDetectadas: Array<{
    indice: number;
    nomeOriginal: string;
    sugestaoQWork: string | null;
    confianca: number;
    exemploDados: string[];
  }>;
  camposQWork: Array<{ campo: string; label: string; obrigatorio: boolean }>;
  camposObrigatorios: string[];
  camposObrigatoriosFaltando: string[];
}

interface ValidateData {
  valido: boolean;
  resumo: {
    totalLinhas: number;
    linhasValidas: number;
    linhasComErros: number;
    linhasComAvisos: number;
    cpfsUnicos: number;
    empresasNovas: number;
    empresasExistentes: number;
    funcionariosExistentes: number;
    funcionariosNovos: number;
    funcionariosParaInativar: number;
    funcionariosJaInativos: number;
    funcionariosAReadmitir: number;
  };
  funcoesUnicas: string[];
  erros: Array<{
    linha: number;
    campo: string;
    mensagem: string;
    severidade: string;
    valor?: string;
  }>;
  avisos: Array<{
    linha: number;
    campo: string;
    mensagem: string;
    severidade: string;
    valor?: string;
  }>;
}

interface ExecuteData {
  resumo: {
    totalLinhasProcessadas: number;
    totalLinhasComErroFormato: number;
    empresasCriadas: number;
    empresasExistentes: number;
    funcionariosCriados: number;
    funcionariosAtualizados: number;
    vinculosCriados: number;
    vinculosAtualizados: number;
    inativacoesRealizadas: number;
  };
  erros: Array<{ linha?: number; campo?: string; mensagem: string }>;
  avisos: Array<{ linha?: number; campo?: string; mensagem: string }>;
}

type Mapeamento = Array<{
  indice: number;
  nomeOriginal: string;
  campoQWork: string;
}>;

const stepLabels: Record<Step, string> = {
  upload: '1. Upload',
  mapeamento: '2. Mapeamento',
  validacao: '3. Validação',
  resultado: '4. Resultado',
};

const stepOrder: Step[] = ['upload', 'mapeamento', 'validacao', 'resultado'];

export default function ImportacaoPage() {
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<File | null>(null);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeData | null>(null);
  const [mapeamento, setMapeamento] = useState<Mapeamento | null>(null);
  const [validateData, setValidateData] = useState<ValidateData | null>(null);
  const [executeData, setExecuteData] = useState<ExecuteData | null>(null);
  const [tempoMs, setTempoMs] = useState(0);

  // Template state
  const [templateMapeamento, setTemplateMapeamento] = useState<Array<{
    nomeOriginal: string;
    campoQWork: string;
  }> | null>(null);
  const [columnMapperKey, setColumnMapperKey] = useState(0);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<ImportTemplate | null>(
    null
  );
  const [lastSavedTemplateId, setLastSavedTemplateId] = useState<string | null>(
    null
  );

  // NivelCargo modal state
  const [showNivelCargoModal, setShowNivelCargoModal] = useState(false);
  const [nivelCargoMap, setNivelCargoMap] = useState<Record<
    string,
    NivelCargo
  > | null>(null);
  // Novas funções não classificadas no template (para exibir no modal filtrado)
  const [novasFuncoes, setNovasFuncoes] = useState<string[]>([]);
  const [pendingNivelMap, setPendingNivelMap] = useState<Record<
    string,
    NivelCargo
  > | null>(null);
  const [showUpdateTemplatePrompt, setShowUpdateTemplatePrompt] =
    useState(false);

  // Step 1: Upload + Analyze
  const handleFileSelect = useCallback(async (file: File) => {
    fileRef.current = file;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/rh/importacao/analyze', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Erro ao analisar arquivo');
        return;
      }

      setAnalyzeData(json.data);
      setStep('mapeamento');
    } catch {
      setError('Erro de conexão ao analisar arquivo');
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 2: Confirm mapping + Validate
  const handleMapeamentoConfirm = useCallback(async (map: Mapeamento) => {
    const file = fileRef.current;
    if (!file) return;

    setMapeamento(map);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapeamento', JSON.stringify(map));

      const res = await fetch('/api/rh/importacao/validate', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Erro ao validar dados');
        return;
      }

      setValidateData(json.data);
      setShowSaveTemplate(true);
      setStep('validacao');
    } catch {
      setError('Erro de conexão ao validar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 3: Execute Import
  const handleExecute = useCallback(
    async (nivelMap: Record<string, NivelCargo> | null) => {
      const file = fileRef.current;
      if (!file || !mapeamento) return;

      setShowNivelCargoModal(false);
      setError(null);
      setLoading(true);
      const start = Date.now();

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mapeamento', JSON.stringify(mapeamento));
        if (nivelMap) {
          formData.append('nivelCargoMap', JSON.stringify(nivelMap));
        }

        const res = await fetch('/api/rh/importacao/execute', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        setTempoMs(Date.now() - start);

        if (!res.ok || !json.success) {
          setError(json.error ?? 'Erro ao executar importação');
          return;
        }

        setExecuteData(json.data);
        setStep('resultado');
      } catch {
        setTempoMs(Date.now() - start);
        setError('Erro de conexão ao executar importação');
      } finally {
        setLoading(false);
      }
    },
    [mapeamento]
  );

  // Step 3a: Pré-execute — filtra funções já classificadas no template
  const handlePreExecute = useCallback(() => {
    const funcoes = validateData?.funcoesUnicas ?? [];
    const templateMap = (appliedTemplate?.nivelCargoMap ?? {}) as Record<
      string,
      NivelCargo
    >;

    // Funções que não estão classificadas no template aplicado
    const novasParaClassificar = funcoes.filter((f) => !templateMap[f]);

    if (novasParaClassificar.length > 0 && nivelCargoMap === null) {
      setNovasFuncoes(novasParaClassificar);
      setShowNivelCargoModal(true);
    } else {
      // Todas já classificadas pelo template (ou sem funções)
      const finalMap: Record<string, NivelCargo> = {
        ...templateMap,
        ...(nivelCargoMap ?? {}),
      };
      void handleExecute(Object.keys(finalMap).length > 0 ? finalMap : null);
    }
  }, [validateData, appliedTemplate, nivelCargoMap, handleExecute]);

  // Reset
  const handleNovaImportacao = useCallback(() => {
    fileRef.current = null;
    setAnalyzeData(null);
    setMapeamento(null);
    setValidateData(null);
    setExecuteData(null);
    setError(null);
    setTempoMs(0);
    setTemplateMapeamento(null);

    setShowSaveTemplate(false);
    setNivelCargoMap(null);
    setShowNivelCargoModal(false);
    setAppliedTemplate(null);
    setLastSavedTemplateId(null);
    setNovasFuncoes([]);
    setPendingNivelMap(null);
    setShowUpdateTemplatePrompt(false);
    setStep('upload');
  }, []);

  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rh" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <FileSpreadsheet size={24} className="text-primary-600" />
        <h1 className="text-xl font-bold text-gray-900">Importação em Massa</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                i < currentStepIndex
                  ? 'bg-green-100 text-green-700'
                  : i === currentStepIndex
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stepLabels[s]}
            </div>
            {i < stepOrder.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-green-300' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step Content */}
      {step === 'upload' && (
        <UploadArea onFileSelect={handleFileSelect} isLoading={loading} />
      )}

      {step === 'mapeamento' && analyzeData && (
        <>
          <TemplatePicker
            onApply={(template) => {
              setAppliedTemplate(template);
              setTemplateMapeamento(template.mapeamentos);
              setColumnMapperKey((k) => k + 1);
            }}
          />
          <ColumnMapper
            key={columnMapperKey}
            sugestoes={analyzeData.colunasDetectadas}
            camposQWork={analyzeData.camposQWork}
            camposObrigatorios={analyzeData.camposObrigatorios}
            initialTemplateMapeamento={templateMapeamento ?? undefined}
            onConfirm={handleMapeamentoConfirm}
            onBack={() => {
              setStep('upload');
              setError(null);
            }}
            isLoading={loading}
          />
        </>
      )}

      {step === 'validacao' && validateData && (
        <>
          {/* Salvar template: apenas na primeira importação (sem template aplicado) */}
          {showSaveTemplate && mapeamento && !appliedTemplate && (
            <SaveTemplateForm
              mapeamentos={mapeamento.map((m) => ({
                nomeOriginal: m.nomeOriginal,
                campoQWork: m.campoQWork,
              }))}
              nivelCargoMap={nivelCargoMap ?? undefined}
              onSaved={(id) => {
                setLastSavedTemplateId(id);
                setShowSaveTemplate(false);
              }}
              onSkip={() => {
                setLastSavedTemplateId(null);
                setShowSaveTemplate(false);
              }}
            />
          )}
          {/* Prompt de atualização do template com novos cargos */}
          {showUpdateTemplatePrompt && pendingNivelMap && appliedTemplate && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <BookmarkPlus
                  size={16}
                  className="flex-shrink-0 text-emerald-600"
                />
                <span>
                  Salvar{' '}
                  <strong>
                    {novasFuncoes.length} novo
                    {novasFuncoes.length > 1 ? 's cargo' : ' cargo'}
                  </strong>{' '}
                  no template{' '}
                  <strong>&ldquo;{appliedTemplate.nome}&rdquo;</strong>?
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    updateTemplateNivelCargo(
                      appliedTemplate.id,
                      pendingNivelMap
                    );
                    setShowUpdateTemplatePrompt(false);
                    void handleExecute(pendingNivelMap);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                >
                  Salvar e importar
                </button>
                <button
                  onClick={() => {
                    setShowUpdateTemplatePrompt(false);
                    void handleExecute(pendingNivelMap);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 rounded hover:bg-emerald-50"
                >
                  Só importar
                </button>
              </div>
            </div>
          )}
          <DataPreview
            validacao={{
              totalLinhas: validateData.resumo.totalLinhas,
              linhasValidas: validateData.resumo.linhasValidas,
              linhasComErro: validateData.resumo.linhasComErros,
              linhasComAviso: validateData.resumo.linhasComAvisos,
              erros: validateData.erros,
              avisos: validateData.avisos,
            }}
            dbStats={{
              empresasNovas: validateData.resumo.empresasNovas,
              empresasExistentes: validateData.resumo.empresasExistentes,
              funcionariosExistentes:
                validateData.resumo.funcionariosExistentes,
              funcionariosNovos: validateData.resumo.funcionariosNovos,
              funcionariosParaInativar:
                validateData.resumo.funcionariosParaInativar,
              funcionariosJaInativos:
                validateData.resumo.funcionariosJaInativos,
              funcionariosAReadmitir:
                validateData.resumo.funcionariosAReadmitir ?? 0,
            }}
            onConfirm={handlePreExecute}
            onBack={() => {
              setStep('mapeamento');
              setError(null);
            }}
            isLoading={loading}
          />
          {showNivelCargoModal && (
            <NivelCargoModal
              funcoes={
                novasFuncoes.length > 0
                  ? novasFuncoes
                  : (validateData.funcoesUnicas ?? [])
              }
              initialMap={undefined}
              onConfirm={(mapa) => {
                const templateMap = (appliedTemplate?.nivelCargoMap ??
                  {}) as Record<string, NivelCargo>;
                const mergedMap: Record<string, NivelCargo> = {
                  ...templateMap,
                  ...mapa,
                };
                setNivelCargoMap(mergedMap);
                setShowNivelCargoModal(false);

                if (appliedTemplate && novasFuncoes.length > 0) {
                  // Template aplicado + novos cargos — perguntar se atualiza
                  setPendingNivelMap(mergedMap);
                  setShowUpdateTemplatePrompt(true);
                } else {
                  // Sem template — se salvou template nesta sessão, atualiza com os cargos
                  if (lastSavedTemplateId) {
                    updateTemplateNivelCargo(lastSavedTemplateId, mapa);
                  }
                  void handleExecute(mergedMap);
                }
              }}
              onSkip={() => {
                setShowNivelCargoModal(false);
                const templateMap = (appliedTemplate?.nivelCargoMap ??
                  {}) as Record<string, NivelCargo>;
                const finalMap =
                  Object.keys(templateMap).length > 0 ? templateMap : null;
                setNivelCargoMap(finalMap ?? {});
                void handleExecute(finalMap);
              }}
            />
          )}
        </>
      )}

      {step === 'resultado' && executeData && (
        <ImportResult
          sucesso={executeData.erros.length === 0}
          stats={{
            empresas_criadas: executeData.resumo.empresasCriadas,
            empresas_existentes: executeData.resumo.empresasExistentes,
            funcionarios_criados: executeData.resumo.funcionariosCriados,
            funcionarios_atualizados:
              executeData.resumo.funcionariosAtualizados,
            vinculos_criados: executeData.resumo.vinculosCriados,
            vinculos_atualizados: executeData.resumo.vinculosAtualizados,
            inativacoes: executeData.resumo.inativacoesRealizadas,
            total_erros: executeData.erros.length,
          }}
          erros={executeData.erros.map((e) => ({
            linha: e.linha,
            mensagem: e.mensagem,
          }))}
          tempoMs={tempoMs}
          totalLinhas={executeData.resumo.totalLinhasProcessadas}
          onNovaImportacao={handleNovaImportacao}
        />
      )}
    </div>
  );
}
