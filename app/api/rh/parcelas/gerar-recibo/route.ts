import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { createHash } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rh/parcelas/gerar-recibo
 * Gera recibo para uma parcela específica (sob demanda)
 */
export async function POST(request: Request) {
  console.log('[HANDLER rh] POST invoked at', new Date().toISOString());
  try {
    console.log('[HANDLER rh] Getting session...');
    const session = getSession();
    console.log('[HANDLER rh] Session:', session ? 'found' : 'null');
    if (!session || session.perfil !== 'rh') {
      console.log('[HANDLER rh] Unauthorized: session perfil', session?.perfil);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const clinicaId = session.clinica_id;
    console.log('[HANDLER rh] Clinica ID:', clinicaId);
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 400 }
      );
    }

    console.log('[HANDLER rh] Reading request body...');
    const body = await request.json();
    console.log('[HANDLER rh] Body:', body);
    const { parcela_numero, pagamento_id } = body;

    if (!parcela_numero || !pagamento_id) {
      return NextResponse.json(
        { error: 'parcela_numero e pagamento_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a tabela 'recibos' existe antes de qualquer operação relacionada
    const recibosColsCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recibos' AND table_schema = 'public'
      LIMIT 1
    `;
    const recibosColsCheck = await query(recibosColsCheckQuery, []);
    if (!recibosColsCheck || recibosColsCheck.rows.length === 0) {
      console.warn(
        '[HANDLER rh] tabela `recibos` não existe. Cancelando geração de recibo.'
      );
      return NextResponse.json(
        {
          error:
            'Geração de recibo não suportada: tabela `recibos` não existe neste ambiente',
        },
        { status: 400 }
      );
    }

    // Verificar se recibo já existe para essa parcela
    // Nota: parcela_numero não existe na tabela - identificação é feita apenas por pagamento_id
    const reciboExistenteQuery = `
      SELECT 
        r.id,
        r.numero_recibo,
        r.hash_pdf,
        r.conteudo_pdf_path
      FROM recibos r
      WHERE r.pagamento_id = $1
      LIMIT 1
    `;

    console.log(
      '[HANDLER rh] Executando reciboExistenteQuery for pagamento_id, parcela:',
      pagamento_id,
      parcela_numero
    );
    let reciboExistenteResult: any;
    try {
      reciboExistenteResult = await query(reciboExistenteQuery, [pagamento_id]);
      console.log(
        '[HANDLER rh] reciboExistenteResult rows:',
        reciboExistenteResult.rows.length
      );
    } catch (err) {
      console.error(
        '[HANDLER rh] Erro ao consultar recibos existentes:',
        err?.stack || err
      );
      return NextResponse.json(
        {
          error: 'Erro ao consultar recibos existentes',
          details: err?.message || null,
        },
        { status: 500 }
      );
    }

    // Se já existe, retornar o existente (idempotência)
    if (reciboExistenteResult.rows.length > 0) {
      const reciboExistente = reciboExistenteResult.rows[0];
      return NextResponse.json({
        message: 'Recibo já existe',
        recibo: {
          id: reciboExistente.id,
          numero_recibo: reciboExistente.numero_recibo,
          hash: reciboExistente.hash_pdf,
          arquivo_path: reciboExistente.conteudo_pdf_path,
        },
      });
    }

    // Buscar pagamento e validar vínculo com a clínica
    console.log('[HANDLER rh] Executando SELECT pagamentos id =', pagamento_id);
    const pagamentoRes = await query('SELECT * FROM pagamentos WHERE id = $1', [
      pagamento_id,
    ]);
    console.log('[HANDLER rh] pagamentoRes rows:', pagamentoRes.rows.length);
    if (pagamentoRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const pagamento = pagamentoRes.rows[0];

    console.log('[HANDLER rh] Executando SELECT clinicas id =', clinicaId);
    const clinicaRes = await query(
      'SELECT id, nome, cnpj, email FROM clinicas WHERE id = $1',
      [clinicaId]
    );
    console.log('[HANDLER rh] clinicaRes rows:', clinicaRes.rows.length);
    if (clinicaRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    const clinica = clinicaRes.rows[0];

    // Verificar se o pagamento pertence à clínica: pode ocorrer por pagamentos.clinica_id (legacy)
    // ou por pagamentos.entidade_id apontando para uma entidade com o mesmo CNPJ da clínica
    let belongsToClinic = false;

    try {
      if (pagamento.clinica_id && pagamento.clinica_id === clinicaId) {
        belongsToClinic = true;
      } else if (pagamento.entidade_id) {
        const ct = await query(
          'SELECT id, cnpj, nome, email FROM entidades WHERE id = $1',
          [pagamento.entidade_id]
        );
        if (ct.rows.length > 0 && ct.rows[0].cnpj === clinica.cnpj) {
          belongsToClinic = true;
        }
      } else if (pagamento.contrato_id) {
        const contrato = await query(
          'SELECT entidade_id FROM contratos WHERE id = $1',
          [pagamento.contrato_id]
        );
        if (contrato.rows.length > 0) {
          const ct2 = await query(
            'SELECT id, cnpj, nome, email FROM entidades WHERE id = $1',
            [contrato.rows[0].entidade_id]
          );
          if (ct2.rows.length > 0 && ct2.rows[0].cnpj === clinica.cnpj) {
            belongsToClinic = true;
          }
        }
      }
    } catch (err) {
      console.warn(
        'Erro ao verificar vínculo do pagamento com a clínica:',
        err
      );
    }

    if (!belongsToClinic) {
      return NextResponse.json(
        { error: 'Dados de contrato/pagamento não encontrados' },
        { status: 404 }
      );
    }

    // Buscar contrato plano mais recente da clínica (se houver)
    const cpRes = await query(
      `SELECT NULL::INTEGER as contrato_id, cp.created_at as contratacao_at, cp.valor_personalizado_por_funcionario, pl.nome as plano_nome, pl.tipo as plano_tipo
       FROM contratos_planos cp
       LEFT JOIN planos pl ON cp.plano_id = pl.id
       WHERE cp.clinica_id = $1
       ORDER BY cp.created_at DESC
       LIMIT 1`,
      [clinicaId]
    );

    const cpRow = cpRes.rows[0] || {};

    // Buscar entidade_id associado ao pagamento/contrato
    let entidadeId: number | null = null;
    let contratoId: number | null =
      cpRow.contrato_id || pagamento.contrato_id || null;
    if (pagamento.entidade_id) {
      entidadeId = pagamento.entidade_id;
    } else if (contratoId) {
      const contratoRes = await query(
        'SELECT entidade_id FROM contratos WHERE id = $1',
        [contratoId]
      );
      if (contratoRes.rows.length > 0) {
        entidadeId = contratoRes.rows[0].entidade_id;
      }
    }

    // Se ainda não temos contrato_id e temos entidade_id, tentar recuperar um contrato existente ACEITO
    if (!contratoId && entidadeId) {
      const contratoRes = await query(
        'SELECT id, aceito, status FROM contratos WHERE entidade_id = $1 AND aceito = true ORDER BY id DESC LIMIT 1',
        [entidadeId]
      );
      if (contratoRes.rows.length > 0) {
        contratoId = contratoRes.rows[0].id;
      } else {
        // POLÍTICA: Recibos só podem ser gerados com contrato pré-existente e aceito
        console.error(
          `[RH/PARCELAS/GERAR-RECIBO] Contrato não encontrado ou não aceito para entidade ${entidadeId}`
        );
        return NextResponse.json(
          {
            error:
              'Contrato não encontrado ou não aceito. É necessário aceitar um contrato antes de gerar recibos.',
          },
          { status: 400 }
        );
      }
    }

    // Validar que temos contrato_id e que está aceito
    if (!contratoId) {
      return NextResponse.json(
        { error: 'Contrato não identificado para geração de recibo' },
        { status: 400 }
      );
    }

    const contratoValidation = await query(
      'SELECT id, aceito, status FROM contratos WHERE id = $1',
      [contratoId]
    );
    if (contratoValidation.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }
    if (!contratoValidation.rows[0].aceito) {
      return NextResponse.json(
        {
          error:
            'Contrato não foi aceito. Aceite o contrato antes de gerar recibos.',
        },
        { status: 400 }
      );
    }

    // Validar que o pagamento está confirmado
    if (pagamento.status !== 'pago' && pagamento.status !== 'aprovado') {
      return NextResponse.json(
        {
          error:
            'Pagamento não está confirmado. Confirme o pagamento antes de gerar recibos.',
        },
        { status: 400 }
      );
    }

    const dados: any = {
      contrato_id: contratoId,
      contratacao_at:
        cpRow.contratacao_at ||
        pagamento.criado_em ||
        pagamento.data_pagamento ||
        new Date().toISOString(),
      clinica_nome: clinica.nome,
      clinica_cnpj: clinica.cnpj,
      clinica_email: clinica.email,
      pagamento_id: pagamento.id,
      pagamento_valor: pagamento.valor,
      status: pagamento.status,
      numero_parcelas: pagamento.numero_parcelas,
      detalhes_parcelas:
        pagamento.detalhes_parcelas || pagamento.parcelas_json || null,
      metodo: pagamento.metodo,
      pagamento_criado_em: pagamento.data_pagamento || pagamento.criado_em,
      plano_nome: cpRow.plano_nome || null,
      plano_tipo: cpRow.plano_tipo || null,
    };

    // Calcular número de funcionários ativos da clínica (fallback caso contrato não tenha a informação)
    try {
      const funcsRes = await query(
        'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1 AND status = $2',
        [clinicaId, 'ativo']
      );
      dados.numero_funcionarios = parseInt(funcsRes.rows[0].count) || 1;
    } catch {
      dados.numero_funcionarios = 1;
    }

    // Se contratos_planos tem valor_personalizado_por_funcionario e não há valor_pago explícito, calcular um valor_pago aproximado
    try {
      let cpValor = cpRow.valor_pago;
      if (!cpValor && cpRow.valor_personalizado_por_funcionario) {
        cpValor =
          parseFloat(cpRow.valor_personalizado_por_funcionario) *
          (dados.numero_funcionarios || 0);
      }
      if (cpValor) {
        // Priorizar valor encontrado no contrato plano para o valor do pagamento
        dados.pagamento_valor = cpValor;
      }
    } catch (err) {
      // Silencioso: manter pagamento.valor original
      console.warn(
        '[HANDLER rh] erro ao calcular valor a partir de contratos_planos:',
        err?.message || err
      );
    }

    // Processar detalhes das parcelas (se não vierem, reconstruir a partir do pagamento)
    let detalhes_parcelas: any[] = [];
    try {
      if (dados.detalhes_parcelas) {
        detalhes_parcelas =
          typeof dados.detalhes_parcelas === 'string'
            ? JSON.parse(dados.detalhes_parcelas)
            : dados.detalhes_parcelas;
      } else if (dados.numero_parcelas && parseInt(dados.numero_parcelas) > 0) {
        const numParcelas = parseInt(dados.numero_parcelas);
        const valorParcela = parseFloat(dados.pagamento_valor) / numParcelas;
        const isPago = dados.status === 'pago' || false;
        for (let i = 1; i <= numParcelas; i++) {
          const dataVenc = new Date(
            dados.pagamento_criado_em || dados.contratacao_at
          );
          dataVenc.setMonth(dataVenc.getMonth() + (i - 1));
          detalhes_parcelas.push({
            numero: i,
            valor: valorParcela,
            data_vencimento: dataVenc.toISOString(),
            pago: i === 1 && isPago,
            data_pagamento:
              i === 1 && isPago ? dados.pagamento_criado_em : null,
          });
        }
      } else {
        // pagamento à vista
        detalhes_parcelas.push({
          numero: 1,
          valor: parseFloat(dados.pagamento_valor),
          data_vencimento: dados.pagamento_criado_em || dados.contratacao_at,
          pago: dados.status === 'pago' || false,
          data_pagamento:
            dados.status === 'pago' ? dados.pagamento_criado_em : null,
        });
      }
    } catch (err) {
      console.error('Erro ao processar detalhes_parcelas:', err);
    }

    const parcela = detalhes_parcelas.find(
      (p: any) => p.numero === parcela_numero
    );

    if (!parcela) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      );
    }

    // Gerar número do recibo
    const anoAtual = new Date().getFullYear();
    // Detectar se a coluna criado_em existe para evitar erros em esquemas antigos
    const criadoEmCheck = await query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos' AND column_name = 'criado_em' LIMIT 1",
      []
    );
    const hasCriadoEm = criadoEmCheck.rows.length > 0;

    let sequenciaResult: any;
    try {
      if (hasCriadoEm) {
        console.log(
          '[HANDLER rh] Usando criado_em para calcular sequência do ano',
          anoAtual
        );
        sequenciaResult = await query(
          `SELECT COUNT(*) as count FROM recibos WHERE EXTRACT(YEAR FROM criado_em) = $1`,
          [anoAtual]
        );
      } else {
        console.warn(
          '[HANDLER rh] coluna recibos.criado_em não encontrada — usando contagem total como fallback'
        );
        sequenciaResult = await query(
          `SELECT COUNT(*) as count FROM recibos`,
          []
        );
      }
      console.log(
        '[HANDLER rh] sequenciaResult count:',
        sequenciaResult.rows[0]?.count
      );
    } catch (err) {
      console.error(
        '[HANDLER rh] Erro ao executar sequencia query:',
        err?.stack || err
      );
      return NextResponse.json(
        {
          error: 'Erro ao calcular número sequencial do recibo',
          details: err?.message || null,
        },
        { status: 500 }
      );
    }

    const sequencia = parseInt(sequenciaResult.rows[0].count) + 1;
    const numero_recibo = `REC-${anoAtual}-${String(sequencia).padStart(5, '0')}`;

    // Gerar conteúdo do recibo (texto simples para hash e persistência)
    const conteudoRecibo = `
RECIBO DE PAGAMENTO
${numero_recibo}

tomador:
Nome: ${dados.clinica_nome}
CNPJ: ${dados.clinica_cnpj || 'N/A'}
Email: ${dados.clinica_email}

CONTRATO:
Data de Contratação: ${new Date(dados.contratacao_at).toLocaleDateString('pt-BR')}
Plano: ${dados.plano_nome} - ${dados.plano_tipo || ''}
Valor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(dados.pagamento_valor))}
Funcionários Cobertos: ${dados.numero_funcionarios}

PAGAMENTO:
Método: ${dados.metodo || 'N/A'}
Parcela: ${parcela.numero} / ${detalhes_parcelas.length}
Valor da Parcela: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(parcela.valor))}
Data de Vencimento: ${new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
${parcela.data_pagamento ? `Data de Pagamento: ${new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}` : ''}

Status: ${parcela.pago ? 'PAGO' : 'A VENCER'}

Gerado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();

    // Calcular hash do conteúdo
    const hash = createHash('sha256').update(conteudoRecibo).digest('hex');

    // Salvar arquivo localmente
    const storageDir = join(process.cwd(), 'storage', 'recibos');
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }

    const fileName = `${numero_recibo}_parcela_${parcela_numero}.txt`;
    const filePath = join(storageDir, fileName);
    await writeFile(filePath, conteudoRecibo, 'utf-8');

    const arquivo_path_relativo = `storage/recibos/${fileName}`;

    // Inserir recibo no banco - detectar colunas dinamicamente para robustez
    console.log('[HANDLER rh] Detecting recibos columns...');
    const reciboColsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recibos' AND table_schema = 'public'
      ORDER BY column_name
    `;
    const reciboColsResult = await query(reciboColsQuery, []);
    const availableColumns = reciboColsResult.rows.map(
      (r: any) => r.column_name
    );
    console.log('[HANDLER rh] Available columns in recibos:', availableColumns);

    // Preparar dados para inserção
    const vigenciaInicio = new Date(dados.contratacao_at);
    const vigenciaFim = new Date(vigenciaInicio);
    vigenciaFim.setDate(vigenciaFim.getDate() + 364);

    const insertData: any = {
      contrato_id: dados.contrato_id,
      pagamento_id: dados.pagamento_id,
      clinica_id: clinicaId,
      entidade_id: entidadeId,
      parcela_numero,
      numero_recibo,
      vigencia_inicio: vigenciaInicio.toISOString().split('T')[0],
      vigencia_fim: vigenciaFim.toISOString().split('T')[0],
      numero_funcionarios_cobertos: dados.numero_funcionarios,
      valor_total_anual: parseFloat(dados.pagamento_valor),
      forma_pagamento: dados.metodo || 'desconhecido',
      numero_parcelas: detalhes_parcelas.length,
      conteudo_pdf_path: arquivo_path_relativo,
      conteudo_texto: conteudoRecibo,
      hash_pdf: hash,
      emitido_por_cpf: session.cpf || null,
      ativo: true,
    };

    // Filtrar apenas colunas disponíveis
    const columnsToInsert = Object.keys(insertData).filter((col) =>
      availableColumns.includes(col)
    );
    const values = columnsToInsert.map((col) => insertData[col]);
    const placeholders = columnsToInsert.map((_, i) => `$${i + 1}`);

    // Adicionar criado_em se disponível
    if (availableColumns.includes('criado_em')) {
      columnsToInsert.push('criado_em');
      values.push(new Date());
      placeholders.push(`$${values.length}`);
    }

    const insertReciboQuery = `
      INSERT INTO recibos (${columnsToInsert.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${['id', 'numero_recibo', 'hash_pdf', 'conteudo_pdf_path', 'criado_em'].filter((col) => availableColumns.includes(col)).join(', ')}
    `;

    console.log('[HANDLER rh] Insert query:', insertReciboQuery);
    console.log('[HANDLER rh] Insert values:', values);

    let insertReciboResult: any;
    try {
      console.log(
        '[HANDLER rh] Executando insertReciboQuery with values length:',
        values.length
      );
      insertReciboResult = await query(insertReciboQuery, values);
      console.log(
        '[HANDLER rh] insertReciboResult rows:',
        (insertReciboResult &&
          insertReciboResult.rows &&
          insertReciboResult.rows.length) ||
          0
      );
    } catch (err: any) {
      console.error(
        '[HANDLER rh] Erro ao executar insertReciboQuery:',
        err?.stack || err
      );
      console.error('[HANDLER rh] Error message:', err?.message);
      console.error('[HANDLER rh] Error code:', err?.code);
      console.error('[HANDLER rh] Error detail:', err?.detail);
      return NextResponse.json(
        { error: 'Erro ao inserir recibo', details: err?.message || null },
        { status: 500 }
      );
    }

    const novoRecibo = insertReciboResult.rows[0];

    return NextResponse.json({
      message: 'Recibo gerado com sucesso',
      recibo: {
        id: novoRecibo.id,
        numero_recibo: novoRecibo.numero_recibo,
        hash: novoRecibo.hash_pdf,
        arquivo_path: novoRecibo.conteudo_pdf_path,
        criado_em: novoRecibo.criado_em,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar recibo:', error?.stack || error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar recibo',
        details: error && error.message ? error.message : null,
      },
      { status: 500 }
    );
  }
}
