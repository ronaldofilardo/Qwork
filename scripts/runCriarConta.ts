import { criarContaResponsavel } from '../lib/db';

(async () => {
  try {
    const id = parseInt(process.argv[2], 10);
    const cnpj = process.argv[3];

    if (!id || !cnpj) {
      console.error('Uso: node runCriarConta.ts <tomadorID> <CNPJ>');
      process.exit(1);
    }

    // Buscar dados do tomador do banco
    const { query } = await import('../lib/db');
    const result = await query(
      'SELECT id, tipo, cnpj, responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular FROM tomadors WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      console.error(`tomador com ID ${id} não encontrado`);
      process.exit(1);
    }

    const tomador = result.rows[0] as any;

    console.log('Chamando criarContaResponsavel com:', tomador);
    await criarContaResponsavel(tomador);
    console.log('criarContaResponsavel finalizado com sucesso');
  } catch (err) {
    console.error('Erro ao executar criarContaResponsavel:', err);
    process.exit(1);
  }
})();
