import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/auditoria/auditoria';

interface RegistrarAceiteParams {
  usuario_cpf: string;
  usuario_tipo: 'rh' | 'gestor';
  usuario_entidade_id: number;
  termo_tipo: 'termos_uso' | 'politica_privacidade';
  ip_address?: string;
  user_agent?: string;
  sessao_id?: string;

  // Dados da entidade para redundância
  entidade_cnpj: string;
  entidade_tipo: 'clinica' | 'entidade';
  entidade_nome: string;
  responsavel_nome: string;
}

/**
 * Registra o aceite de um termo de uso ou política de privacidade
 * Salva tanto na tabela de usuário quanto na tabela de entidade (redundância legal)
 * @param params Parâmetros do aceite
 * @returns Resultado do registro
 */
export async function registrarAceite(params: RegistrarAceiteParams) {
  const {
    usuario_cpf,
    usuario_tipo,
    usuario_entidade_id,
    termo_tipo,
    ip_address,
    user_agent,
    sessao_id,
    entidade_cnpj,
    entidade_tipo,
    entidade_nome,
    responsavel_nome,
  } = params;

  // HOTFIX: Verificar se tabelas existem
  try {
    await query(`SELECT 1 FROM aceites_termos_usuario LIMIT 0`);
  } catch (err: any) {
    if (err?.code === '42P01') {
      throw new Error(
        'TABLES_NOT_MIGRATED: As tabelas de aceite de termos ainda não foram criadas. Execute as migrations primeiro.'
      );
    }
    throw err;
  }

  // 1. Registrar aceite individual (idempotente)
  const resultUsuario = await query(
    `INSERT INTO aceites_termos_usuario (
      usuario_cpf, usuario_tipo, usuario_entidade_id, 
      termo_tipo, versao_termo, aceito_em, 
      ip_address, user_agent, sessao_id
    ) VALUES ($1, $2, $3, $4, 1, NOW(), $5, $6, $7)
    ON CONFLICT (usuario_cpf, usuario_tipo, termo_tipo) 
    DO UPDATE SET
      aceito_em = NOW(),
      ip_address = EXCLUDED.ip_address,
      user_agent = EXCLUDED.user_agent,
      sessao_id = EXCLUDED.sessao_id
    RETURNING id, aceito_em`,
    [
      usuario_cpf,
      usuario_tipo,
      usuario_entidade_id,
      termo_tipo,
      ip_address,
      user_agent,
      sessao_id,
    ]
  );

  // 2. Registrar aceite da entidade (redundância legal)
  const resultEntidade = await query(
    `INSERT INTO aceites_termos_entidade (
      entidade_cnpj, entidade_tipo, entidade_id, entidade_nome,
      responsavel_cpf, responsavel_nome, responsavel_tipo,
      termo_tipo, versao_termo, aceito_em, ip_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, NOW(), $9)
    ON CONFLICT (entidade_cnpj, entidade_tipo, termo_tipo)
    DO UPDATE SET
      aceito_em = NOW(),
      responsavel_cpf = EXCLUDED.responsavel_cpf,
      responsavel_nome = EXCLUDED.responsavel_nome,
      ip_address = EXCLUDED.ip_address
    RETURNING id`,
    [
      entidade_cnpj,
      entidade_tipo,
      usuario_entidade_id,
      entidade_nome,
      usuario_cpf,
      responsavel_nome,
      usuario_tipo,
      termo_tipo,
      ip_address,
    ]
  );

  // 3. Auditoria centralizada
  await registrarAuditoria({
    entidade_tipo: 'usuario',
    entidade_id: usuario_entidade_id,
    acao: 'aceitar_termos_privacidade' as any,
    usuario_cpf,
    usuario_perfil: usuario_tipo,
    ip_address,
    user_agent,
    metadados: {
      termo_tipo,
      versao: 1,
      entidade_cnpj,
      sessao_id,
    },
  });

  return {
    success: true,
    usuario_id: resultUsuario.rows[0].id,
    entidade_id: resultEntidade.rows[0].id,
    aceito_em: resultUsuario.rows[0].aceito_em,
  };
}
