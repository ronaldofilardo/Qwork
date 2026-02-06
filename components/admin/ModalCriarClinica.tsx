import { X } from 'lucide-react';
import {
  validarCNPJ,
  validarCPF,
  validarEmail,
  UFS_BRASIL,
} from '@/lib/validators';

interface ModalCriarClinicaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  newClinica: {
    nome: string;
    razao_social: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    inscricao_estadual: string;
    rh: {
      nome: string;
      cpf: string;
      email: string;
      senha: string;
    };
  };
  setNewClinica: React.Dispatch<
    React.SetStateAction<{
      nome: string;
      razao_social: string;
      cnpj: string;
      email: string;
      telefone: string;
      endereco: string;
      cidade: string;
      estado: string;
      inscricao_estadual: string;
      rh: {
        nome: string;
        cpf: string;
        email: string;
        senha: string;
      };
    }>
  >;
}

export function ModalCriarClinica({
  isOpen,
  onClose,
  onSuccess,
  newClinica,
  setNewClinica,
}: ModalCriarClinicaProps) {
  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validações
    if (!newClinica.nome) {
      alert('Nome da clínica é obrigatório');
      return;
    }

    if (!newClinica.cnpj) {
      alert('CNPJ é obrigatório');
      return;
    }

    if (!validarCNPJ(newClinica.cnpj)) {
      alert('CNPJ inválido');
      return;
    }

    if (newClinica.email && !validarEmail(newClinica.email)) {
      alert('Email inválido');
      return;
    }

    // Validar gestor RH se preenchido
    if (newClinica.rh.nome || newClinica.rh.cpf || newClinica.rh.email) {
      if (!newClinica.rh.nome || !newClinica.rh.cpf || !newClinica.rh.email) {
        alert('Para adicionar um gestor RH, preencha nome, CPF e email');
        return;
      }

      if (!validarCPF(newClinica.rh.cpf)) {
        alert('CPF do gestor RH inválido');
        return;
      }

      if (!validarEmail(newClinica.rh.email)) {
        alert('Email do gestor RH inválido');
        return;
      }
    }

    try {
      const response = await fetch('/api/admin/clinicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClinica,
          rh: newClinica.rh.nome ? newClinica.rh : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Clínica criada com sucesso!${data.rh ? ' Gestor RH também foi criado.' : ''}`
        );
        onSuccess();
        onClose();
        // Resetar formulário
        setNewClinica({
          nome: '',
          razao_social: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          inscricao_estadual: '',
          rh: {
            nome: '',
            cpf: '',
            email: '',
            senha: '',
          },
        });
      } else {
        alert(`Erro ao criar clínica: ${data.error}`);
      }
    } catch (err: unknown) {
      console.error('Erro:', err);
      alert('Erro ao criar clínica');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Nova Clínica</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dados da Clínica */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              Dados da Clínica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome (Fantasia) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClinica.nome}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Clínica Medicina Ocupacional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={newClinica.razao_social}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      razao_social: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Razão Social Ltda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClinica.cnpj}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, cnpj: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={newClinica.inscricao_estadual}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      inscricao_estadual: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="000.000.000.000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClinica.email}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="contato@clinica.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={newClinica.telefone}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, telefone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={newClinica.endereco}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, endereco: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={newClinica.cidade}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, cidade: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado (UF)
                </label>
                <select
                  value={newClinica.estado}
                  onChange={(e) =>
                    setNewClinica({ ...newClinica, estado: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione</option>
                  {UFS_BRASIL.map((uf) => (
                    <option key={uf.sigla} value={uf.sigla}>
                      {uf.sigla} - {uf.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dados do Gestor RH Responsável */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              Gestor RH Responsável (Opcional)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Se desejar, cadastre o gestor RH responsável pela clínica ao mesmo
              tempo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={newClinica.rh.nome}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      rh: { ...newClinica.rh, nome: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={newClinica.rh.cpf}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      rh: {
                        ...newClinica.rh,
                        cpf: e.target.value.replace(/\D/g, '').slice(0, 11),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="00000000000"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClinica.rh.email}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      rh: { ...newClinica.rh, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="gestor@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha (opcional)
                </label>
                <input
                  type="password"
                  value={newClinica.rh.senha}
                  onChange={(e) =>
                    setNewClinica({
                      ...newClinica,
                      rh: { ...newClinica.rh, senha: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Padrão: 123456"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Criar Clínica
          </button>
        </div>
      </div>
    </div>
  );
}
