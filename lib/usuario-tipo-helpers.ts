/**
 * Helper functions para trabalhar com usuario_tipo_enum
 * Data: 29 de janeiro de 2026
 */

export type UsuarioTipo =
  | 'funcionario_clinica'
  | 'funcionario_entidade'
  | 'rh'
  | 'gestor'
  | 'admin'
  | 'emissor';

/**
 * Mapeia usuario_tipo para label amigável em português
 */
export function getUsuarioTipoLabel(tipo: UsuarioTipo): string {
  const labels: Record<UsuarioTipo, string> = {
    funcionario_clinica: 'Funcionário',
    funcionario_entidade: 'Funcionário da Entidade',
    rh: 'Gestor RH',
    gestor: 'Gestor da Entidade',
    admin: 'Administrador',
    emissor: 'Emissor de Laudos',
  };
  return labels[tipo] || tipo;
}

/**
 * Verifica se usuario_tipo é um tipo de funcionário (não gestor/admin)
 */
export function isFuncionario(tipo: UsuarioTipo): boolean {
  return tipo === 'funcionario_clinica' || tipo === 'funcionario_entidade';
}

/**
 * Verifica se usuario_tipo é gestor de entidade
 */
export function isGestorDeEntidade(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor';
}

/**
 * Verifica se usuario_tipo é gestor de clínica (RH)
 */
export function isGestorDeClinica(tipo: UsuarioTipo): boolean {
  return tipo === 'rh';
}

/**
 * Verifica se usuario_tipo é qualquer tipo de gestor (entidade ou clínica)
 * @deprecated Use isGestorDeEntidade() ou isGestorDeClinica() para maior clareza
 */
export function isGestor(tipo: UsuarioTipo): boolean {
  return tipo === 'rh' || tipo === 'gestor';
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
  return tipo === 'rh' || tipo === 'admin';
}

/**
 * Verifica se usuario_tipo pode gerenciar entidade
 */
export function podeGerenciarEntidade(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor' || tipo === 'admin';
}

/**
 * Retorna SQL WHERE clause para filtrar por usuario_tipo
 * NOTA: 'gestor' refere-se ao gestor de entidade, 'rh' é gestor de clínica
 */
export function getSQLWhereUsuarioTipo(
  tipo: 'funcionario' | 'gestor' | 'rh' | 'admin' | 'emissor' | 'all'
): string {
  switch (tipo) {
    case 'funcionario':
      return "usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')";
    case 'gestor':
      return "usuario_tipo = 'gestor'";
    case 'rh':
      return "usuario_tipo = 'rh'";
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
    'rh',
    'gestor',
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
    rh: '👔',
    gestor: '🏢',
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
    rh: 'purple',
    gestor: 'violet',
    admin: 'red',
    emissor: 'green',
  };
  return colors[tipo] || 'gray';
}
