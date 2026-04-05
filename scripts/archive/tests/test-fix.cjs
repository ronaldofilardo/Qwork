const { criarContaResponsavel } = require('C:/apps/QWork/lib/db');

async function test() {
  const contratante = {
    id: 39,
    responsavel_cpf: '87545772920',
    responsavel_nome: 'RONALDO FILARDO',
    responsavel_email: 'gestor@teste.com',
    responsavel_celular: '11999999999',
    cnpj: '02494916000170',
  };

  const session = {
    cpf: 'admin@teste.com',
    perfil: 'admin',
    clinica_id: null,
  };

  try {
    console.log('Testando criarContaResponsavel...');
    await criarContaResponsavel(contratante, session);
    console.log('Função executada com sucesso');
  } catch (error) {
    console.error('Erro:', error);
  }
}

test();
