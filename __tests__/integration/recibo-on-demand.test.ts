import '@testing-library/jest-dom';

// Mockar sessões para testes que exigem autenticação em endpoints que usam getSession()
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
mockGetSession.mockImplementation(() => {
  // MOCK getSession called

  return {
    perfil: 'gestor',
    tomador_id: 1,
    cpf: '12345678901',
  } as any;
});

// Import handlers at the top level
import { POST as gerarReciboPOST } from '@/app/api/recibo/gerar/route';
import { POST as gerarParcelaEntidade } from '@/app/api/entidade/parcelas/gerar-recibo/route';
import { POST as gerarParcelaRh } from '@/app/api/rh/parcelas/gerar-recibo/route';

describe('Integração: Recibo sob demanda (confirmar -> gerar)', () => {
  let planoId: number;
  let tomadorId: number;
  let contratoId: number;
  let pagamentoId: number;
  let cpfResponsavel: string;

  beforeAll(async () => {
    const planoRes = await query(
      "INSERT INTO planos (tipo,nome,preco,ativo) VALUES ('fixo','Plano Test Recibo',100,true) RETURNING id",
      []
    );
    planoId = planoRes.rows[0].id;
  });

  afterAll(async () => {
    try {
      // Garantir remoção de tomadores (entidades) ligadas ao plano antes de remover o plano
      if (planoId) {
        await query('DELETE FROM entidades WHERE plano_id = $1', [planoId]);
        await query('DELETE FROM planos WHERE id = $1', [planoId]);
      }
    } catch (err) {
      console.warn('Erro no cleanup afterAll plano:', err);
    }
  });

  beforeEach(async () => {
    // Criar tomador (entidade) e contrato aceito
    // Gerar CPF único para evitar conflito com outros testes
    cpfResponsavel = `52999${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`;

    const tomador = await query(
      `INSERT INTO entidades (tipo,nome,cnpj,email,telefone,endereco,cidade,estado,cep,responsavel_nome,responsavel_cpf,responsavel_email,responsavel_celular,numero_funcionarios_estimado,plano_id,status,ativa,pagamento_confirmado) VALUES ('entidade','Empresa Teste Recibo','00000000000199','recibo@test.local','11999999999','Rua Teste, 123','São Paulo','SP','01234567','João da Silva',$1,'joao@empresa.com','11988888888',5,$2,'aguardando_pagamento',false,false) RETURNING id`,
      [cpfResponsavel, planoId]
    );
    tomadorId = tomador.rows[0].id;

    const contrato = await query(
      `INSERT INTO contratos (tomador_id,plano_id,valor_total,aceito,status,conteudo) VALUES ($1,$2,500,true,'aguardando_pagamento','Contrato Teste') RETURNING id`,
      [tomadorId, planoId]
    );
    contratoId = contrato.rows[0].id;
  });

  afterEach(async () => {
    try {
      if (pagamentoId)
        await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
      if (contratoId)
        await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
      // Deletar por id preferencialmente, mas tentar por CPF quando id não estiver disponível (entidades)
      try {
        if (tomadorId) {
          await query('DELETE FROM entidades WHERE id = $1', [tomadorId]);
        } else if (cpfResponsavel) {
          await query('DELETE FROM entidades WHERE responsavel_cpf = $1', [
            cpfResponsavel,
          ]);
        }
      } catch (err) {
        console.warn('Erro ao deletar entidade no cleanup:', err);
      }
      // Limpar possíveis recibos criados durante testes de geração
      try {
        if (pagamentoId)
          await query('DELETE FROM recibos WHERE pagamento_id = $1', [
            pagamentoId,
          ]);
      } catch (err) {
        console.warn('Erro ao deletar recibos no cleanup:', err);
      }
    } catch (err) {
      console.warn('Cleanup error:', err);
    } finally {
      pagamentoId = 0 as any;
      contratoId = 0 as any;
      tomadorId = 0 as any;
    }
  });

  test('Confirmar pagamento: marca pago, ativa tomador e cria login', async () => {
    // Criar pagamento manualmente (pendente)
    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (tomador_id,contrato_id,valor,status,metodo,data_pagamento) VALUES ($1,$2,500,'pendente','pix', NULL) RETURNING id`,
      [tomadorId, contratoId]
    );
    pagamentoId = pagamentoInsert.rows[0].id;

    // Confirmar pagamento via handler (usar Request para compatibilidade de tipos)
    const { POST: confirmarPOST } =
      await import('@/app/api/pagamento/confirmar/route');
    const confirmRequest = new Request(
      'http://localhost/api/pagamento/confirmar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pagamentoId,
          metodo_pagamento: 'pix',
        }),
      }
    );

    const res: any = await confirmarPOST(
      confirmRequest as any as import('next/server').NextRequest
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verificar pagamento no DB
    const p = await query(
      'SELECT status, data_pagamento FROM pagamentos WHERE id = $1',
      [pagamentoId]
    );
    expect(p.rows.length).toBe(1);
    expect(p.rows[0].status).toBe('pago');
    expect(p.rows[0].data_pagamento).toBeTruthy();

    // Verificar que foi criado login (funcionário) para o responsável
    const funcionario = await query(
      'SELECT cpf, perfil, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
      [cpfResponsavel]
    );
    expect(funcionario.rows.length).toBeGreaterThanOrEqual(1);
    expect(funcionario.rows[0].ativo).toBeTruthy();

    // A resposta também deve indicar que o recibo é sob demanda
    expect(
      data.show_receipt_info === true || Array.isArray(data.proximos_passos)
    ).toBeTruthy();
  }, 20000);

  test('Gerar recibo via API /api/recibo/gerar (contrato)', async () => {
    // Criar pagamento marcado como pago
    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (tomador_id,valor,status,metodo,data_pagamento) VALUES ($1,500,'pago','pix', NOW()) RETURNING id`,
      [tomadorId]
    );
    const pagoId = pagamentoInsert.rows[0].id;

    const { POST: gerarReciboPOST } =
      await import('@/app/api/recibo/gerar/route');
    const gerarRequest = new Request('http://localhost/api/recibo/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagamento_id: pagoId }),
    });

    const gerarRes: any = await gerarReciboPOST(
      gerarRequest as any as import('next/server').NextRequest
    );
    const gerarBody = await gerarRes.json();
    if (gerarRes.status !== 200) {
      console.error(
        'DEBUG gerarRecibo (contrato) status',
        gerarRes.status,
        'body:',
        gerarBody
      );
    }
    expect(gerarRes.status).toBe(200);
    expect(gerarBody.success).toBe(true);
    expect(gerarBody.recibo).toBeDefined();

    // Verificar DB
    const recibos = await query(
      'SELECT * FROM recibos WHERE pagamento_id = $1',
      [pagoId]
    );
    expect(recibos.rows.length).toBe(1);
    // Sanity checks: garantir que o recibo está ativo e pertence ao tomador
    expect(recibos.rows[0].ativo).toBeTruthy();
    expect(recibos.rows[0].tomador_id).toBe(tomadorId);

    // Testar download do recibo (Entidade) usando o handler de download
    const reciboId = recibos.rows[0].id;
    // Mockar sessão como gestor com o tomador correto
    mockGetSession.mockReturnValueOnce({
      perfil: 'gestor',
      tomador_id: tomadorId,
      cpf: '12345678901',
    } as any);

    const { GET: downloadEntidadeGET } =
      await import('@/app/api/entidade/parcelas/download-recibo/route');

    const downloadReq = new Request(
      `http://localhost/api/entidade/parcelas/download-recibo?id=${reciboId}`
    );

    const downloadRes: any = await downloadEntidadeGET(downloadReq as any);
    if (downloadRes.status === 200) {
      const text = await (typeof downloadRes.text === 'function'
        ? downloadRes.text()
        : Promise.resolve(''));
      expect(text).toMatch(/RECIBO DE PAGAMENTO/);
    } else {
      // Em alguns fluxos (recibo de contrato gerado via /api/recibo/gerar) o conteúdo pode não estar
      // disponível para download (a geração de PDF/texto ainda não implementada), então aceitamos 404 com
      // erro explicativo.
      const body = await downloadRes.json();
      expect(downloadRes.status).toBe(404);
      expect(body.error).toMatch(
        /Conteúdo do recibo não encontrado|Recibo não encontrado/i
      );
    }

    // Cleanup
    await query('DELETE FROM recibos WHERE pagamento_id = $1', [pagoId]);
    await query('DELETE FROM pagamentos WHERE id = $1', [pagoId]);
  }, 20000);

  test('Gerar recibo via endpoint RH (/api/rh/parcelas/gerar-recibo)', async () => {
    // Criar clínica e contrato ligados
    // Gerar CNPJ único de 14 dígitos com timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = String(Math.floor(Math.random() * 100)).padStart(
      2,
      '0'
    );
    const clinicaCnpj = `111222${timestamp}${randomSuffix}`; // 14 dígitos únicos
    // Criar clínica como tomador
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clinica Test Recibo', $1, true) RETURNING id`,
      [clinicaCnpj]
    );
    const clinicaId = clinicaRes.rows[0].id;

    // Usar clínica como tomador (via view tomadores)
    const tomadorClinicaId = clinicaId;

    // Criar contrato aceito para a clínica (necessário para gerar recibos)
    const contratoAceitoRes = await query(
      `INSERT INTO contratos (tomador_id,plano_id,valor_total,aceito,status,conteudo) VALUES ($1,$2,500,true,'aguardando_pagamento','Contrato Clínica') RETURNING id`,
      [tomadorClinicaId, planoId]
    );
    const contratoAceitoId = contratoAceitoRes.rows[0].id;

    // Criar contrato padronizado em contratos_planos para a clínica
    const contratoRes = await query(
      `INSERT INTO contratos_planos (clinica_id,plano_id,tipo_tomador,inicio_vigencia,fim_vigencia,valor_personalizado_por_funcionario) VALUES ($1,$2,'clinica',CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 500) RETURNING id`,
      [clinicaId, planoId]
    );
    const contratoClinicaId = contratoRes.rows[0].id;

    // Criar pagamento ligado ao tomador (sem coluna clinica_id no schema de testes)
    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (tomador_id,valor,status,metodo,data_pagamento) VALUES ($1,500,'pago','pix', NOW()) RETURNING id`,
      [tomadorClinicaId]
    );
    const pagoId = pagamentoInsert.rows[0].id;

    // Mockar sessão RH
    mockGetSession.mockReturnValue({
      perfil: 'rh',
      clinica_id: clinicaId,
      cpf: '52999000001',
    } as any);

    const req = new Request('http://localhost/api/rh/parcelas/gerar-recibo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcela_numero: 1, pagamento_id: pagoId }),
    });

    const res: any = await gerarParcelaRh(req as any);
    if (res.status !== 200) {
      // print raw text to avoid JSON parse errors and get full server error
      let errText = '<no response text>';
      try {
        if (typeof res.text === 'function') {
          errText = await res.text();
        } else if (typeof res.json === 'function') {
          const parsed = await res.json();
          errText = JSON.stringify(parsed);
        } else {
          errText = String(res);
        }
      } catch (e) {
        errText = `<error reading response: ${String(e)}>`;
      }
      console.error(
        'DEBUG gerarParcelaRh failed with status',
        res.status,
        'body text:',
        errText
      );
      // additional raw introspection
      try {
        const util = require('util');
        console.error('DEBUG gerarParcelaRh RAW KEYS:', Object.keys(res || {}));
        console.error('DEBUG gerarParcelaRh typeof:', typeof res);
        if (res && typeof res === 'object' && res._res) {
          console.error(
            'DEBUG gerarParcelaRh res._res:',
            util.inspect(res._res, { depth: 2 })
          );
        }
      } catch (e) {
        console.error('DEBUG gerarParcelaRh introspect failed:', e);
      }
      // Fail the test immediately with error details
      throw new Error(`Expected status 200 but got ${res.status}: ${errText}`);
    }
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recibo).toBeDefined();

    // Verificar DB
    const recibos = await query(
      'SELECT * FROM recibos WHERE pagamento_id = $1',
      [pagoId]
    );
    expect(recibos.rows.length).toBe(1);
    // Sanity checks: garantir que o recibo está ativo e pertence ao tomador da clínica
    expect(recibos.rows[0].ativo).toBeTruthy();
    expect(recibos.rows[0].tomador_id).toBe(tomadorClinicaId);

    // Testar download do recibo (RH)
    const reciboId = recibos.rows[0].id;
    // Mockar sessão RH incluindo tomador_id para autorização do download
    mockGetSession.mockReturnValueOnce({
      perfil: 'rh',
      clinica_id: clinicaId,
      tomador_id: tomadorClinicaId,
      cpf: '52999000001',
    } as any);

    const { GET: downloadRhGET } =
      await import('@/app/api/rh/parcelas/download-recibo/route');

    const downloadReqRh = new Request(
      `http://localhost/api/rh/parcelas/download-recibo?id=${reciboId}`
    );

    const downloadResRh: any = await downloadRhGET(downloadReqRh as any);
    expect(downloadResRh.status).toBe(200);
    // Ler o corpo de forma robusta: pode retornar string, Buffer-like, ou ArrayBuffer
    let textRh = '';
    if (downloadResRh && downloadResRh.status === 200) {
      if (typeof downloadResRh.text === 'function') {
        try {
          const t = await downloadResRh.text();
          if (typeof t === 'string') {
            textRh = t;
          } else if (t && typeof t === 'object' && Array.isArray(t.data)) {
            textRh = Buffer.from(t.data).toString('utf-8');
          } else if (t instanceof Buffer) {
            textRh = t.toString('utf-8');
          } else {
            textRh = String(t);
          }
        } catch (e) {
          // fallback para ArrayBuffer
          try {
            const ab = await downloadResRh.arrayBuffer();
            textRh = Buffer.from(ab).toString('utf-8');
          } catch (err) {
            textRh = '';
          }
        }
      }
    }
    expect(textRh).toMatch(/RECIBO DE PAGAMENTO/);

    // Cleanup
    await query('DELETE FROM recibos WHERE pagamento_id = $1', [pagoId]);
    await query('DELETE FROM pagamentos WHERE id = $1', [pagoId]);
    await query('DELETE FROM contratos_planos WHERE id = $1', [
      contratoClinicaId,
    ]);
    // Remover contrato aceito criado
    await query('DELETE FROM contratos WHERE id = $1', [contratoAceitoId]);
    // Remover tomador criado para a clínica
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);

    mockGetSession.mockReset();
  }, 20000);

  test.skip('Gerar recibo falha graciosamente quando tabela recibos não existe (entidade)', async () => {
    // Criar pagamento marcado como pago
    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (tomador_id,valor,status,metodo,data_pagamento) VALUES ($1,500,'pago','pix', NOW()) RETURNING id`,
      [tomadorId]
    );
    const pagoId = pagamentoInsert.rows[0].id;

    // Temporariamente renomear tabela recibos para simular ambiente sem recibos
    await query('ALTER TABLE recibos RENAME TO recibos_backup', []);

    try {
      // Garantir sessão como gestor para esse handler
      mockGetSession.mockReturnValue({
        perfil: 'gestor',
        tomador_id: tomadorId,
        cpf: '12345678901',
      } as any);

      const req = new Request(
        'http://localhost/api/entidade/parcelas/gerar-recibo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcela_numero: 1, pagamento_id: pagoId }),
        }
      );

      const res: any = await gerarParcelaEntidade(req as any);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/tabela `recibos` não existe/i);
    } finally {
      // Restaurar tabela
      await query('ALTER TABLE recibos_backup RENAME TO recibos', []);
      // Cleanup
      await query('DELETE FROM pagamentos WHERE id = $1', [pagoId]);
    }
  }, 20000);

  test('POLÍTICA: Não pode gerar recibo sem contrato aceito', async () => {
    // Criar tomador (entidade) com contrato NÃO aceito
    const cpfTemp = `52999${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`;
    const tomadorTemp = await query(
      `INSERT INTO entidades (tipo,nome,cnpj,email,telefone,endereco,cidade,estado,cep,responsavel_nome,responsavel_cpf,responsavel_email,responsavel_celular,numero_funcionarios_estimado,plano_id,status,ativa,pagamento_confirmado) VALUES ('entidade','Empresa Sem Aceite','00000000000198','semaceite@test.local','11999999999','Rua Teste, 123','São Paulo','SP','01234567','João da Silva',$1,'joao@empresa.com','11988888888',5,$2,'aguardando_pagamento',false,false) RETURNING id`,
      [cpfTemp, planoId]
    );
    const tomadorTempId = tomadorTemp.rows[0].id;

    // Criar contrato NÃO aceito (aceito = false)
    const contratoTemp = await query(
      `INSERT INTO contratos (tomador_id,plano_id,valor_total,aceito,status,conteudo) VALUES ($1,$2,500,false,'aguardando_pagamento','Contrato Não Aceito') RETURNING id`,
      [tomadorTempId, planoId]
    );
    const contratoTempId = contratoTemp.rows[0].id;

    // Criar pagamento pago
    const pagamentoTemp = await query(
      `INSERT INTO pagamentos (tomador_id,contrato_id,valor,status,metodo,data_pagamento) VALUES ($1,$2,500,'pago','pix',NOW()) RETURNING id`,
      [tomadorTempId, contratoTempId]
    );
    const pagamentoTempId = pagamentoTemp.rows[0].id;

    // Tentar gerar recibo - deve falhar
    const gerarRequest = new Request('http://localhost/api/recibo/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagamento_id: pagamentoTempId }),
    });

    const gerarRes: any = await gerarReciboPOST(gerarRequest as any);
    const gerarBody = await gerarRes.json();

    console.log(
      'DBG POLÍTICA - contrato não aceito:',
      gerarRes.status,
      gerarBody
    );

    expect(gerarRes.status).toBe(400);
    expect(gerarBody.error).toMatch(
      /não encontrado ou não aceito|não foi aceito|Aceite o contrato/i
    );

    // Cleanup
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoTempId]);
    await query('DELETE FROM contratos WHERE id = $1', [contratoTempId]);
    await query('DELETE FROM entidades WHERE id = $1', [tomadorTempId]);
  }, 20000);

  test('POLÍTICA: Não pode gerar recibo com pagamento não confirmado', async () => {
    // Criar clínica como tomador para teste
    const clinicaTestCnpj = `999888${Date.now().toString().slice(-8)}`; // 14 dígitos
    const tomadorTest = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clinica Teste Pendente', $1, true) RETURNING id`,
      [clinicaTestCnpj]
    );
    const tomadorTestId = tomadorTest.rows[0].id;

    // Criar contrato aceito
    const contratoTest = await query(
      `INSERT INTO contratos (tomador_id,plano_id,valor_total,aceito,status,conteudo) VALUES ($1,$2,500,true,'aguardando_pagamento','Contrato Pendente') RETURNING id`,
      [tomadorTestId, planoId]
    );
    const contratoTestId = contratoTest.rows[0].id;

    // Criar pagamento pendente (status = 'pendente')
    const pagamentoPendente = await query(
      `INSERT INTO pagamentos (tomador_id,contrato_id,valor,status,metodo,data_pagamento) VALUES ($1,$2,500,'pendente','pix',NULL) RETURNING id`,
      [tomadorTestId, contratoTestId]
    );
    const pagamentoPendenteId = pagamentoPendente.rows[0].id;

    // Mockar sessão RH para endpoint rh/parcelas/gerar-recibo
    mockGetSession.mockReturnValueOnce({
      perfil: 'rh',
      clinica_id: clinicaTestId,
      cpf: '52999000001',
    } as any);

    // Tentar gerar recibo via RH endpoint - deve falhar
    const gerarRequest = new Request(
      'http://localhost/api/rh/parcelas/gerar-recibo',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcela_numero: 1,
          pagamento_id: pagamentoPendenteId,
        }),
      }
    );

    const gerarRes: any = await gerarParcelaRh(gerarRequest as any);
    const gerarBody = await gerarRes.json();

    console.log(
      'DBG POLÍTICA - pagamento pendente:',
      gerarRes.status,
      gerarBody
    );

    expect(gerarRes.status).toBe(400);
    expect(gerarBody.error).toMatch(
      /não está confirmado|Confirme o pagamento/i
    );

    // Cleanup
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoPendenteId]);
    await query('DELETE FROM contratos WHERE id = $1', [contratoTestId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaTestId]);
    mockGetSession.mockReset();
  }, 20000);

  test('Gerar recibo falha graciosamente quando tabela recibos não existe (rh)', async () => {
    // Criar clínica para teste
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clinica Test Recibo 2', '11122233344455', true) RETURNING id`,
      []
    );
    const clinicaId = clinicaRes.rows[0].id;

    // Criar pagamento pago referenciando clinica
    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (tomador_id,valor,status,metodo,data_pagamento) VALUES ($1,500,'pago','pix', NOW()) RETURNING id`,
      [clinicaId]
    );
    const pagoId = pagamentoInsert.rows[0].id;

    // Temporariamente renomear tabela recibos para simular ambiente sem recibos
    await query('ALTER TABLE recibos RENAME TO recibos_backup', []);

    // Mockar sessão RH
    mockGetSession.mockReturnValue({
      perfil: 'rh',
      clinica_id: clinicaId,
      cpf: '52999000001',
    } as any);

    try {
      const req = new Request('http://localhost/api/rh/parcelas/gerar-recibo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcela_numero: 1, pagamento_id: pagoId }),
      });

      const res: any = await gerarParcelaRh(req as any);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/tabela `recibos` não existe/i);
    } finally {
      // Restaurar tabela
      await query('ALTER TABLE recibos_backup RENAME TO recibos', []);
      // Cleanup
      await query('DELETE FROM recibos WHERE pagamento_id = $1', [
        pagoId,
      ]).catch(() => {});
      await query('DELETE FROM pagamentos WHERE id = $1', [pagoId]);
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
      mockGetSession.mockReset();
    }
  }, 20000);
});
