import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { createHash } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/parcelas/gerar-recibo
 * Gera recibo para uma parcela específica (sob demanda)
 */
export async function POST(request: Request) {
  console.log('[HANDLER entidade] POST invoked at', new Date().toISOString());
  console.log('[HANDLER entidade] Starting handler execution...');

  try {
    console.log('[HANDLER entidade] Getting session...');
    const session = getSession();
    console.log('[HANDLER entidade] Session:', session ? 'found' : 'null');
    if (!session || session.perfil !== 'gestor_entidade') {
      console.log(
        '[HANDLER entidade] Unauthorized: session perfil',
        session?.perfil
      );
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contratanteId = session.contratante_id;
    console.log('[HANDLER entidade] Contratante ID:', contratanteId);
    if (!contratanteId) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 400 }
      );
    }

    console.log('[HANDLER entidade] Reading request body...');
    // Ler e logar corpo da requisição para depuração
    let rawBody: string;
    try {
      console.log('[HANDLER entidade] About to call request.text()...');
      rawBody = await request.text();
      console.log(
        '[HANDLER entidade] request.text() succeeded, body length:',
        rawBody.length
      );
      console.log(
        'DEBUG entidade raw request body length:',
        rawBody.length,
        'content:',
        JSON.stringify(rawBody)
      );
      console.log('[HANDLER entidade] Body read successfully, parsing JSON...');
    } catch (bodyError) {
      console.error(
        '[HANDLER entidade] CRITICAL: Error in request.text():',
        bodyError
      );
      console.error('[HANDLER entidade] Error type:', typeof bodyError);
      console.error('[HANDLER entidade] Error message:', bodyError?.message);
      console.error('[HANDLER entidade] Error stack:', bodyError?.stack);
      throw bodyError; // Re-throw to see the actual error
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error('DEBUG entidade invalid JSON body:', rawBody, err);
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const { parcela_numero, pagamento_id } = body;
    console.log(
      '[HANDLER entidade] Parsed body: parcela_numero=',
      parcela_numero,
      'pagamento_id=',
      pagamento_id
    );

    if (!parcela_numero || !pagamento_id) {
      console.log('[HANDLER entidade] Missing required fields');
      return NextResponse.json(
        { error: 'parcela_numero e pagamento_id são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('[HANDLER entidade] Checking for existing recibo...');

    // Verificar se a tabela 'recibos' existe antes de qualquer operação relacionada
    const recibosColsCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recibos' AND table_schema = 'public'
      LIMIT 1
    `;
    const recibosColsCheck = await queryAsGestorEntidade(
      recibosColsCheckQuery,
      []
    );
    if (!recibosColsCheck || recibosColsCheck.rows.length === 0) {
      console.warn(
        '[HANDLER entidade] tabela `recibos` não existe. Cancelando geração de recibo.'
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

    let reciboExistenteResult: any;
    try {
      reciboExistenteResult = await queryAsGestorEntidade(
        reciboExistenteQuery,
        [pagamento_id]
      );
      console.log(
        'DEBUG entidade reciboExistente rows:',
        reciboExistenteResult.rows.length
      );
    } catch (err) {
      console.error(
        'DEBUG entidade reciboExistenteQuery error:',
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
      console.log('[HANDLER entidade] Recibo já existe, retornando existente');
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

    console.log(
      '[HANDLER entidade] Recibo não existe, buscando dados do contrato...'
    );

    // Buscar dados do contrato e pagamento (APENAS contratos aceitos e pagamentos confirmados)
    const dadosQuery = `
      SELECT
        co.id as contrato_id,
        co.criado_em as contratacao_at,
        co.valor_total,
        co.numero_funcionarios,
        co.aceito,
        ct.nome as contratante_nome,
        ct.cnpj as contratante_cnpj,
        ct.email as contratante_email,
        p.id as pagamento_id,
        p.valor as pagamento_valor,
        p.status as status,
        p.numero_parcelas,
        p.detalhes_parcelas,
        p.metodo,
        p.criado_em as pagamento_criado_em,
        pl.nome as plano_nome,
        pl.tipo as plano_tipo
      FROM contratos co
      INNER JOIN contratantes ct ON co.contratante_id = ct.id
      INNER JOIN pagamentos p ON p.contratante_id = ct.id
      INNER JOIN planos pl ON co.plano_id = pl.id
      WHERE ct.id = $1 AND p.id = $2 AND co.aceito = true
      LIMIT 1
    `;

    let dadosResult: any;
    try {
      dadosResult = await queryAsGestorEntidade(dadosQuery, [
        contratanteId,
        pagamento_id,
      ]);
      console.log('[HANDLER entidade] Dados query executed successfully');
    } catch (err) {
      console.error('DEBUG entidade dadosQuery error:', err?.stack || err);
      throw err;
    }

    console.log(
      'DEBUG entidade dadosResult rows count:',
      dadosResult && dadosResult.rows ? dadosResult.rows.length : 'no rows'
    );

    if (dadosResult.rows.length === 0) {
      console.log(
        '[HANDLER entidade] No contract/payment data found or contract not accepted'
      );
      return NextResponse.json(
        {
          error:
            'Contrato não encontrado, não aceito, ou pagamento não confirmado. É necessário aceitar o contrato e confirmar o pagamento antes de gerar recibos.',
        },
        { status: 404 }
      );
    }

    const dados = dadosResult.rows[0];
    console.log('DEBUG entidade dadosResult row:', dados);

    // POLÍTICA: Validar que contrato está aceito e pagamento confirmado
    if (!dados.aceito) {
      return NextResponse.json(
        {
          error:
            'Contrato não foi aceito. Aceite o contrato antes de gerar recibos.',
        },
        { status: 400 }
      );
    }

    if (dados.status !== 'pago' && dados.status !== 'aprovado') {
      return NextResponse.json(
        {
          error:
            'Pagamento não está confirmado. Confirme o pagamento antes de gerar recibos.',
        },
        { status: 400 }
      );
    }

    console.log('[HANDLER entidade] Processing parcel details...');

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

    console.log(
      'DEBUG entidade detalhes_parcelas length',
      detalhes_parcelas.length,
      'parcela',
      parcela
    );

    if (!parcela) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      );
    }

    // Gerar número do recibo
    const anoAtual = new Date().getFullYear();
    const sequenciaQuery = `
      SELECT COUNT(*) as count
      FROM recibos
      WHERE EXTRACT(YEAR FROM criado_em) = $1
    `;
    const sequenciaResult = await queryAsGestorEntidade(sequenciaQuery, [
      anoAtual,
    ]);
    const sequencia = parseInt(String(sequenciaResult.rows[0].count)) + 1;
    const numero_recibo = `REC-${anoAtual}-${String(sequencia).padStart(5, '0')}`;

    // Gerar conteúdo do recibo (texto simples para hash e persistência)
    const conteudoRecibo = `
RECIBO DE PAGAMENTO
${numero_recibo}

CONTRATANTE:
Nome: ${dados.contratante_nome}
CNPJ: ${dados.contratante_cnpj || 'N/A'}
Email: ${dados.contratante_email}

CONTRATO:
Data de Contratação: ${new Date(dados.contratacao_at).toLocaleDateString('pt-BR')}
Plano: ${dados.plano_nome} - ${dados.plano_tipo || ''}
Valor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(dados.valor_total))}
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
    console.log('[HANDLER entidade] Detecting recibos columns...');
    const reciboColsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'recibos' AND table_schema = 'public'
      ORDER BY column_name
    `;
    const reciboColsResult = await queryAsGestorEntidade(reciboColsQuery, []);
    const availableColumns = reciboColsResult.rows.map(
      (r: any) => r.column_name
    );
    console.log(
      '[HANDLER entidade] Available columns in recibos:',
      availableColumns
    );

    // Preparar dados para inserção
    const vigenciaInicio = new Date(dados.contratacao_at);
    const vigenciaFim = new Date(vigenciaInicio);
    vigenciaFim.setDate(vigenciaFim.getDate() + 364);

    const insertData: any = {
      contrato_id: dados.contrato_id,
      pagamento_id: dados.pagamento_id,
      contratante_id: contratanteId,
      parcela_numero,
      numero_recibo,
      vigencia_inicio: vigenciaInicio.toISOString().split('T')[0],
      vigencia_fim: vigenciaFim.toISOString().split('T')[0],
      numero_funcionarios_cobertos: dados.numero_funcionarios,
      valor_total_anual: parseFloat(dados.valor_total),
      forma_pagamento: dados.metodo || 'desconhecido',
      numero_parcelas: detalhes_parcelas.length,
      conteudo_pdf_path: arquivo_path_relativo,
      conteudo_texto: conteudoRecibo,
      hash_pdf: hash,
      emitido_por_cpf: session.cpf || null,
      ativo: true,
    };

    // Filtrar apenas colunas disponíveis (exceto criado_em que será tratado separadamente)
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

    console.log('[HANDLER entidade] Insert query:', insertReciboQuery);
    console.log('[HANDLER entidade] Insert values:', values);

    let insertReciboResult: any;
    try {
      insertReciboResult = await queryAsGestorEntidade(
        insertReciboQuery,
        values
      );
    } catch (err) {
      console.error(
        'DEBUG entidade insertReciboQuery error, query:',
        insertReciboQuery,
        'values:',
        values,
        'error:',
        err?.stack || err
      );
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
  } catch (error: any) {
    console.error('Erro ao gerar recibo:', error?.stack || error);
    return NextResponse.json(
      { error: 'Erro ao gerar recibo', details: error?.message || null },
      { status: 500 }
    );
  }
}
