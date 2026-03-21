'use client';

import { useState } from 'react';
import { X, Loader2, Building2, CreditCard } from 'lucide-react';

const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú' },
  { codigo: '389', nome: 'Banco Mercantil' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '745', nome: 'Citibank' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagSeguro' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '077', nome: 'Inter' },
];

const STATUS_OPT = [
  { value: 'ativo', label: 'Em Cadastro' },
  { value: 'apto_pendente', label: 'Aguardando Aprovação' },
  { value: 'apto', label: 'Ativo' },
  { value: 'apto_bloqueado', label: 'Bloqueado' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'desativado', label: 'Desativado' },
  { value: 'rejeitado', label: 'Rejeitado' },
];

interface RepresentanteData {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  tipo_pessoa: 'pf' | 'pj';
  status: string;
  percentual_comissao?: number | null;
  banco_codigo?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  titular_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null;
}

interface Props {
  representante: RepresentanteData;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = 'cadastrais' | 'bancarios';

export default function EditRepresentanteModal({
  representante: rep,
  onClose,
  onSuccess,
}: Props) {
  const [aba, setAba] = useState<Tab>('cadastrais');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Dados cadastrais
  const [nome, setNome] = useState(rep.nome ?? '');
  const [email, setEmail] = useState(rep.email ?? '');
  const [telefone, setTelefone] = useState(rep.telefone ?? '');
  const [cpf, setCpf] = useState(rep.cpf ?? '');
  const [cnpj, setCnpj] = useState(rep.cnpj ?? '');
  const [status, setStatus] = useState(rep.status ?? 'ativo');
  const [percentual, setPercentual] = useState(
    rep.percentual_comissao != null ? String(rep.percentual_comissao) : ''
  );

  // Dados bancários
  const [bancoCode, setBancoCode] = useState(rep.banco_codigo ?? '');
  const [agencia, setAgencia] = useState(rep.agencia ?? '');
  const [conta, setConta] = useState(rep.conta ?? '');
  const [tipoConta, setTipoConta] = useState(rep.tipo_conta ?? '');
  const [titular, setTitular] = useState(rep.titular_conta ?? '');
  const [pixChave, setPixChave] = useState(rep.pix_chave ?? '');
  const [pixTipo, setPixTipo] = useState(rep.pix_tipo ?? '');

  const handleSave = async () => {
    setSaving(true);
    setErro(null);
    try {
      const body: Record<string, unknown> = {};

      // Cadastrais
      if (nome.trim() !== rep.nome) body.nome = nome.trim();
      if (email.trim() !== (rep.email ?? '')) body.email = email.trim();
      if (telefone.trim() !== (rep.telefone ?? ''))
        body.telefone = telefone.trim() || null;
      if (status !== rep.status) body.status = status;
      if (
        percentual.trim() !==
        (rep.percentual_comissao != null ? String(rep.percentual_comissao) : '')
      ) {
        body.percentual_comissao = percentual.trim()
          ? parseFloat(percentual)
          : null;
      }
      if (rep.tipo_pessoa === 'pf' && cpf.trim() !== (rep.cpf ?? ''))
        body.cpf = cpf.trim() || null;
      if (rep.tipo_pessoa === 'pj' && cnpj.trim() !== (rep.cnpj ?? ''))
        body.cnpj = cnpj.trim() || null;

      // Bancários
      if (bancoCode.trim() !== (rep.banco_codigo ?? ''))
        body.banco_codigo = bancoCode.trim() || null;
      if (agencia.trim() !== (rep.agencia ?? ''))
        body.agencia = agencia.trim() || null;
      if (conta.trim() !== (rep.conta ?? '')) body.conta = conta.trim() || null;
      if (tipoConta.trim() !== (rep.tipo_conta ?? ''))
        body.tipo_conta = tipoConta.trim() || null;
      if (titular.trim() !== (rep.titular_conta ?? ''))
        body.titular_conta = titular.trim() || null;
      if (pixChave.trim() !== (rep.pix_chave ?? ''))
        body.pix_chave = pixChave.trim() || null;
      if (pixTipo.trim() !== (rep.pix_tipo ?? ''))
        body.pix_tipo = pixTipo.trim() || null;

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      const res = await fetch(`/api/comercial/representantes/${rep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar.');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all bg-white';
  const labelCls =
    'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Editar Representante
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{rep.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-8 shrink-0">
          <button
            onClick={() => setAba('cadastrais')}
            className={`flex items-center gap-2 px-2 pb-3 pt-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-all mr-6 ${
              aba === 'cadastrais'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Building2 size={14} />
            Dados Cadastrais
          </button>
          <button
            onClick={() => setAba('bancarios')}
            className={`flex items-center gap-2 px-2 pb-3 pt-3 text-xs font-semibold uppercase tracking-wide border-b-2 transition-all ${
              aba === 'bancarios'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <CreditCard size={14} />
            Dados Bancários
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {erro && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          {aba === 'cadastrais' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome</label>
                  <input
                    className={inputCls}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input
                    className={inputCls}
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                {rep.tipo_pessoa === 'pf' && (
                  <div>
                    <label className={labelCls}>CPF</label>
                    <input
                      className={inputCls}
                      value={cpf}
                      onChange={(e) =>
                        setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))
                      }
                      maxLength={11}
                    />
                  </div>
                )}
                {rep.tipo_pessoa === 'pj' && (
                  <div>
                    <label className={labelCls}>CNPJ</label>
                    <input
                      className={inputCls}
                      value={cnpj}
                      onChange={(e) =>
                        setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))
                      }
                      maxLength={14}
                    />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    className={inputCls}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_OPT.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Comissão (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputCls}
                    value={percentual}
                    onChange={(e) => setPercentual(e.target.value)}
                    placeholder="Ex: 5.0"
                  />
                </div>
              </div>
            </div>
          )}

          {aba === 'bancarios' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Banco</label>
                  <select
                    className={inputCls}
                    value={bancoCode}
                    onChange={(e) => setBancoCode(e.target.value)}
                  >
                    <option value="">Selecionar banco...</option>
                    {BANCOS.map((b) => (
                      <option key={b.codigo} value={b.codigo}>
                        {b.codigo} — {b.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Agência</label>
                  <input
                    className={inputCls}
                    value={agencia}
                    onChange={(e) => setAgencia(e.target.value)}
                    placeholder="Ex: 0001"
                  />
                </div>
                <div>
                  <label className={labelCls}>Conta</label>
                  <input
                    className={inputCls}
                    value={conta}
                    onChange={(e) => setConta(e.target.value)}
                    placeholder="Ex: 12345-6"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tipo de Conta</label>
                  <select
                    className={inputCls}
                    value={tipoConta}
                    onChange={(e) => setTipoConta(e.target.value)}
                  >
                    <option value="">Selecionar...</option>
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Titular da Conta</label>
                  <input
                    className={inputCls}
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    placeholder="Nome do titular"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tipo PIX</label>
                  <select
                    className={inputCls}
                    value={pixTipo}
                    onChange={(e) => setPixTipo(e.target.value)}
                  >
                    <option value="">Selecionar...</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Chave PIX</label>
                  <input
                    className={inputCls}
                    value={pixChave}
                    onChange={(e) => setPixChave(e.target.value)}
                    placeholder="Chave PIX"
                  />
                </div>
              </div>
            </div>
          )}
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
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
