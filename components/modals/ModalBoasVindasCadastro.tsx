'use client';

import { X, CheckCircle, FileText, Zap, CreditCard } from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';

interface ModalBoasVindasCadastroProps {
  isOpen: boolean;
  onClose: () => void;
  onContinuar: () => void;
}

const INFO_ITEMS = [
  {
    icon: CheckCircle,
    cor: 'text-green-500',
    titulo: 'Bem-vindo à QWork!',
    texto:
      'Obrigado por escolher nossa plataforma para gestão de avaliações psicossociais. Ficamos felizes em ter você conosco.',
  },
  {
    icon: FileText,
    cor: 'text-orange-500',
    titulo: 'Tenha em mãos os seguintes documentos',
    texto:
      'Cartão CNPJ, Contrato Social e documento pessoal de quem será o operador (gestor) da plataforma. Arquivos em PDF ou imagem de até 3 MB.',
  },
  {
    icon: Zap,
    cor: 'text-blue-500',
    titulo: 'Cadastro rápido, acesso imediato',
    texto:
      'O cadastro é simples e rápido. Imediatamente após a conclusão, sua empresa já pode utilizar a plataforma completa.',
  },
  {
    icon: CreditCard,
    cor: 'text-purple-500',
    titulo: 'Pagamento somente na emissão',
    texto:
      'Não há nenhuma cobrança adiantada. Qualquer pagamento é realizado apenas no momento da emissão de cada laudo.',
  },
];

export default function ModalBoasVindasCadastro({
  isOpen,
  onClose,
  onContinuar,
}: ModalBoasVindasCadastroProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <QworkLogo size="sm" />
            <h2 className="text-lg font-bold text-gray-800">
              Antes de começar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer focus:ring-2 focus:ring-orange-400 rounded"
          >
            <X size={22} />
          </button>
        </div>

        {/* Info items */}
        <div className="p-6 space-y-5">
          {INFO_ITEMS.map(({ icon: Icon, cor, titulo, texto }) => (
            <div key={titulo} className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={22} className={cor} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{titulo}</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                  {texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onContinuar}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          >
            Entendido, começar cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
