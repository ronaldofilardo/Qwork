const { query, criarContaResponsavel } = require('./lib/db');

async function criarSenha() {
  const tomador = {
    id: 39,
    responsavel_cpf: '87545772920',
    responsavel_nome: 'RONALDO FILARDO',
    responsavel_email: 'gestor@teste.com',
    responsavel_celular: '11999999999',
    cnpj: '02494916000170',
  };

  // Simular session
  const session = {
    cpf: 'admin@teste.com',
    perfil: 'admin',
    clinica_id: null,
  };

  await criarContaResponsavel(tomador, session);
  console.log('Senha criada com sucesso');
}

criarSenha().catch(console.error);
