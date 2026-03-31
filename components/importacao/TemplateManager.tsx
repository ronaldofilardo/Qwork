'use client';

import { useState, useCallback } from 'react';
import {
  BookmarkPlus,
  Bookmark,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ImportTemplate {
  id: string;
  nome: string;
  criadoEm: string;
  mapeamentos: Array<{ nomeOriginal: string; campoQWork: string }>;
  nivelCargoMap?: Record<string, string>;
}

const STORAGE_KEY = 'qwork-importacao-templates';

export function loadTemplates(): ImportTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveTemplate(template: ImportTemplate): void {
  const all = loadTemplates().filter((t) => t.id !== template.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([template, ...all]));
}

export function deleteTemplate(id: string): void {
  const all = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Mescla novas classificações de cargo em um template já existente */
export function updateTemplateNivelCargo(
  id: string,
  additionalMap: Record<string, string>
): void {
  const all = loadTemplates().map((t) =>
    t.id === id
      ? {
          ...t,
          nivelCargoMap: { ...(t.nivelCargoMap ?? {}), ...additionalMap },
        }
      : t
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// -------- Componente para salvar template após confirmar mapeamento --------
interface SaveTemplateFormProps {
  mapeamentos: Array<{ nomeOriginal: string; campoQWork: string }>;
  nivelCargoMap?: Record<string, string>;
  onSaved: (id: string) => void;
  onSkip: () => void;
}

export function SaveTemplateForm({
  mapeamentos,
  nivelCargoMap,
  onSaved,
  onSkip,
}: SaveTemplateFormProps) {
  const [nome, setNome] = useState('');

  const handleSave = useCallback(() => {
    const trimmed = nome.trim();
    if (!trimmed) return;
    const id = Date.now().toString();
    saveTemplate({
      id,
      nome: trimmed,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      mapeamentos,
      nivelCargoMap,
    });
    onSaved(id);
  }, [nome, mapeamentos, nivelCargoMap, onSaved]);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
      <BookmarkPlus size={18} className="text-amber-600 flex-shrink-0" />
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm text-amber-800 font-medium whitespace-nowrap">
          Salvar como template:
        </span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Nome do template..."
          maxLength={60}
          className="flex-1 text-sm border border-amber-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
        />
        <button
          onClick={handleSave}
          disabled={!nome.trim()}
          className="px-3 py-1 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Não salvar
        </button>
      </div>
    </div>
  );
}

// -------- Componente para listar e aplicar templates --------
interface TemplatePickerProps {
  onApply: (template: ImportTemplate) => void;
}

export function TemplatePicker({ onApply }: TemplatePickerProps) {
  // Carrega diretamente no inicializador — client-only, sem flash de null
  const [templates, setTemplates] = useState<ImportTemplate[]>(() =>
    loadTemplates()
  );
  const [open, setOpen] = useState(false);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTemplate(id);
    setTemplates(loadTemplates());
  }, []);

  const hasTemplates = templates.length > 0;

  return (
    <div
      className={`mb-4 rounded-lg border-2 transition-colors ${hasTemplates ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-white'}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${hasTemplates ? 'text-primary hover:bg-primary/10' : 'text-gray-400 hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-2">
          <Bookmark
            size={16}
            className={
              hasTemplates ? 'text-primary fill-primary/20' : 'text-gray-400'
            }
          />
          <span>
            {hasTemplates
              ? `⚡ Usar template de mapeamento (${templates.length} disponível${templates.length > 1 ? 'eis' : ''})`
              : 'Nenhum template salvo'}
          </span>
          {hasTemplates && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold leading-none">
              {templates.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp
            size={15}
            className={hasTemplates ? 'text-primary' : 'text-gray-400'}
          />
        ) : (
          <ChevronDown
            size={15}
            className={hasTemplates ? 'text-primary' : 'text-gray-400'}
          />
        )}
      </button>

      {open && (
        <div
          className={`border-t ${hasTemplates ? 'border-primary/20' : 'border-gray-200'}`}
        >
          {!hasTemplates ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Nenhum template salvo ainda. Após concluir um mapeamento, você
              poderá salvá-lo como template para reutilizar.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 cursor-pointer"
                  onClick={() => {
                    onApply(t);
                    setOpen(false);
                  }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {t.nome}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.mapeamentos.length} colunas · {t.criadoEm}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(t.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Excluir template"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
