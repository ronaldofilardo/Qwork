'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users2,
  UserPlus,
  ChevronRight,
  TrendingUp,
  X,
  Pencil,
  Loader2,
  AlertCircle,
  UserX,
  TriangleAlert,
  UserCheck,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from 'lucide-react';
import CadastrarVendedorModal, {
  CodigoVendedorSucesso,
} from './CadastrarVendedorModal';

interface Vendedor {
  vinculo_id: number;
  vendedor_id: number;
  vendedor_perfil_id: number | null;
  vendedor_nome: string;
  vendedor_email: string;
  vendedor_cpf: string;
  aceite_termos: boolean | null;
  leads_ativos: number;
  vinculado_em: string;
}

interface ReenvioEstado {
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Card do Vendedor
// ---------------------------------------------------------------------------

function VendedorCard({
  v,
  onClick,
  reenvioEstado,
  onReenviar,
}: {
  v: Vendedor;
  onClick: () => void;
  reenvioEstado?: ReenvioEstado;
  onReenviar?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-150 p-5 group">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
          {v.vendedor_nome
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {v.vendedor_nome}
            </p>
            <button
              onClick={onClick}
              className="p-1 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
              title="Editar dados do vendedor"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {v.vendedor_email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {v.vendedor_email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        {/* Vendedor ID */}
        <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
          #{v.vendedor_id}
        </code>
        {/* Leads */}
        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
          <TrendingUp size={12} />
          <span>
            {v.leads_ativos} lead{v.leads_ativos !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Reenviar convite — apenas para vendedores sem onboarding concluído */}
      {!v.aceite_termos && v.vendedor_perfil_id && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onReenviar}
            disabled={reenvioEstado?.loading}
            className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer w-full justify-center"
          >
            {reenvioEstado?.loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCcw size={12} />
            )}
            Reenviar Convite
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer de edicao do vendedor
// ---------------------------------------------------------------------------

interface EditarForm {
  nome: string;
  email: string;
  sexo: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface VendedorCompleto {
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_email: string;
  vendedor_cpf: string;
  sexo: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  tipo_pessoa: string | null;
  cnpj: string | null;
  razao_social: string | null;
  doc_cad_path: string | null;
  doc_nf_path: string | null;
}

function EditarVendedorDrawer({
  vendedor,
  onClose,
  onUpdated,
}: {
  vendedor: Vendedor | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState<EditarForm>({
    nome: '',
    email: '',
    sexo: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showInativar, setShowInativar] = useState(false);
  const [motivoInativar, setMotivoInativar] = useState('');
  const [inativando, setInativando] = useState(false);
  const [erroInativar, setErroInativar] = useState<string | null>(null);

  // Documentos
  const [dadosCompletos, setDadosCompletos] = useState<VendedorCompleto | null>(
    null
  );
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docErro, setDocErro] = useState<string | null>(null);

  const handleInativar = async () => {
    if (!vendedor) return;
    setInativando(true);
    setErroInativar(null);
    try {
      const res = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}/inativar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivoInativar.trim() }),
        }
      );
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        detail?: string;
      };
      if (!res.ok) {
        if (d.code === 'COMISSOES_PENDENTES') {
          setErroInativar(
            d.detail ?? d.error ?? 'Existem comissões pendentes.'
          );
        } else {
          setErroInativar(d.error ?? 'Erro ao inativar');
        }
        return;
      }
      setShowInativar(false);
      setMotivoInativar('');
      onUpdated();
      onClose();
    } catch {
      setErroInativar('Erro ao processar inativação');
    } finally {
      setInativando(false);
    }
  };

  useEffect(() => {
    if (!vendedor) return;
    setErro(null);
    setDocErro(null);
    setShowInativar(false);
    setMotivoInativar('');
    setCarregando(true);
    setDadosCompletos(null);
    // Buscar dados completos do vendedor (inclui perfil: sexo, endereco, cidade, estado, cep, docs)
    fetch(`/api/representante/equipe/vendedores/${vendedor.vendedor_id}`)
      .then(
        (res) =>
          res.json() as Promise<{ vendedor?: VendedorCompleto; error?: string }>
      )
      .then((d) => {
        const v = d.vendedor;
        setDadosCompletos(v ?? null);
        setForm({
          nome: v?.vendedor_nome ?? vendedor.vendedor_nome ?? '',
          email: v?.vendedor_email ?? vendedor.vendedor_email ?? '',
          sexo: v?.sexo ?? '',
          endereco: v?.endereco ?? '',
          cidade: v?.cidade ?? '',
          estado: v?.estado ?? '',
          cep: v?.cep ?? '',
        });
      })
      .catch(() => {
        // fallback: usa dados já disponíveis na listagem
        setForm({
          nome: vendedor.vendedor_nome ?? '',
          email: vendedor.vendedor_email ?? '',
          sexo: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
        });
      })
      .finally(() => setCarregando(false));
  }, [vendedor]);

  const salvar = async () => {
    if (!vendedor) return;
    setSalvando(true);
    setErro(null);
    try {
      const body: Record<string, string> = {};
      if (form.nome.trim()) body.nome = form.nome.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.sexo) body.sexo = form.sexo;
      if (form.endereco.trim()) body.endereco = form.endereco.trim();
      if (form.cidade.trim()) body.cidade = form.cidade.trim();
      if (form.estado.trim()) body.estado = form.estado.trim();
      if (form.cep.trim()) body.cep = form.cep.trim();

      const res = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const isOpen = vendedor !== null;

  const handleDocUpload = async (
    tipo: 'cad' | 'nf',
    file: File
  ): Promise<void> => {
    if (!vendedor) return;
    setUploadingDoc(tipo);
    setDocErro(null);
    try {
      const fd = new FormData();
      fd.append('tipo', tipo);
      fd.append('arquivo', file);
      const res = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}/documentos`,
        { method: 'POST', body: fd }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setDocErro(d.error ?? 'Erro ao enviar documento.');
        return;
      }
      // Recarregar dados
      const reloadRes = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}`
      );
      if (reloadRes.ok) {
        const d = (await reloadRes.json()) as { vendedor?: VendedorCompleto };
        if (d.vendedor) setDadosCompletos(d.vendedor);
      }
    } catch {
      setDocErro('Erro de conexão ao enviar documento.');
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {vendedor?.vendedor_nome
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {vendedor?.vendedor_nome}
              </p>
              <p className="text-xs text-gray-400">Editar dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {carregando ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Info imutavel */}
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">
                  Dados imutaveis (apenas suporte pode alterar):
                </p>
                <p>
                  CPF:{' '}
                  <span className="font-mono">
                    {vendedor?.vendedor_cpf ?? '-'}
                  </span>
                </p>
                <p>
                  ID Vendedor:{' '}
                  <span className="font-mono">
                    #{vendedor?.vendedor_id ?? '-'}
                  </span>
                </p>
                <p className="mt-1 text-blue-500">
                  Dados bancarios so podem ser editados pelo suporte.
                </p>
              </div>

              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" />
                  {erro}
                </div>
              )}

              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome completo', type: 'text' },
                  { key: 'email', label: 'E-mail', type: 'email' },
                  { key: 'endereco', label: 'Endereco', type: 'text' },
                  { key: 'cidade', label: 'Cidade', type: 'text' },
                  { key: 'cep', label: 'CEP', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={form[key as keyof EditarForm]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={form.estado}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estado: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Sexo
                  </label>
                  <select
                    value={form.sexo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sexo: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    <option value="">Nao informado</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Seção de Documentos */}
              {dadosCompletos && (
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" /> Documentos
                    {dadosCompletos.tipo_pessoa === 'pj' && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                        PJ
                      </span>
                    )}
                  </p>

                  {dadosCompletos.tipo_pessoa === 'pj' &&
                    dadosCompletos.cnpj && (
                      <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
                        <span className="font-semibold">CNPJ:</span>{' '}
                        <span className="font-mono">{dadosCompletos.cnpj}</span>
                        {dadosCompletos.razao_social && (
                          <> — {dadosCompletos.razao_social}</>
                        )}
                      </div>
                    )}

                  {docErro && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                      <AlertCircle size={13} className="shrink-0" />
                      {docErro}
                    </div>
                  )}

                  {/* Doc Cadastro (CPF ou CNPJ) */}
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {dadosCompletos.doc_cad_path ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-600 shrink-0"
                        />
                      ) : (
                        <XCircle size={16} className="text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700">
                          {dadosCompletos.tipo_pessoa === 'pj'
                            ? 'Doc. CNPJ'
                            : 'Doc. CPF'}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {dadosCompletos.doc_cad_path ? 'Enviado' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dadosCompletos.doc_cad_path && (
                        <a
                          href={`/api/representante/equipe/vendedores/${vendedor?.vendedor_id}/documentos/visualizar?tipo=cad`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <FileText size={12} /> Ver
                        </a>
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={uploadingDoc !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleDocUpload('cad', f);
                            e.target.value = '';
                          }}
                        />
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            uploadingDoc === 'cad'
                              ? 'bg-gray-100 text-gray-400 border-gray-200'
                              : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {uploadingDoc === 'cad' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          {dadosCompletos.doc_cad_path ? 'Reenviar' : 'Enviar'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Doc NF */}
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {dadosCompletos.doc_nf_path ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-600 shrink-0"
                        />
                      ) : (
                        <XCircle size={16} className="text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700">
                          Doc. NF
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {dadosCompletos.doc_nf_path ? 'Enviado' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dadosCompletos.doc_nf_path && (
                        <a
                          href={`/api/representante/equipe/vendedores/${vendedor?.vendedor_id}/documentos/visualizar?tipo=nf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <FileText size={12} /> Ver
                        </a>
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={uploadingDoc !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleDocUpload('nf', f);
                            e.target.value = '';
                          }}
                        />
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            uploadingDoc === 'nf'
                              ? 'bg-gray-100 text-gray-400 border-gray-200'
                              : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {uploadingDoc === 'nf' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          {dadosCompletos.doc_nf_path ? 'Reenviar' : 'Enviar'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Máx. 3MB por arquivo. PDF, JPG, PNG.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t shrink-0 space-y-3">
          {/* Botão inativar — abre confirmação inline */}
          {!showInativar ? (
            <button
              onClick={() => {
                setShowInativar(true);
                setErroInativar(null);
              }}
              disabled={salvando}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <UserX size={14} />
              Inativar Vendedor
            </button>
          ) : (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
              <div className="flex items-start gap-2">
                <TriangleAlert
                  size={16}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-700 font-medium">
                  Esta ação inativa o vendedor e encerra o vínculo. Só é
                  permitida se não houver comissões pendentes.
                </p>
              </div>
              <textarea
                value={motivoInativar}
                onChange={(e) => setMotivoInativar(e.target.value)}
                placeholder="Motivo da inativação (mínimo 5 caracteres)..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
              />
              {erroInativar && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {erroInativar}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowInativar(false);
                    setMotivoInativar('');
                    setErroInativar(null);
                  }}
                  disabled={inativando}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-white text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInativar}
                  disabled={inativando || motivoInativar.trim().length < 5}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inativando ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <UserX size={13} />
                  )}
                  {inativando ? 'Inativando...' : 'Confirmar Inativação'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={salvando}
              className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Pencil size={14} />
              )}
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Card de vendedor inativo (com botao reativar)
// ---------------------------------------------------------------------------

function VendedorInativoCard({
  v,
  onReativar,
}: {
  v: Vendedor;
  onReativar: (v: Vendedor) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 opacity-70 p-5">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-base flex-shrink-0">
          {v.vendedor_nome
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-500 text-sm truncate">
            {v.vendedor_nome}
          </p>
          {v.vendedor_email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {v.vendedor_email}
            </p>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
          Inativo
        </span>
      </div>
      <div className="mt-4">
        <button
          onClick={() => onReativar(v)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
        >
          <UserCheck size={14} />
          Reativar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de confirmação de reativação
// ---------------------------------------------------------------------------

function ReativarVendedorModal({
  vendedor,
  onClose,
  onSuccess,
}: {
  vendedor: Vendedor | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!vendedor) {
      setMotivo('');
      setErro(null);
    }
  }, [vendedor]);

  if (!vendedor) return null;

  const confirmar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}/reativar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivo.trim() }),
        }
      );
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(d.error ?? 'Erro ao reativar');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setErro('Erro ao processar reativação');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Reativar Vendedor
              </p>
              <p className="text-xs text-gray-500">{vendedor.vendedor_nome}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            O vendedor terá acesso restabelecido e o vínculo será reativado.
          </p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Motivo da reativação (mínimo 5 caracteres)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Retorno após licença..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={13} className="shrink-0" />
              {erro}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={salvando}
              className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={salvando || motivo.trim().length < 5}
              className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserCheck size={14} />
              )}
              {salvando ? 'Reativando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pagina principal
// ---------------------------------------------------------------------------

type Aba = 'ativos' | 'inativos';

export default function EquipePage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresInativos, setVendedoresInativos] = useState<Vendedor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalInativos, setTotalInativos] = useState(0);
  const [aba, setAba] = useState<Aba>('ativos');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState<{
    codigo: string;
    nome: string;
    conviteUrl?: string;
  } | null>(null);
  const [editarVendedor, setEditarVendedor] = useState<Vendedor | null>(null);
  const [reativarVendedor, setReativarVendedor] = useState<Vendedor | null>(
    null
  );
  const [reenvioState, setReenvioState] = useState<
    Record<number, ReenvioEstado>
  >({});

  const handleReenviarConvite = async (v: Vendedor): Promise<void> => {
    if (!v.vendedor_perfil_id) return;
    const perfilId = v.vendedor_perfil_id;
    setReenvioState((prev) => ({ ...prev, [perfilId]: { loading: true } }));
    try {
      const res = await fetch(
        `/api/representante/equipe/vendedores/${v.vendedor_id}/reenviar-convite`,
        { method: 'POST' }
      );
      const data = (await res.json().catch(() => ({}))) as {
        convite_url?: string;
        error?: string;
      };
      setReenvioState((prev) => ({ ...prev, [perfilId]: { loading: false } }));
      if (!res.ok || !data.convite_url) return;
      setCodigoGerado({
        codigo: String(v.vendedor_id),
        nome: v.vendedor_nome,
        conviteUrl: data.convite_url,
      });
    } catch {
      setReenvioState((prev) => ({ ...prev, [perfilId]: { loading: false } }));
    }
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resAtivos, resInativos] = await Promise.all([
        fetch(`/api/representante/equipe/vendedores?page=${page}`),
        fetch(`/api/representante/equipe/vendedores?ativo=false`),
      ]);
      if (resAtivos.ok) {
        const d = (await resAtivos.json()) as {
          vendedores?: Vendedor[];
          total?: number;
        };
        setVendedores(d.vendedores ?? []);
        setTotal(d.total ?? 0);
      }
      if (resInativos.ok) {
        const d = (await resInativos.json()) as {
          vendedores?: Vendedor[];
          total?: number;
        };
        setVendedoresInativos(d.vendedores ?? []);
        setTotalInativos(d.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleCadastroSucesso = (
    codigo: string,
    nomeVendedor: string,
    conviteUrl?: string
  ) => {
    setShowModal(false);
    setCodigoGerado({ codigo, nome: nomeVendedor, conviteUrl });
    void carregar();
  };

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Minha Equipe</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {aba === 'ativos'
              ? `${total} vendedor${total !== 1 ? 'es' : ''} vinculado${total !== 1 ? 's' : ''}`
              : `${totalInativos} vendedor${totalInativos !== 1 ? 'es' : ''} inativo${totalInativos !== 1 ? 's' : ''}`}
          </p>
        </div>
        {aba === 'ativos' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <UserPlus size={16} />
            Cadastrar Vendedor
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setAba('ativos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'ativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users2 size={14} />
          Ativos
          {total > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${aba === 'ativos' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
            >
              {total}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba('inativos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'inativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserX size={14} />
          Inativos
          {totalInativos > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${aba === 'inativos' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}
            >
              {totalInativos}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : aba === 'ativos' ? (
        vendedores.length === 0 ? (
          <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center">
            <Users2 size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Nenhum vendedor na equipe ainda.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em &quot;Cadastrar Vendedor&quot; para adicionar a equipe.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendedores.map((v) => (
                <VendedorCard
                  key={v.vinculo_id}
                  v={v}
                  onClick={() => setEditarVendedor(v)}
                  reenvioEstado={
                    v.vendedor_perfil_id != null
                      ? reenvioState[v.vendedor_perfil_id]
                      : undefined
                  }
                  onReenviar={() => handleReenviarConvite(v)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
                >
                  Proxima
                </button>
              </div>
            )}
          </>
        )
      ) : vendedoresInativos.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center">
          <UserX size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum vendedor inativo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendedoresInativos.map((v) => (
            <VendedorInativoCard
              key={v.vinculo_id}
              v={v}
              onReativar={(vend) => setReativarVendedor(vend)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CadastrarVendedorModal
          onClose={() => setShowModal(false)}
          onSuccess={handleCadastroSucesso}
        />
      )}

      {codigoGerado && (
        <CodigoVendedorSucesso
          codigo={codigoGerado.codigo}
          nomeVendedor={codigoGerado.nome}
          conviteUrl={codigoGerado.conviteUrl}
          onClose={() => setCodigoGerado(null)}
        />
      )}

      <EditarVendedorDrawer
        vendedor={editarVendedor}
        onClose={() => setEditarVendedor(null)}
        onUpdated={() => void carregar()}
      />

      <ReativarVendedorModal
        vendedor={reativarVendedor}
        onClose={() => setReativarVendedor(null)}
        onSuccess={() => {
          void carregar();
          setReativarVendedor(null);
        }}
      />
    </div>
  );
}
