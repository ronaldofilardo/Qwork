/* Debug helper — simulate the 'reprocessamento manual' test outside Jest to inspect call sequence
   Usage: node scripts/debug-emissao-reprocess.cjs
*/
const path = require('path');
const fs = require('fs/promises');
(async () => {
  process.env.NODE_ENV = 'test';
  // Ensure storage file exists
  const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
  await fs.mkdir(laudosDir, { recursive: true });
  const pdfPath = path.join(laudosDir, 'laudo-500.pdf');
  const metaPath = path.join(laudosDir, 'laudo-500.json');
  await fs.writeFile(pdfPath, Buffer.from('fake-pdf-content'));
  await fs.writeFile(metaPath, JSON.stringify({ arquivo: 'laudo-500.pdf' }));

  // Load the module and monkeypatch query
  const laudoAuto = require('../lib/laudo-auto');
  const db = require('../lib/db');

  const responses = [
    { rows: [], rowCount: 1 }, // manual UPDATE emitido_em = NULL (consumed by test)
    { rows: [{ cpf: '123', nome: 'Emissor' }], rowCount: 1 }, // validarEmissorUnico
    { rows: [{ id: 1, emitido_em: null }], rowCount: 1 }, // buscar lote
    { rows: [{ id: 500 }], rowCount: 1 }, // selecionar/insert laudo or laudo existing
    { rows: [{ empresaAvaliada: 'Teste' }], rowCount: 1 }, // dados gerais
    { rows: [{ dominio: 'Test', media: 50 }], rowCount: 1 }, // scores
    { rows: [], rowCount: 1 }, // update laudo
    { rows: [], rowCount: 1 }, // update lote
    { rows: [], rowCount: 1 }, // auditoria
  ];

  let callIndex = 0;
  const originalQuery = db.query;
  db.query = async function mockQuery(sql, params) {
    console.log(
      '[MOCK QUERY] call',
      callIndex + 1,
      'SQL:',
      typeof sql === 'string' ? sql.split('\n')[0] : sql,
      'params:',
      params
    );
    const resp = responses[callIndex++];
    if (resp === undefined) {
      console.log('[MOCK QUERY] no predefined response — throwing');
      throw new Error('No mock response');
    }
    return resp;
  };

  try {
    // Simulate the manual UPDATE consumed before reprocess
    await db.query(
      'UPDATE lotes_avaliacao SET emitido_em = NULL WHERE id = $1',
      [1]
    );
    const resultado = await laudoAuto.emitirLaudoImediato(1);
    console.log('emitirLaudoImediato returned ->', resultado);
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    db.query = originalQuery;
  }
})();
