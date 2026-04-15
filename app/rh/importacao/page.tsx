'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import UploadArea from '@/components/importacao/UploadArea';
import ImportacaoFlowGuide from '@/components/ImportacaoFlowGuide';
import ColumnMapper from '@/components/importacao/ColumnMapper';
import DataPreview from '@/components/importacao/DataPreview';
import ImportResult from '@/components/importacao/ImportResult';
import NivelCargoStep, {
  type NivelCargo,
  type FuncaoNivelInfo,
} from '@/components/importacao/NivelCargoStep';
import ImportProgressModal from '@/components/importacao/ImportProgressModal';
import {
  TemplatePicker,
  SaveTemplateForm,
  type ImportTemplate,
  updateTemplateNivelCargo,
} from '@/components/importacao/TemplateManager';

type Step = 'upload' | 'mapeamento' | 'validacao' | 'nivel-cargo' | 'resultado';

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
  funcoesComMudancaRole?: string[];
  funcoesNivelInfo: FuncaoNivelInfo[];
  temNivelCargoDirecto: boolean;
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

interface FuncaoAlterada {
  nome: string;
  funcaoAnterior: string | null;
  funcaoNova: string;
}

interface ExecuteData {
  resumo: {
    totalLinhasProcessadas: number;
    totalLinhasComErroFormato: number;
    empresasCriadas: number;
    empresasExistentes: number;
    funcionariosCriados: number;
    funcionariosAtualizados: number;
    nivelCargoAlterados: number;
    funcoesAlteradas?: FuncaoAlterada[];
    vinculosCriados: number;
    vinculosAtualizados: number;
    inativacoesRealizadas: number;
    empresasBloqueadas: number;
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
  'nivel-cargo': '4. Níveis',
  resultado: '5. Resultado',
};

const stepOrder: Step[] = [
  'upload',
  'mapeamento',
  'validacao',
  'nivel-cargo',
  'resultado',
];

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

  // Mapa de nível de cargo: controlado pela etapa dedicada de classificação
  const [nivelCargoMap, setNivelCargoMap] = useState<
    Record<string, NivelCargo>
  >({});

  // Modal de progresso de importação
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [importConcluido, setImportConcluido] = useState(false);

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
      setNivelCargoMap({}); // Reset classificação para a etapa de níveis
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

      setError(null);
      setLoading(true);
      setShowProgressModal(true);
      setImportConcluido(false);
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
        setImportConcluido(true);
        // O modal fecha sozinho após animar para 100% e chama onClose que avança o step
      } catch {
        setTempoMs(Date.now() - start);
        setError('Erro de conexão ao executar importação');
        setShowProgressModal(false);
      } finally {
        setLoading(false);
      }
    },
    [mapeamento]
  );

  // Step 3.5: Auto-popula nivelCargoMap ao entrar na etapa de classificação
  // 1. Valores do template aplicado  2. Sugestões: funções onde todos existentes têm o mesmo nível único
  useEffect(() => {
    if (step !== 'nivel-cargo' || !validateData?.funcoesNivelInfo) return;
    const templateMap = (appliedTemplate?.nivelCargoMap ?? {}) as Record<
      string,
      NivelCargo
    >;
    const autoMap: Record<string, NivelCargo> = { ...templateMap };
    for (const info of validateData.funcoesNivelInfo) {
      if (autoMap[info.funcao]) continue; // já classificado pelo template
      // Mudanças de função NUNCA são auto-preenchidas: o usuário DEVE confirmar
      // explicitamente o nível do novo cargo. O nível anterior não representa o novo.
      if (info.isMudancaRole) continue;
      // Mudanças de nivel_cargo da planilha tb precisam de confirmação explícita
      if (info.isMudancaNivel) continue;
      const niveisValidos = info.niveisAtuais.filter(
        (n): n is 'gestao' | 'operacional' => n !== null
      );
      // Sugere apenas quando há exatamente 1 nível distinto e nenhum null entre os existentes
      if (niveisValidos.length === 1 && !info.niveisAtuais.includes(null)) {
        autoMap[info.funcao] = niveisValidos[0];
      }
    }
    setNivelCargoMap(autoMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]); // Intencionalmente: executa apenas ao entrar no step de níveis

  // Step 3.5: Confirmar classificação de nível e executar importação
  const handleNivelCargoConfirm = useCallback(() => {
    // Auto-atualiza template com funções recém-classificadas (silenciosamente)
    const templateId = appliedTemplate?.id ?? lastSavedTemplateId;
    if (templateId) {
      const templateMap = (appliedTemplate?.nivelCargoMap ?? {}) as Record<
        string,
        NivelCargo
      >;
      const novas: Record<string, string> = {};
      for (const [f, nivel] of Object.entries(nivelCargoMap)) {
        if (nivel && !templateMap[f]) novas[f] = nivel;
      }
      if (Object.keys(novas).length > 0) {
        updateTemplateNivelCargo(
          '/api/rh/importacao/templates',
          templateId,
          novas
        );
      }
    }
    void handleExecute(
      Object.keys(nivelCargoMap).length > 0 ? nivelCargoMap : null
    );
  }, [appliedTemplate, lastSavedTemplateId, nivelCargoMap, handleExecute]);

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
    setNivelCargoMap({});
    setAppliedTemplate(null);
    setLastSavedTemplateId(null);
    setShowProgressModal(false);
    setImportConcluido(false);
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

      {/* Guia do fluxo de importação */}
      <ImportacaoFlowGuide isClinica={true} />

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
        <>
          <UploadArea onFileSelect={handleFileSelect} isLoading={loading} />
          {loading && (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full w-full" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Analisando arquivo... isso pode levar alguns segundos para
                planilhas grandes.
              </p>
            </div>
          )}
        </>
      )}

      {step === 'mapeamento' && analyzeData && (
        <>
          <TemplatePicker
            apiBase="/api/rh/importacao/templates"
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
            <>
              <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                💡 <strong>Template:</strong> salva o mapeamento de colunas
                desta planilha para reutilizar em importações futuras com o
                mesmo formato de colunas.
              </div>
              <SaveTemplateForm
                apiBase="/api/rh/importacao/templates"
                mapeamentos={mapeamento.map((m) => ({
                  nomeOriginal: m.nomeOriginal,
                  campoQWork: m.campoQWork,
                }))}
                nivelCargoMap={
                  Object.keys(nivelCargoMap).length > 0
                    ? nivelCargoMap
                    : undefined
                }
                onSaved={(id) => {
                  setLastSavedTemplateId(id);
                  setShowSaveTemplate(false);
                }}
                onSkip={() => {
                  setLastSavedTemplateId(null);
                  setShowSaveTemplate(false);
                }}
              />
            </>
          )}
          {/* Prompt de atualização do template removido: as classificações novas são salvas
               automaticamente em handleNivelCargoConfirm após a etapa dedicada de níveis. */}
          <DataPreview
            validacao={{
              totalLinhas: validateData.resumo.totalLinhas,
              linhasValidas: validateData.resumo.linhasValidas,
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
            funcoesComMudancaRole={validateData.funcoesComMudancaRole}
            onConfirm={() => setStep('nivel-cargo')}
            onBack={() => {
              setStep('mapeamento');
              setError(null);
            }}
            isLoading={loading}
          />
        </>
      )}

      {step === 'nivel-cargo' && validateData && (
        <NivelCargoStep
          funcoesNivelInfo={validateData.funcoesNivelInfo ?? []}
          nivelCargoMap={nivelCargoMap}
          onChange={(funcao, nivel) =>
            setNivelCargoMap((prev) => ({ ...prev, [funcao]: nivel }))
          }
          onConfirm={handleNivelCargoConfirm}
          onBack={() => {
            setStep('validacao');
            setError(null);
          }}
          temNivelCargoDirecto={validateData.temNivelCargoDirecto ?? false}
          isLoading={loading}
        />
      )}

      {step === 'resultado' && executeData && (
        <ImportResult
          sucesso={
            executeData.erros.length === 0 &&
            executeData.resumo.empresasBloqueadas === 0
          }
          stats={{
            empresas_criadas: executeData.resumo.empresasCriadas,
            empresas_existentes: executeData.resumo.empresasExistentes,
            empresas_bloqueadas: executeData.resumo.empresasBloqueadas,
            funcionarios_criados: executeData.resumo.funcionariosCriados,
            funcionarios_atualizados:
              executeData.resumo.funcionariosAtualizados,
            nivel_cargo_alterados: executeData.resumo.nivelCargoAlterados,
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
          funcoesAlteradas={executeData.resumo.funcoesAlteradas ?? []}
          onNovaImportacao={handleNovaImportacao}
        />
      )}

      {/* Modal de progresso — exibido durante execução da importação */}
      {showProgressModal && (
        <ImportProgressModal
          totalLinhas={validateData?.resumo.linhasValidas ?? 0}
          concluido={importConcluido}
          onClose={() => {
            setShowProgressModal(false);
            setImportConcluido(false);
            if (executeData) setStep('resultado');
          }}
        />
      )}
    </div>
  );
}
