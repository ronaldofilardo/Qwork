'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type TipoPessoa = 'pf' | 'pj';

export default function CadastroRepresentante() {
  const router = useRouter();
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('pf');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cnpj: '',
    cpf_responsavel_pj: '',
    banco_codigo: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    titular_conta: '',
    pix_chave: '',
    pix_tipo: 'cpf',
    aceite_termos: false,
    aceite_disclaimer_nv: false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.replace(/\D/g, ''),
        tipo_pessoa: tipoPessoa,
        cpf: tipoPessoa === 'pf' ? form.cpf.replace(/\D/g, '') : undefined,
        cnpj: tipoPessoa === 'pj' ? form.cnpj.replace(/\D/g, '') : undefined,
        cpf_responsavel_pj:
          tipoPessoa === 'pj'
            ? form.cpf_responsavel_pj.replace(/\D/g, '')
            : undefined,
        banco_codigo: form.banco_codigo || undefined,
        agencia: form.agencia || undefined,
        conta: form.conta || undefined,
        tipo_conta: form.tipo_conta || undefined,
        titular_conta: form.titular_conta || undefined,
        pix_chave: form.pix_chave || undefined,
        pix_tipo: form.pix_chave ? form.pix_tipo : undefined,
        aceite_termos: form.aceite_termos,
        aceite_disclaimer_nv: form.aceite_disclaimer_nv,
      };

      const res = await fetch('/api/representante/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao cadastrar');
        return;
      }

      setCodigoGerado(data.representante?.codigo ?? data.codigo ?? '');
    } finally {
      setSalvando(false);
    }
  };

  // Tela de sucesso
  if (codigoGerado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cadastro realizado!
          </h1>
          <p className="text-gray-600">
            Seu código exclusivo de representante é:
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl py-4 px-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-blue-700">
              {codigoGerado}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Guarde este código! Ele será usado para login e para seus clientes
            indicarem você durante o cadastro.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              ⚡ Seu cadastro está <strong>ativo</strong>. Você já pode criar
              leads e indicar clientes. As comissões ficarão retidas até que o
              time QWork aprove seus documentos (status <strong>Apto</strong>).
            </p>
            <button
              onClick={() => router.push('/representante/login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ir para o Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <a
            href="/representante/login"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            ← Já tenho cadastro
          </a>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Cadastro de Representante
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha seus dados para se tornar um representante QWork
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {erro}
            </div>
          )}

          {/* Tipo de pessoa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pessoa
            </label>
            <div className="flex gap-3">
              {[
                { value: 'pf' as TipoPessoa, label: 'Pessoa Física (RPA)' },
                { value: 'pj' as TipoPessoa, label: 'Pessoa Jurídica (NF)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipoPessoa(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors
                    ${tipoPessoa === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Dados Pessoais
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  required
                  placeholder="(00) 00000-0000"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {tipoPessoa === 'pf' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ da Empresa *
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    required
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF do Responsável *
                  </label>
                  <input
                    type="text"
                    name="cpf_responsavel_pj"
                    value={form.cpf_responsavel_pj}
                    onChange={handleChange}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Dados bancários */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Dados Bancários{' '}
              <span className="text-gray-400 font-normal normal-case">
                (para recebimento de comissões)
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  name="banco_codigo"
                  value={form.banco_codigo}
                  onChange={handleChange}
                  placeholder="001"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  name="agencia"
                  value={form.agencia}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <input
                  type="text"
                  name="conta"
                  value={form.conta}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de conta
                </label>
                <select
                  name="tipo_conta"
                  value={form.tipo_conta}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titular da conta
                </label>
                <input
                  type="text"
                  name="titular_conta"
                  value={form.titular_conta}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  name="pix_chave"
                  value={form.pix_chave}
                  onChange={handleChange}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo PIX
                </label>
                <select
                  name="pix_tipo"
                  value={form.pix_tipo}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>
            </div>
          </div>

          {/* Termos */}
          <div className="space-y-3 bg-gray-50 rounded-lg p-4 border">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Termos e Condições
            </h2>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="aceite_termos"
                checked={form.aceite_termos}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                Aceito os{' '}
                <a
                  href="/termos/representante"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Termos de Uso do Programa de Representantes
                </a>{' '}
                do QWork. *
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="aceite_disclaimer_nv"
                checked={form.aceite_disclaimer_nv}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                Declaro que atuo como <strong>agente independente</strong>, sem
                vínculo empregatício com a QWork, e estou ciente de que as
                comissões são variáveis e condicionadas à emissão e pagamento de
                laudos pelos clientes indicados. *
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              salvando || !form.aceite_termos || !form.aceite_disclaimer_nv
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {salvando ? 'Cadastrando...' : 'Cadastrar como Representante'}
          </button>
        </form>
      </main>
    </div>
  );
}
