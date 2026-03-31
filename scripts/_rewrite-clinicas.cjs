// Script CJS to rewrite ClinicasContent.tsx as a thin compositor
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'ClinicasContent.tsx');

const newContent = `'use client';

import { Stethoscope, Plus } from 'lucide-react';
import ModalLinkContratoPersonalizado from '@/components/modals/ModalLinkContratoPersonalizado';
import AdminConfirmDeleteModal from '@/components/modals/AdminConfirmDeleteModal';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

import { useClinicasAdmin } from './clinicas/useClinicasAdmin';
import { PlanoPersonalizadoCard } from './clinicas/PlanoPersonalizadoCard';
import { ClinicaCard } from './clinicas/ClinicaCard';

export function ClinicasContent() {
  const {
    clinicas,
    loading,
    clinicasPersonalizado,
    expandedClinica,
    gestoresPorClinica,
    empresasPorClinica,
    loadingDetails,
    deletingClinica,
    showDeleteModal,
    setShowDeleteModal,
    deleteTargetId,
    setDeleteTargetId,
    deleteClinica,
    showLinkContratoModal,
    setShowLinkContratoModal,
    contratoPersonalizadoData,
    setContratoPersonalizadoData,
    showCadastroModal,
    setShowCadastroModal,
    fetchClinicas,
    toggleExpand,
  } = useClinicasAdmin();

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
          Clínicas / Serviços de Medicina Ocupacional
        </h2>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          onClick={() => setShowCadastroModal(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Clínica
        </button>
      </div>

      {/* Planos Personalizados Pendentes */}
      {clinicasPersonalizado.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-orange-600 mb-4">
            📋 Planos Personalizados Pendentes de Definição
          </h3>
          <div className="space-y-4">
            {clinicasPersonalizado.map((clinica) => (
              <PlanoPersonalizadoCard
                key={clinica.id}
                clinica={clinica}
                onUpdate={fetchClinicas}
                onPlanoDefinido={(data) => {
                  setContratoPersonalizadoData(data);
                  setShowLinkContratoModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Link Contrato Personalizado */}
      {contratoPersonalizadoData && (
        <ModalLinkContratoPersonalizado
          isOpen={showLinkContratoModal}
          onClose={() => {
            setShowLinkContratoModal(false);
            setContratoPersonalizadoData(null);
          }}
          contratoId={contratoPersonalizadoData.contratoId}
          tomadorNome={contratoPersonalizadoData.tomadorNome}
          valorPorFuncionario={contratoPersonalizadoData.valorPorFuncionario}
          numeroFuncionarios={contratoPersonalizadoData.numeroFuncionarios}
          valorTotal={contratoPersonalizadoData.valorTotal}
        />
      )}

      {clinicas.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma clínica cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinicas.map((clinica) => (
            <ClinicaCard
              key={clinica.id}
              clinica={clinica}
              isExpanded={expandedClinica === clinica.id}
              gestores={gestoresPorClinica[clinica.id] || []}
              empresas={empresasPorClinica[clinica.id] || []}
              isLoadingDetails={loadingDetails[clinica.id] || false}
              deletingClinica={deletingClinica}
              onToggleExpand={toggleExpand}
              onRequestDelete={(id) => {
                setDeleteTargetId(id);
                setShowDeleteModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmação com senha do admin */}
      <AdminConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Deletar Clínica - Confirmação necessária"
        description="Esta ação é irreversível e removerá todos os dados associados à clínica. Insira sua senha de administrador para confirmar."
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async ({ admin_password, motivo }) => {
          if (!deleteTargetId) return;
          await deleteClinica(deleteTargetId, { admin_password, motivo });
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
      />

      {/* Modal de cadastro */}
      <ModalCadastrotomador
        isOpen={showCadastroModal}
        onClose={() => setShowCadastroModal(false)}
        tipo="clinica"
      />
    </div>
  );
}
`;

const oldContent = fs.readFileSync(filePath, 'utf8');
const oldLines = oldContent.split('\\n').length;
fs.writeFileSync(filePath, newContent, 'utf8');
const newLines = newContent.split('\\n').length;
console.log(\`ClinicasContent.tsx rewritten: \${newLines} lines (was \${oldLines})\`);
`;

fs.writeFileSync(path.join(__dirname, '..', 'components', 'admin', 'ClinicasContent.tsx'), newContent, 'utf8');
const newLines = newContent.split('\n').length;
console.log('ClinicasContent.tsx rewritten: ' + newLines + ' lines (was 753)');
