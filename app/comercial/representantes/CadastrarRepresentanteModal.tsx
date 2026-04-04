'use client';

import { useState, useRef } from 'react';
import {
  X,
  Loader2,
  UserPlus,
  Copy,
  CheckCheck,
  Upload,
  FileText,
} from 'lucide-react';

const ACCEPT_DOCS = '.pdf,.jpg,.jpeg,.png';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CadastrarRepresentanteModal({
  onClose,
  onSuccess,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    codigo: string;
    cpfFormatado: string;
    senha_temporaria: string;
  } | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [copiadoCpf, setCopiadoCpf] = useState(false);
  const [copiadoSenha, setCopiadoSenha] = useState(false);

  // Campos PJ
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');

  // Arquivo
  const [docIdentificacao, setDocIdentificacao] = useState<File | null>(null);
  const [cartaoCnpj, setCartaoCnpj] = useState<File | null>(null);
  const refDocId = useRef<HTMLInputElement>(null);
  const refCartaoCnpj = useRef<HTMLInputElement>(null);

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

  const formatarTelefone = (v: string): string => {
    const nums = v.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 10) {
      return nums
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return nums
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
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
    if (!email.trim()) {
      setErro('Email é obrigatório.');
      return;
    }
    if (!docIdentificacao) {
      setErro('Documento de identificação é obrigatório.');
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
      if (!cartaoCnpj) {
        setErro('Cartão do CNPJ é obrigatório para Pessoa Jurídica.');
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nome', nome.trim());
      fd.append('cpf', cpfLimpo);
      fd.append('email', email.trim().toLowerCase());
      fd.append('tipo_pessoa', tipoPessoa);
      fd.append('documento_identificacao', docIdentificacao);
      if (telefone.replace(/\D/g, ''))
        fd.append('telefone', telefone.replace(/\D/g, ''));

      if (tipoPessoa === 'pj') {
        fd.append('cnpj', cnpj.replace(/\D/g, ''));
        fd.append('razao_social', razaoSocial.trim());
        if (cartaoCnpj) fd.append('cartao_cnpj', cartaoCnpj);
      }

      const res = await fetch('/api/comercial/representantes', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao cadastrar representante.');
        return;
      }
      setResultado({
        codigo: data.codigo,
        cpfFormatado: cpf,
        senha_temporaria: data.senha_temporaria,
      });
      onSuccess();
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const copiarCpf = async (): Promise<void> => {
    if (!resultado?.cpfFormatado) return;
    await navigator.clipboard.writeText(
      resultado.cpfFormatado.replace(/\D/g, '')
    );
    setCopiadoCpf(true);
    setTimeout(() => setCopiadoCpf(false), 2000);
  };

  const copiarSenha = async (): Promise<void> => {
    if (!resultado?.senha_temporaria) return;
    await navigator.clipboard.writeText(resultado.senha_temporaria);
    setCopiadoSenha(true);
    setTimeout(() => setCopiadoSenha(false), 2000);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all';
  const labelCls =
    'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  // Tela de sucesso com credenciais de primeiro acesso
  if (resultado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCheck size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Representante Cadastrado!
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Código:{' '}
            <span className="font-mono font-bold text-green-700">
              {resultado.codigo}
            </span>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left space-y-3">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
              Credenciais de Primeiro Acesso
            </p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Repasse ao representante. Ele deverá criar uma nova senha e
              aceitar os termos no 1º acesso.
            </p>

            {/* CPF */}
            <div className="flex items-center justify-between gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">
                  Login (CPF)
                </p>
                <p className="text-sm font-mono font-bold text-gray-800">
                  {resultado.cpfFormatado}
                </p>
              </div>
              <button
                onClick={copiarCpf}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                  copiadoCpf
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {copiadoCpf ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copiadoCpf ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Senha */}
            <div className="flex items-center justify-between gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">
                  Senha Temporária
                </p>
                <p className="text-sm font-mono font-bold text-gray-800 tracking-wider">
                  {resultado.senha_temporaria}
                </p>
              </div>
              <button
                onClick={copiarSenha}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                  copiadoSenha
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {copiadoSenha ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copiadoSenha ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

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
                Cadastrar Representante
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Credenciais de acesso serão geradas automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Nome Completo *</label>
              <input
                className={inputCls}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do representante"
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
              <label className={labelCls}>Tipo Pessoa *</label>
              <div className="flex gap-3 mt-1">
                {(
                  [
                    ['pf', 'Pessoa Física'],
                    ['pj', 'Pessoa Jurídica'],
                  ] as const
                ).map(([tp, lbl]) => (
                  <label
                    key={tp}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value={tp}
                      checked={tipoPessoa === tp}
                      onChange={() => setTipoPessoa(tp as 'pf' | 'pj')}
                      className="accent-green-600"
                    />
                    <span className="text-sm text-gray-700">{lbl}</span>
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
                  <label className={labelCls}>
                    Cartão do CNPJ (PDF, JPG, PNG) *
                  </label>
                  <input
                    ref={refCartaoCnpj}
                    type="file"
                    accept={ACCEPT_DOCS}
                    onChange={(e) => setCartaoCnpj(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => refCartaoCnpj.current?.click()}
                    className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 hover:bg-green-50/30 transition-all"
                  >
                    <FileText
                      size={16}
                      className={
                        cartaoCnpj ? 'text-green-600' : 'text-gray-400'
                      }
                    />
                    <span className="text-sm text-gray-600 truncate flex-1 text-left">
                      {cartaoCnpj
                        ? cartaoCnpj.name
                        : 'Selecionar cartão do CNPJ...'}
                    </span>
                    {cartaoCnpj && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                        OK
                      </span>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Máx. 3MB. Formatos: PDF, JPG, PNG
                  </p>
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Telefone</label>
              <input
                className={inputCls}
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Upload de documento */}
            <div className="col-span-2 space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                <Upload size={14} className="text-green-600" /> Documento
                Obrigatório
              </p>
              <div>
                <label className={labelCls}>
                  Documento de Identificação (PDF, JPG, PNG) *
                </label>
                <input
                  ref={refDocId}
                  type="file"
                  accept={ACCEPT_DOCS}
                  onChange={(e) =>
                    setDocIdentificacao(e.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => refDocId.current?.click()}
                  className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 hover:bg-green-50/30 transition-all"
                >
                  <FileText
                    size={16}
                    className={
                      docIdentificacao ? 'text-green-600' : 'text-gray-400'
                    }
                  />
                  <span className="text-sm text-gray-600 truncate flex-1 text-left">
                    {docIdentificacao
                      ? docIdentificacao.name
                      : 'Selecionar documento...'}
                  </span>
                  {docIdentificacao && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                      OK
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Máx. 3MB. Formatos: PDF, JPG, PNG
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              saving ||
              !nome.trim() ||
              cpf.replace(/\D/g, '').length !== 11 ||
              !email.trim() ||
              !docIdentificacao ||
              (tipoPessoa === 'pj' &&
                (cnpj.replace(/\D/g, '').length !== 14 ||
                  !razaoSocial.trim() ||
                  !cartaoCnpj))
            }
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Cadastrando...' : 'Cadastrar Representante'}
          </button>
        </div>
      </div>
    </div>
  );
}
