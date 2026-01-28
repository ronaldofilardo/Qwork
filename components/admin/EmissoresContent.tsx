"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, Edit, FileText } from "lucide-react";
import { ModalCadastroEmissor } from "@/components/modals/ModalCadastroEmissor";

interface Emissor {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  total_laudos_emitidos: number;
}

export function EmissoresContent() {
  const [emissores, setEmissores] = useState<Emissor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEmissores = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emissores");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmissores(data.emissores || []);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar emissores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmissores();
  }, []);

  const handleModalSuccess = () => {
    fetchEmissores(); // Recarregar lista de emissores
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Emissores de Laudos
        </h2>
        <button 
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Emissor
        </button>
      </div>

      {emissores.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum emissor cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {emissores.map((emissor) => (
            <div
              key={emissor.cpf}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {emissor.nome}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    CPF: {emissor.cpf}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{emissor.email}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {emissor.total_laudos_emitidos} laudos emitidos
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      emissor.ativo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {emissor.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro de Emissor */}
      <ModalCadastroEmissor
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
