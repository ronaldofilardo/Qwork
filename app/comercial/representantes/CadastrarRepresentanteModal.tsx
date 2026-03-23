'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus, Copy, CheckCheck } from 'lucide-react';

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
    convite_url: string;
  } | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [copiado, setCopiado] = useState(false);

  const formatarCPF = (v: string): string => {
    const nums = v.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
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

    setSaving(true);
    try {
      const res = await fetch('/api/comercial/representantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpfLimpo,
          email: email.trim().toLowerCase(),
          telefone: telefone.replace(/\D/g, '') || null,
          tipo_pessoa: tipoPessoa,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao cadastrar representante.');
        return;
      }
      setResultado({ codigo: data.codigo, convite_url: data.convite_url });
      onSuccess();
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const copiarLink = async (): Promise<void> => {
    if (!resultado?.convite_url) return;
    await navigator.clipboard.writeText(resultado.convite_url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all';
  const labelCls =
    'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  // Tela de sucesso com link de convite
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
          <p className="text-sm text-gray-500 mt-1 mb-2">
            Código:{' '}
            <span className="font-mono font-bold text-green-700">
              {resultado.codigo}
            </span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Envie o link abaixo para o representante criar sua senha (válido por
            7 dias).
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Link de Convite
            </p>
            <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">
              {resultado.convite_url}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copiarLink}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                copiado
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {copiado ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
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
                Um convite de criação de senha será gerado
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
                {(['pf', 'pj'] as const).map((tp) => (
                  <label
                    key={tp}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value={tp}
                      checked={tipoPessoa === tp}
                      onChange={() => setTipoPessoa(tp)}
                      className="accent-green-600"
                    />
                    <span className="text-sm text-gray-700 uppercase">
                      {tp}
                    </span>
                  </label>
                ))}
              </div>
            </div>

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
              !email.trim()
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
