import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const { POST } = await import('../app/api/cadastro/tomadores/route');

    // Minimal FormData-like mock: only .get used by handler
    const samplePath = path.join(
      process.cwd(),
      'scripts',
      'fixtures',
      'sample.txt'
    );
    const buf = fs.readFileSync(samplePath);

    const makeFile = (
      buffer,
      name = 'sample.pdf',
      type = 'application/pdf'
    ) => {
      return {
        name,
        type,
        size: buffer.length,
        arrayBuffer: async () =>
          buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          ),
      };
    };

    const fileObj = makeFile(buf);

    const formData = {
      get: (key) => {
        const map = {
          tipo: 'entidade',
          nome: 'RLGR Debug Multipart',
          cnpj: '41.877.277/0001-84',
          email: 'debug@example.com',
          telefone: '(41) 99241-5220',
          endereco: 'Rua Exemplo, 100',
          cidade: 'Curitiba',
          estado: 'PR',
          cep: '80000-000',
          plano_id: '5',
          numero_funcionarios_estimado: '100',

          responsavel_nome: 'RONALDO DEBUG',
          responsavel_cpf: '87545772920',
          responsavel_cargo: 'Gestor',
          responsavel_email: 'ronaldodebug@example.com',
          responsavel_celular: '(41) 59886-6655',

          cartao_cnpj: fileObj,
          contrato_social: fileObj,
          doc_identificacao: fileObj,
        };
        return map[key] ?? null;
      },
    };

    const mockReq = {
      formData: async () => formData,
      headers: {
        get: (name) => '127.0.0.1',
      },
    };

    console.log('Chamando POST handler diretamente...');
    const res = await POST(mockReq);
    try {
      const json = await res.json();
      console.log('Resposta status:', res.status);
      console.log('Body:', json);
    } catch (e) {
      console.error('Falha ao converter resposta em JSON:', e);
    }
  } catch (err) {
    console.error('Erro ao executar debug_post_cadastro:', err);
  }
}

main();
