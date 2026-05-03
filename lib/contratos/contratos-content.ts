import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Carrega o conteúdo padrão do contrato de prestação de serviços
 * Arquivo: docs/law/CONTRATO_DE_PRESTACAO_DE_SERVICOS__PLATAFORMA_QWORK - v2 - 0204.txt
 */
export async function obterContratopadrao(): Promise<string> {
  try {
    const caminhoContrato = resolve(
      process.cwd(),
      'docs/law/CONTRATO_DE_PRESTACAO_DE_SERVICOS__PLATAFORMA_QWORK - v2 - 0204.txt'
    );

    const conteudo = await readFile(caminhoContrato, 'utf-8');
    return conteudo;
  } catch (error) {
    console.error('Erro ao carregar contrato padrão:', error);
    // Retornar contrato padrão em caso de erro
    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLATAFORMA QWORK

Pelo presente Contrato, a Plataforma QWork compromete-se a prestar serviços de gestão de avaliações de saúde ocupacional, em conformidade com a legislação vigente.

O contratante concorda com os termos e condições estabelecidos neste instrumento.

Data: ${new Date().toLocaleDateString('pt-BR')}`;
  }
}

/**
 * Atualiza o conteúdo de um contrato no banco de dados
 */
export async function atualizarConteudoContrato(
  contratoId: number,
  conteudo: string
): Promise<void> {
  const { query } = await import('@/lib/db');

  await query(
    'UPDATE contratos SET conteudo = $1, atualizado_em = NOW() WHERE id = $2',
    [conteudo, contratoId]
  );
}
