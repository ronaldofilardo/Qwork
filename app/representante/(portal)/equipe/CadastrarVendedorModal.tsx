'use client';

import { useState, useRef } from 'react';
import {
  X,
  Loader2,
  UserPlus,
  Upload,
  FileText,
  Copy,
  CheckCheck,
} from 'lucide-react';

const ESTADOS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

const ACCEPT_DOCS = '.pdf,.jpg,.jpeg,.png';

interface Props {
  onClose: () => void;
  onSuccess: (
    codigo: string,
    nomeVendedor: string,
    conviteUrl?: string
  ) => void;
}

export default function CadastrarVendedorModal({ onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Campos comuns
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [sexo, setSexo] = useState<'masculino' | 'feminino' | ''>('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  // Campos PJ
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');

  // Arquivos
  const [docCpf, setDocCpf] = useState<File | null>(null);
  const [docCnpj, setDocCnpj] = useState<File | null>(null);
  const [docCpfResp, setDocCpfResp] = useState<File | null>(null);
  const refDocCpf = useRef<HTMLInputElement>(null);
  const refDocCnpj = useRef<HTMLInputElement>(null);
  const refDocCpfResp = useRef<HTMLInputElement>(null);

  const formatarCPF = (v: string): string => {
    const nums = v.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const formatarCNPJ = (v: string): string => {
    const nums = v.replace(/\D/g, '').slice(0, 14);
    return nums
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  };

  const formatarCEP = (v: string): string => {
    const nums = v.replace(/\D/g, '').slice(0, 8);
    return nums.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleSubmit = async (): Promise<void> => {
    setErro(null);
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (!nome.trim()) {
      setErro('Nome é obrigatório.');
      return;
    }
    if (cpfLimpo.length !== 11) {
      setErro('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (tipoPessoa === 'pj') {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length !== 14) {
        setErro('Informe um CNPJ válido com 14 dígitos.');
        return;
      }
      if (!razaoSocial.trim() || razaoSocial.trim().length < 3) {
        setErro('Razão social obrigatória (mín. 3 caracteres).');
        return;
      }
      const cpfRespLimpo = cpfResponsavel.replace(/\D/g, '');
      if (cpfRespLimpo.length !== 11) {
        setErro('CPF do responsável PJ inválido.');
        return;
      }
      if (!docCnpj) {
        setErro('Documento do CNPJ é obrigatório.');
        return;
      }
      if (!docCpfResp) {
        setErro('Documento do CPF do responsável é obrigatório.');
        return;
      }
    } else {
      if (!docCpf) {
        setErro('Documento do CPF é obrigatório.');
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nome', nome.trim());
      fd.append('cpf', cpfLimpo);
      fd.append('tipo_pessoa', tipoPessoa);
      if (sexo) fd.append('sexo', sexo);
      if (email.trim()) fd.append('email', email.trim());
      if (endereco.trim()) fd.append('endereco', endereco.trim());
      if (cidade.trim()) fd.append('cidade', cidade.trim());
      if (estado) fd.append('estado', estado);
      if (cep.replace(/\D/g, '')) fd.append('cep', cep.replace(/\D/g, ''));

      if (tipoPessoa === 'pj') {
        fd.append('cnpj', cnpj.replace(/\D/g, ''));
        fd.append('razao_social', razaoSocial.trim());
        fd.append('cpf_responsavel', cpfResponsavel.replace(/\D/g, ''));
        fd.append('documento_cnpj', docCnpj!);
        fd.append('documento_cpf_responsavel', docCpfResp!);
      } else {
        fd.append('documento_cpf', docCpf!);
      }

      const res = await fetch('/api/representante/equipe/cadastrar', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao cadastrar vendedor.');
        return;
      }
      onSuccess(String(data.vendedor_id ?? ''), nome.trim(), data.convite_url);
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all';
  const labelCls =
    'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  const isDisabled =
    saving ||
    !nome.trim() ||
    cpf.replace(/\D/g, '').length !== 11 ||
    (tipoPessoa === 'pf'
      ? !docCpf
      : !docCnpj || !docCpfResp || cnpj.replace(/\D/g, '').length !== 14);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Cadastrar Vendedor
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                O vendedor será vinculado à sua equipe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          {/* Tipo Pessoa */}
          <div>
            <label className={labelCls}>Tipo de Pessoa *</label>
            <div className="flex gap-4 mt-1">
              {(
                [
                  ['pf', 'Pessoa Física'],
                  ['pj', 'Pessoa Jurídica'],
                ] as const
              ).map(([val, lbl]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="tipoPessoa"
                    value={val}
                    checked={tipoPessoa === val}
                    onChange={() => setTipoPessoa(val as 'pf' | 'pj')}
                    className="accent-green-600"
                  />
                  <span className="text-sm text-gray-700">{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Nome Completo *</label>
              <input
                className={inputCls}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do vendedor"
              />
            </div>

            <div>
              <label className={labelCls}>CPF *</label>
              <input
                className={inputCls}
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className={labelCls}>Sexo</label>
              <div className="flex gap-3 mt-1">
                {(['masculino', 'feminino'] as const).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="sexo"
                      value={s}
                      checked={sexo === s}
                      onChange={() => setSexo(s)}
                      className="accent-green-600"
                    />
                    <span className="text-sm capitalize text-gray-700">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campos PJ */}
            {tipoPessoa === 'pj' && (
              <>
                <div>
                  <label className={labelCls}>CNPJ *</label>
                  <input
                    className={inputCls}
                    value={cnpj}
                    onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div>
                  <label className={labelCls}>Razão Social *</label>
                  <input
                    className={inputCls}
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Razão social da empresa"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>CPF do Responsável PJ *</label>
                  <input
                    className={inputCls}
                    value={cpfResponsavel}
                    onChange={(e) =>
                      setCpfResponsavel(formatarCPF(e.target.value))
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className={labelCls}>Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com (opcional)"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Endereço</label>
              <input
                className={inputCls}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div>
              <label className={labelCls}>Cidade</label>
              <input
                className={inputCls}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className={labelCls}>Estado</label>
              <select
                className={inputCls}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="">Selecionar...</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>CEP</label>
              <input
                className={inputCls}
                value={cep}
                onChange={(e) => setCep(formatarCEP(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            {/* Upload de documentos */}
            <div className="col-span-2 space-y-3 pt-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                <Upload size={14} className="text-green-600" /> Documentos
                Obrigatórios
              </p>

              {tipoPessoa === 'pf' ? (
                <div>
                  <label className={labelCls}>
                    Documento CPF (PDF, JPG, PNG) *
                  </label>
                  <input
                    ref={refDocCpf}
                    type="file"
                    accept={ACCEPT_DOCS}
                    onChange={(e) => setDocCpf(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => refDocCpf.current?.click()}
                    className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 hover:bg-green-50/30 transition-all"
                  >
                    <FileText
                      size={16}
                      className={docCpf ? 'text-green-600' : 'text-gray-400'}
                    />
                    <span className="text-sm text-gray-600 truncate flex-1 text-left">
                      {docCpf ? docCpf.name : 'Selecionar documento do CPF...'}
                    </span>
                    {docCpf && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                        OK
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>
                      Documento CNPJ (PDF, JPG, PNG) *
                    </label>
                    <input
                      ref={refDocCnpj}
                      type="file"
                      accept={ACCEPT_DOCS}
                      onChange={(e) => setDocCnpj(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => refDocCnpj.current?.click()}
                      className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 hover:bg-green-50/30 transition-all"
                    >
                      <FileText
                        size={16}
                        className={docCnpj ? 'text-green-600' : 'text-gray-400'}
                      />
                      <span className="text-sm text-gray-600 truncate flex-1 text-left">
                        {docCnpj
                          ? docCnpj.name
                          : 'Selecionar documento do CNPJ...'}
                      </span>
                      {docCnpj && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                          OK
                        </span>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Documento CPF do Responsável (PDF, JPG, PNG) *
                    </label>
                    <input
                      ref={refDocCpfResp}
                      type="file"
                      accept={ACCEPT_DOCS}
                      onChange={(e) =>
                        setDocCpfResp(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => refDocCpfResp.current?.click()}
                      className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 hover:bg-green-50/30 transition-all"
                    >
                      <FileText
                        size={16}
                        className={
                          docCpfResp ? 'text-green-600' : 'text-gray-400'
                        }
                      />
                      <span className="text-sm text-gray-600 truncate flex-1 text-left">
                        {docCpfResp
                          ? docCpfResp.name
                          : 'Selecionar documento do CPF responsável...'}
                      </span>
                      {docCpfResp && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                          OK
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}

              <p className="text-[11px] text-gray-400">
                Máx. 3MB por arquivo. Formatos: PDF, JPG, PNG
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Cadastrando...' : 'Cadastrar Vendedor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de sucesso com exibição do código ────────────────────────────

interface SucessoProps {
  codigo: string;
  nomeVendedor: string;
  conviteUrl?: string;
  onClose: () => void;
}

export function CodigoVendedorSucesso({
  codigo,
  nomeVendedor,
  conviteUrl,
  onClose,
}: SucessoProps) {
  const [copiadoCodigo, setCopiadoCodigo] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  const copiarCodigo = async () => {
    await navigator.clipboard.writeText(codigo);
    setCopiadoCodigo(true);
    setTimeout(() => setCopiadoCodigo(false), 2000);
  };

  const copiarLink = async () => {
    if (!conviteUrl) return;
    await navigator.clipboard.writeText(conviteUrl);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCheck size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900">
          Vendedor Cadastrado!
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          <span className="font-semibold text-gray-700">{nomeVendedor}</span>{' '}
          foi adicionado à sua equipe.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">
            ID do Vendedor
          </p>
          <p className="text-3xl font-black tracking-widest text-green-700 font-mono">
            #{codigo}
          </p>
          <p className="text-xs text-green-600 mt-2">
            Use este ID para identificar o vendedor no sistema
          </p>
        </div>

        {conviteUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 text-left">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">
              Link de Acesso — Criar Senha
            </p>
            <p className="text-xs text-blue-800 font-mono break-all mb-3">
              {conviteUrl}
            </p>
            <button
              onClick={copiarLink}
              className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl border transition-all ${
                copiadoLink
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {copiadoLink ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copiadoLink ? 'Copiado!' : 'Copiar link de convite'}
            </button>
            <p className="text-[10px] text-blue-500 mt-2">
              Envie este link para o vendedor criar sua senha. Válido por 7
              dias.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={copiarCodigo}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
              copiadoCodigo
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copiadoCodigo ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copiadoCodigo ? 'Copiado!' : 'Copiar código'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
