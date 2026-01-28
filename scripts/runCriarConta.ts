import { criarContaResponsavel } from '../lib/db';

(async () => {
  try {
    const contratante = {
      id: 42,
      tipo: 'clinica',
      cnpj: '02494916000170',
      responsavel_cpf: '04703084945',
      responsavel_nome: 'Tania K Caliari',
      responsavel_email: 'jgsjoiua@tio.com',
      responsavel_celular: '(45) 88582-3699',
    } as any;

    console.log('Chamando criarContaResponsavel com:', contratante);
    await criarContaResponsavel(contratante);
    console.log('criarContaResponsavel finalizado com sucesso');
  } catch (err) {
    console.error('Erro ao executar criarContaResponsavel:', err);
    process.exit(1);
  }
})();
