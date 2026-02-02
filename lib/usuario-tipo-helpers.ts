/**
 * Helper functions para trabalhar com usuario_tipo_enum
 * Data: 29 de janeiro de 2026
 */

export type UsuarioTipo =
  | 'funcionario_clinica'
  | 'funcionario_entidade'
  | 'gestor_rh'
  | 'gestor_entidade'
  | 'admin'
  | 'emissor';

/**
 * Mapeia usuario_tipo para label amigável em português
 */
export function getUsuarioTipoLabel(tipo: UsuarioTipo): string {
  const labels: Record<UsuarioTipo, string> = {
    funcionario_clinica: 'Funcionário',
    funcionario_entidade: 'Funcionário da Entidade',
    gestor_rh: 'Gestor RH',
    gestor_entidade: 'Gestor da Entidade',
    admin: 'Administrador',
    emissor: 'Emissor de Laudos',
  };
  return labels[tipo] || tipo;
}

/**
 * Mapeia perfil (antigo) para usuario_tipo (novo)
 * @deprecated Usar apenas para migração de código legado
 */
export function mapPerfilToUsuarioTipo(perfil: string): UsuarioTipo | null {
  const map: Record<string, UsuarioTipo> = {
    funcionario: 'funcionario_clinica', // Default para funcionarios
    rh: 'gestor_rh',
    gestor_entidade: 'gestor_entidade',
    admin: 'admin',
    emissor: 'emissor',
  };
  return map[perfil] || null;
}

/**
 * Mapeia usuario_tipo para perfil (antigo)
 * @deprecated Usar apenas para compatibilidade temporária
 */
export function mapUsuarioTipoToPerfil(usuarioTipo: UsuarioTipo): string {
  const map: Record<UsuarioTipo, string> = {
    funcionario_clinica: 'funcionario',
    funcionario_entidade: 'funcionario',
    gestor_rh: 'rh',
    gestor_entidade: 'gestor_entidade',
    admin: 'admin',
    emissor: 'emissor',
  };
  return map[usuarioTipo] || usuarioTipo;
}

/**
 * Verifica se usuario_tipo é um tipo de funcionário (não gestor/admin)
 */
export function isFuncionario(tipo: UsuarioTipo): boolean {
  return tipo === 'funcionario_clinica' || tipo === 'funcionario_entidade';
}

/**
 * Verifica se usuario_tipo é um tipo de gestor
 */
export function isGestor(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor_rh' || tipo === 'gestor_entidade';
}

/**
 * Verifica se usuario_tipo tem permissões administrativas
 */
export function isAdmin(tipo: UsuarioTipo): boolean {
  return tipo === 'admin';
}

/**
 * Verifica se usuario_tipo pode emitir laudos
 */
export function isEmissor(tipo: UsuarioTipo): boolean {
  return tipo === 'emissor';
}

/**
 * Verifica se usuario_tipo pode gerenciar clínica
 */
export function podeGerenciarClinica(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor_rh' || tipo === 'admin';
}

/**
 * Verifica se usuario_tipo pode gerenciar entidade
 */
export function podeGerenciarEntidade(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor_entidade' || tipo === 'admin';
}

/**
 * Retorna SQL WHERE clause para filtrar por usuario_tipo
 */
export function getSQLWhereUsuarioTipo(
  tipo: 'funcionario' | 'gestor' | 'all'
): string {
  switch (tipo) {
    case 'funcionario':
      return "usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')";
    case 'gestor':
      return "usuario_tipo IN ('gestor_rh', 'gestor_entidade')";
    case 'all':
      return 'usuario_tipo IS NOT NULL';
    default:
      return 'usuario_tipo IS NOT NULL';
  }
}

/**
 * Valida se string é um usuario_tipo válido
 */
export function isValidUsuarioTipo(tipo: string): tipo is UsuarioTipo {
  const validTypes: UsuarioTipo[] = [
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor_rh',
    'gestor_entidade',
    'admin',
    'emissor',
  ];
  return validTypes.includes(tipo as UsuarioTipo);
}

/**
 * Retorna ícone apropriado para usuario_tipo (para UI)
 */
export function getUsuarioTipoIcon(tipo: UsuarioTipo): string {
  const icons: Record<UsuarioTipo, string> = {
    funcionario_clinica: '👤',
    funcionario_entidade: '👥',
    gestor_rh: '👔',
    gestor_entidade: '🏢',
    admin: '⚙️',
    emissor: '📋',
  };
  return icons[tipo] || '❓';
}

/**
 * Retorna cor apropriada para usuario_tipo (para badges/tags)
 */
export function getUsuarioTipoColor(tipo: UsuarioTipo): string {
  const colors: Record<UsuarioTipo, string> = {
    funcionario_clinica: 'blue',
    funcionario_entidade: 'cyan',
    gestor_rh: 'purple',
    gestor_entidade: 'violet',
    admin: 'red',
    emissor: 'green',
  };
  return colors[tipo] || 'gray';
}
