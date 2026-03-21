import { Users, UserCheck, UserX } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  ativos: number;
  inativos: number;
}

export default function StatsCards({
  total,
  ativos,
  inativos,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Users className="text-blue-500" size={24} />
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
        <p className="text-sm text-gray-600">Total de Funcionários</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <UserCheck className="text-green-500" size={24} />
          <span className="text-2xl font-bold text-gray-900">{ativos}</span>
        </div>
        <p className="text-sm text-gray-600">Funcionários Ativos</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <UserX className="text-red-500" size={24} />
          <span className="text-2xl font-bold text-gray-900">{inativos}</span>
        </div>
        <p className="text-sm text-gray-600">Funcionários Inativos</p>
      </div>
    </div>
  );
}
