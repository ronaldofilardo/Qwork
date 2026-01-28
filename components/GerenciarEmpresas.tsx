'use client';

import { useState, useEffect } from 'react';
import { normalizeCNPJ, isValidCNPJFormat } from '@/lib/validators';

interface Empresa {
  id?: number;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativa?: boolean;
  criado_em?: string;
}

export default function GerenciarEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [editandoEmpresa, setEditandoEmpresa] = useState<Empresa | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Empresa>({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    ativa: true,
  });

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rh/empresas');

      if (response.ok) {
        const data = await response.json();
        setEmpresas(data || []);
      } else {
        console.error('Erro ao carregar empresas');
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarEmpresas();
  }, []);

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      ativa: true,
    });
    setEditandoEmpresa(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.cnpj) {
      alert('Nome e CNPJ são obrigatórios');
      return;
    }

    // Normalizar e validar CNPJ antes de enviar
    const cnpjNormalizado = normalizeCNPJ(formData.cnpj);
    if (!isValidCNPJFormat(cnpjNormalizado)) {
      alert('CNPJ inválido (deve conter 14 dígitos)');
      return;
    }

    try {
      setLoading(true);

      const url = '/api/rh/empresas';
      const method = editandoEmpresa ? 'PATCH' : 'POST';
      const body = editandoEmpresa
        ? { ...formData, cnpj: cnpjNormalizado, id: editandoEmpresa.id }
        : { ...formData, cnpj: cnpjNormalizado };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await carregarEmpresas();
        resetForm();
        alert(editandoEmpresa ? 'Empresa atualizada!' : 'Empresa criada!');
      } else {
        const errorData = await response.json().catch(() => ({}));

        // Tratamento específico de erros
        if (response.status === 409) {
          alert('CNPJ já cadastrado nesta clínica.');
        } else if (response.status === 403) {
          alert('Você não tem permissão para esta ação.');
        } else if (response.status === 400) {
          alert(errorData.error || 'Dados inválidos.');
        } else {
          alert('Erro interno. Tente novamente mais tarde.');
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar empresa:', error);
      alert('Erro ao salvar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (_id: number) => {
    // NOTA: Funcionalidade de DELETE não implementada
    // RLS policy empresas_rh_delete permite DELETE apenas para empresas sem funcionários ativos
    // TODO: Implementar rota DELETE em /api/rh/empresas/[id] se necessário
    alert(
      'Funcionalidade de exclusão não disponível no momento. Use a função de inativar empresa.'
    );
    return;

    /* Código comentado até implementação da rota DELETE
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/rh/empresas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await carregarEmpresas();
        alert('Empresa excluída!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Tratamento específico de erros
        if (response.status === 403) {
          alert('Você não tem permissão para esta ação.');
        } else if (response.status === 400) {
          alert(errorData.error || 'Dados inválidos.');
        } else {
          alert('Erro interno. Tente novamente mais tarde.');
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao excluir empresa:', error);
      alert('Erro ao excluir empresa');
    } finally {
      setLoading(false);
    }
    */
  };

  const startEdit = (empresa: Empresa) => {
    setEditandoEmpresa(empresa);
    setFormData({ ...empresa });
    setMostrarFormulario(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Gerenciar Empresas Clientes
            </h1>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Nova Empresa
            </button>
          </div>

          {/* Formulário */}
          {mostrarFormulario && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editandoEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Indústria ABC Ltda"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ *
                      </label>
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="contato@empresa.com.br"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        maxLength={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="SP"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="01234-567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="ativa"
                        checked={formData.ativa}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Empresa ativa
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading
                        ? 'Salvando...'
                        : editandoEmpresa
                          ? 'Atualizar'
                          : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Empresas */}
          {loading && !mostrarFormulario ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando empresas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {empresa.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.cnpj}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{empresa.email}</div>
                        <div>{empresa.telefone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.cidade && empresa.estado
                          ? `${empresa.cidade}/${empresa.estado}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                            empresa.ativa
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {empresa.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEdit(empresa)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(empresa.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {empresas.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Nenhuma empresa cadastrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
