'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, FileText, CheckCircle } from 'lucide-react';

interface Stats {
  total_empresas: number;
  total_funcionarios: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
}

export default function RhDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/rh/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard - Gestão de Clínica
        </h1>
        <p className="text-gray-600">Visão geral das empresas e avaliações</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empresas</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.total_empresas || 0}
              </p>
            </div>
            <Building2 className="text-primary-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Funcionários</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.total_funcionarios || 0}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliações</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.total_avaliacoes || 0}
              </p>
            </div>
            <FileText className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.avaliacoes_concluidas || 0}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Bem-vindo ao Painel de Gestão
        </h2>
        <p className="text-gray-600 mb-4">
          Use o menu lateral para navegar entre as diferentes seções:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>
            • <strong>Empresas Clientes:</strong> Gerencie suas empresas
            contratantes
          </li>
          <li>
            • <strong>Laudos:</strong> Acesse e baixe os relatórios gerados
          </li>
          <li>
            • <strong>Notificações:</strong> Acompanhe as atualizações do
            sistema
          </li>
          <li>
            • <strong>Informações da Conta:</strong> Gerencie seus dados
            pessoais
          </li>
        </ul>
      </div>
    </div>
  );
}
