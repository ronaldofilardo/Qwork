import { query } from './lib/db.ts';

async function checkPassword() {
  try {
    const result = await query(
      'SELECT c.nome, c.cnpj, cs.cpf, cs.senha_hash FROM contratantes c JOIN contratantes_senhas cs ON c.id = cs.contratante_id WHERE cs.cpf = $1',
      ['87545772920']
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('Entidade:', row.nome);
      console.log('CNPJ:', row.cnpj);
      console.log('CPF:', row.cpf);
      console.log('Senha armazenada:', row.senha_hash);

      // Extrair senha real do placeholder
      if (row.senha_hash.startsWith('PLACEHOLDER_')) {
        const senhaReal = row.senha_hash.replace('PLACEHOLDER_', '');
        console.log('Senha para login:', senhaReal);
      }
    } else {
      console.log('Gestor não encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkPassword();
