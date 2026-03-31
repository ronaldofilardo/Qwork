/**
 * Tipos centralizados de sessão — extraído de lib/session.ts
 * Responsabilidade única: definições de tipo para sessão do usuário
 */
import type { PerfilUsuarioType, NivelCargoType } from './enums';

export type { PerfilUsuarioType, NivelCargoType } from './enums';

export interface Session {
  cpf: string;
  nome: string;
  perfil: PerfilUsuarioType;
  nivelCargo?: NivelCargoType;
  // POLÍTICA DE NEGÓCIO - PAPÉIS E PERMISSÕES:
  //
  // 'admin': Gestão da PLATAFORMA (auditorias, volume, emissores, configurações)
  //          → NÃO tem clinica_id/entidade_id operacional
  //          → Acesso a auditorias, cadastros iniciais, volume
  //
  // 'suporte': Gestão FINANCEIRA da plataforma
  //            → Cobrança, parcelas, pagamentos, comissões (liberar/pagar/NF)
  //            → Gerencia clínicas/entidades (ativar/desativar, trocar gestor)
  //            → Novos cadastros, contratos, emissões (gestão de lotes)
  //
  // 'comercial': Gestão de REPRESENTANTES e VENDAS
  //              → Representantes (CRUD, aprovação, ativação status apto)
  //              → Leads (aprovar/rejeitar/converter)
  //              → Comissões (gerar, vincular, aprovar/congelar/descongelar)
  //
  // 'vendedor': VENDAS diretas
  //             → Métricas pessoais de vendas
  //             → Relatórios próprios
  //
  // 'rh': Gestor de CLÍNICA (operações dentro da clínica)
  //       → TEM clinica_id obrigatório
  //       → PODE criar/editar empresas, funcionários, liberar lotes
  //       → Isolamento: apenas recursos da própria clínica
  //
  // 'emissor': Usuário INDEPENDENTE (emissão de laudos)
  //            → NÃO vinculado a clinica_id/empresa_id
  //            → Acessa lotes finalizados de qualquer clínica para emitir laudos
  //
  // 'gestor': Gestor de ENTIDADE (ex.: grande empresa com múltiplas unidades)
  //           → TEM entidade_id obrigatório
  //           → Opera lotes da própria entidade
  clinica_id?: number; // Apenas para perfil 'rh'
  entidade_id?: number; // Apenas para perfil 'gestor'
  tomador_id?: number; // Identification do tomador (entidade ou clínica)
  representante_id?: number; // Apenas para perfil 'representante'
  sessionLogId?: number;
  sessionToken?: string; // Token único para rotação
  mfaVerified?: boolean; // Indica se MFA foi verificado
  lastRotation?: number; // Timestamp da última rotação
  rotationRequired?: boolean; // Indica que a rotação é necessária (persistir via Route Handler/Server Action)
}
