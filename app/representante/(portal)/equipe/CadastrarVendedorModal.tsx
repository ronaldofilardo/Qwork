'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus, FileText, Copy, CheckCheck } from 'lucide-react';

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

interface Props {
  onClose: () => void;
  onSuccess: (codigo: string, nomeVendedor: string) => void;
}

export default function CadastrarVendedorModal({ onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [sexo, setSexo] = useState<'masculino' | 'feminino' | ''>('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const formatarCPF = (v: string) => {
    const nums = v.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const formatarCEP = (v: string) => {
    const nums = v.replace(/\D/g, '').slice(0, 8);
    return nums.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleSubmit = async () => {
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

    setSaving(true);
    try {
      const res = await fetch('/api/representante/equipe/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpfLimpo,
          sexo: sexo || undefined,
          email: email.trim() || null,
          endereco: endereco.trim() || null,
          cidade: cidade.trim() || null,
          estado: estado || null,
          cep: cep.replace(/\D/g, '') || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao cadastrar vendedor.');
        return;
      }
      onSuccess(data.codigo, nome.trim());
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
                O código será gerado automaticamente
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

            {/* Documento pessoal — placeholder */}
            <div className="col-span-2">
              <label className={labelCls}>Documento Pessoal</label>
              <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-50 opacity-60">
                <FileText size={16} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Upload de documento
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Funcionalidade em breve
                  </p>
                </div>
                <span className="ml-auto text-[10px] font-bold bg-gray-200 text-gray-500 rounded-full px-2 py-0.5 uppercase">
                  Em breve
                </span>
              </div>
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
            disabled={
              saving || !nome.trim() || cpf.replace(/\D/g, '').length !== 11
            }
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
  onClose: () => void;
}

export function CodigoVendedorSucesso({
  codigo,
  nomeVendedor,
  onClose,
}: SucessoProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
        <p className="text-sm text-gray-500 mt-1 mb-6">
          <span className="font-semibold text-gray-700">{nomeVendedor}</span>{' '}
          foi adicionado à sua equipe.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">
            Código de Divulgação
          </p>
          <p className="text-3xl font-black tracking-widest text-green-700 font-mono">
            {codigo}
          </p>
          <p className="text-xs text-green-600 mt-2">
            Compartilhe este código nas redes sociais para divulgação
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copiar}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
              copiado
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copiado ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copiado ? 'Copiado!' : 'Copiar código'}
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
