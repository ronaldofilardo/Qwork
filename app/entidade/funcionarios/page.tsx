'use client';

import { useEffect, useState } from 'react';
import FuncionariosSection from '@/components/funcionarios/FuncionariosSection';

interface Session {
  tomador_id: number;
  cpf: string;
}

export default function FuncionariosPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
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
        <h1 className="text-2xl font-bold text-gray-800">Funcionários</h1>
        <p className="text-gray-600">Todos os funcionários da empresa</p>
      </div>

      <FuncionariosSection
        contexto="entidade"
        tomadorId={session?.tomador_id}
        responsavelCpf={session?.cpf}
        onRefresh={() => {}}
        defaultStatusFilter="todos"
      />
    </div>
  );
}
