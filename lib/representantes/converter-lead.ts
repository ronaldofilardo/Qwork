/**
 * Converter lead de cadastro em representante oficial.
 *
 * Executa em transação:
 * 1. Verifica lead com status 'verificado'
 * 2. Insere na tabela representantes (trigger gera código automático)
 * 3. Atualiza lead para status 'convertido' com FK para o representante
 * 4. Retorna dados do novo representante
 */
import { query, transaction, type TransactionClient } from '@/lib/db';
import { gerarTokenConvite, logEmailConvite } from './gerar-convite';
import { verificarCpfEmUso } from '@/lib/cpf-conflict';

export interface ConversaoResult {
  representante_id: number;
  nome: string;
  email: string;
  convite_link: string;
}

/**
 * Converter um lead verificado em representante oficial.
 *
 * @param leadId - UUID do lead na tabela representantes_cadastro_leads
 * @param adminCpf - CPF do admin que está fazendo a conversão
 * @returns Dados do representante criado
 * @throws Error em caso de falha (lead não encontrado, status inválido, duplicata)
 */
export async function converterLeadEmRepresentante(
  leadId: string,
  adminCpf: string,
  baseUrl?: string
): Promise<ConversaoResult> {
  return await transaction(async (client: TransactionClient) => {
    // 1. Buscar lead e travar a linha (FOR UPDATE)
    const leadResult = await client.query(
      `SELECT *
       FROM representantes_cadastro_leads
       WHERE id = $1
       FOR UPDATE`,
      [leadId]
    );

    if (leadResult.rows.length === 0) {
      throw new Error('Lead não encontrado');
    }

    const lead = leadResult.rows[0] as Record<string, unknown>;

    if (lead.status !== 'verificado') {
      throw new Error(
        `Lead não pode ser convertido — status atual: ${String(lead.status)}. Apenas leads verificados podem ser convertidos.`
      );
    }

    if (lead.convertido_em != null) {
      throw new Error('Lead já foi convertido anteriormente');
    }

    // 2. Verificar se já existe representante com mesmo email/cpf/cnpj
    const tipoPessoa = String(lead.tipo_pessoa);
    const email = String(lead.email);

    const emailCheck = await client.query(
      `SELECT id FROM representantes WHERE email = $1`,
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw new Error(`Já existe representante com o e-mail ${email}`);
    }

    if (tipoPessoa === 'pf' && lead.cpf) {
      // Verificar CPF cross-table (funcionarios, usuarios, representantes, senhas)
      const cpfConflicts = await verificarCpfEmUso(String(lead.cpf), client);
      if (cpfConflicts.length > 0) {
        const first = cpfConflicts[0];
        throw new Error(
          `CPF já cadastrado como ${first.tipo_usuario} em ${first.origem}`
        );
      }
    }

    if (tipoPessoa === 'pj' && lead.cnpj) {
      const cnpjCheck = await client.query(
        `SELECT id FROM representantes WHERE cnpj = $1`,
        [lead.cnpj]
      );
      if (cnpjCheck.rows.length > 0) {
        throw new Error('Já existe representante com este CNPJ');
      }
    }

    // 3. Inserir representante (trigger gera código automaticamente)
    // Status 'aguardando_senha': representante deve criar sua senha via link de convite
    // gestor_comercial_cpf = adminCpf (CPF do comercial que converteu o lead)
    const insertResult = await client.query<{
      id: number;
      nome: string;
      email: string;
    }>(
      `INSERT INTO representantes (
        tipo_pessoa, nome, email, telefone,
        cpf, cnpj, cpf_responsavel_pj,
        asaas_wallet_id,
        gestor_comercial_cpf,
        status, aprovado_em, aprovado_por_cpf
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8,
        $9,
        'aguardando_senha', NOW(), $10
      ) RETURNING id, nome, email`,
      [
        tipoPessoa,
        lead.nome,
        lead.email,
        lead.telefone,
        lead.cpf ?? null,
        lead.cnpj ?? null,
        lead.cpf_responsavel ?? null,
        lead.asaas_wallet_id ?? null,
        adminCpf,
        adminCpf,
      ]
    );

    const rep = insertResult.rows[0];

    // 4. Gerar token de convite para criação de senha
    const convite = await gerarTokenConvite(rep.id, client, baseUrl);
    logEmailConvite(rep.nome, rep.email, convite.link, convite.expira_em);

    // 5. Atualizar lead para 'convertido'
    await client.query(
      `UPDATE representantes_cadastro_leads
       SET status = 'convertido',
           convertido_em = NOW(),
           representante_id = $2,
           verificado_por = $3
       WHERE id = $1`,
      [leadId, rep.id, adminCpf]
    );

    console.log(
      `[CONVERSAO] Lead ${leadId} convertido em representante ${rep.id} por admin ${adminCpf}`
    );
    console.log(
      `[CONVERSAO] Convite enviado para ${rep.email} — token expira em ${convite.expira_em.toISOString()}`
    );

    return {
      representante_id: rep.id,
      nome: rep.nome,
      email: rep.email,
      convite_link: convite.link,
    };
  });
}

/**
 * Contar leads pendentes de verificação (para badge do admin)
 */
export async function contarLeadsPendentes(): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM representantes_cadastro_leads WHERE status = 'pendente_verificacao'`
  );
  return parseInt(result.rows[0]?.total ?? '0', 10);
}
