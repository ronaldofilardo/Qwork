import 'dotenv/config';
import { handleAprovarPersonalizado } from '../app/api/admin/novos-cadastros/handlers';

async function run() {
  try {
    const input = {
      acao: 'aprovar_personalizado',
      entidade_id: 32,
      valor_por_funcionario: 10,
      numero_funcionarios: 100,
    } as any;

    const context = {
      session: { cpf: '00000000000', perfil: 'admin', nome: 'Test Admin' },
      request: { headers: { get: (name: string) => undefined } },
    } as any;

    const res = await handleAprovarPersonalizado(input, context);
    console.log('Result:', res);
  } catch (err) {
    console.error('Error running handler:', err);
  }
}

run();
