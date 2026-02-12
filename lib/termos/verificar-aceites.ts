import { query } from '@/lib/db';

export interface AceitesStatus {
  termos_uso_aceito: boolean;
  politica_privacidade_aceito: boolean;
  aceito_em_termos?: string;
  aceito_em_politica?: string;
}

/**
 * Verifica se um usuário (RH ou Gestor) já aceitou os termos e política de privacidade
 * @param cpf CPF do usuário
 * @param tipo_usuario Tipo de usuário: 'rh' ou 'gestor'
 * @returns Status dos aceites
 */
export async function verificarAceites(
  cpf: string,
  tipo_usuario: 'rh' | 'gestor'
): Promise<AceitesStatus> {
  const result = await query(
    `SELECT termo_tipo, aceito_em 
     FROM aceites_termos_usuario 
     WHERE usuario_cpf = $1 AND usuario_tipo = $2`,
    [cpf, tipo_usuario]
  );

  const aceites = result.rows;
  const termosUso = aceites.find((a) => a.termo_tipo === 'termos_uso');
  const politicaPrivacidade = aceites.find(
    (a) => a.termo_tipo === 'politica_privacidade'
  );

  return {
    termos_uso_aceito: !!termosUso,
    politica_privacidade_aceito: !!politicaPrivacidade,
    aceito_em_termos: termosUso?.aceito_em,
    aceito_em_politica: politicaPrivacidade?.aceito_em,
  };
}
