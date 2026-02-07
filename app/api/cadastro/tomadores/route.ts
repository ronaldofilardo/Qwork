import { NextRequest, NextResponse } from 'next/server';
import { TipoEntidade, StatusAprovacao } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import os from 'os';

// Validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return digito1 === parseInt(cnpj[12]) && digito2 === parseInt(cnpj[13]);
}

// Validar CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return digito1 === parseInt(cpf[9]) && digito2 === parseInt(cpf[10]);
}

// Validar email
function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Salvar arquivo: salvar localmente em `public/uploads/entidades` (sempre local)
async function salvarArquivo(
  file: File,
  tipo: string,
  cnpj: string
): Promise<string> {
  try {
    console.debug('salvarArquivo chamado', {
      name: (file as any).name,
      type: (file as any).type,
      size: (file as any).size,
      hasArrayBuffer: typeof (file as any).arrayBuffer === 'function',
    });

    if (typeof (file as any).arrayBuffer !== 'function') {
      throw new Error('file.arrayBuffer não disponível');
    }

    const bytes = await (file as any).arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file locally (always use local storage)

    // Fallback: salvar localmente
    // Em ambientes serverless (Vercel) não podemos escrever em /var/task/public.
    // Use o diretório temporário do sistema em produção/serverless, e apenas
    // use public/uploads em desenvolvimento local.
    const isServerlessProd =
      process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const uploadDir = isServerlessProd
      ? path.join(os.tmpdir(), 'qwork', 'uploads', 'entidades', cnpj)
      : path.join(process.cwd(), 'public', 'uploads', 'entidades', cnpj);

    // Criar diretório se não existir
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const extension = ((file as any).name || '').split('.').pop() || 'bin';
    const filename = `${tipo}_${Date.now()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return `/uploads/entidades/${cnpj}/${filename}`;
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    throw new Error('Erro ao salvar arquivo');
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  // Extrair dados básicos
  const tipo = formData.get('tipo') as TipoEntidade;
  const nome = formData.get('nome') as string;
  const cnpj = formData.get('cnpj') as string;
  const inscricaoEstadual = formData.get('inscricao_estadual') as string | null;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;
  const endereco = formData.get('endereco') as string;
  const cidade = formData.get('cidade') as string;
  const estado = formData.get('estado') as string;
  const cep = formData.get('cep') as string;

  // Extrair plano selecionado (novo campo)
  const planoIdStr = formData.get('plano_id') as string | null;
  const planoId = planoIdStr ? parseInt(planoIdStr) : null;
  // Extrair número estimado de funcionários (quando informado na etapa de seleção de plano)
  const numeroFuncionariosStr = formData.get('numero_funcionarios_estimado') as
    | string
    | null;
  const numeroFuncionarios = numeroFuncionariosStr
    ? parseInt(numeroFuncionariosStr)
    : null;

  // Validação precoce: se fornecido número de funcionários, validar com limite do plano
  if (planoId && numeroFuncionarios) {
    const { query } = await import('@/lib/db');
    const limiteRes = await query(
      'SELECT limite_funcionarios as limite FROM planos WHERE id = $1',
      [planoId]
    );
    const limiteRaw = limiteRes.rows[0]?.limite;
    const limite = limiteRaw ? parseInt(limiteRaw) : null;
    if (limite && numeroFuncionarios > limite) {
      return NextResponse.json(
        {
          error: `Número de funcionários excede o limite do plano (máx: ${limite})`,
        },
        { status: 400 }
      );
    }
  }

  // Extrair dados do responsável
  const responsavelNome = formData.get('responsavel_nome') as string;
  const responsavelCpf = formData.get('responsavel_cpf') as string;
  const responsavelCargo = formData.get('responsavel_cargo') as string | null;
  const responsavelEmail = formData.get('responsavel_email') as string;
  const responsavelCelular = formData.get('responsavel_celular') as string;

  // Extrair arquivos
  const cartaoCnpjFile = formData.get('cartao_cnpj') as File | null;
  const contratoSocialFile = formData.get('contrato_social') as File | null;
  const docIdentificacaoFile = formData.get('doc_identificacao') as File | null;

  // Log início do fluxo
  const ipAddressLog =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  console.info(
    JSON.stringify({
      event: 'cadastro_contratante_start',
      cnpj: (cnpj || '').replace(/(\d{8})(\d{4})/, '********$2'),
      email,
      planoId,
      ip: ipAddressLog,
    })
  );

  // Validações
  if (!tipo || !['clinica', 'entidade'].includes(tipo)) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'tipo_invalido',
        tipo,
      })
    );
    return NextResponse.json(
      { error: 'Tipo inválido. Deve ser "clinica" ou "entidade"' },
      { status: 400 }
    );
  }

  if (!nome || nome.length < 3) {
    return NextResponse.json(
      { error: 'Nome/Razão Social é obrigatório (mínimo 3 caracteres)' },
      { status: 400 }
    );
  }

  if (!cnpj || cnpj.trim() === '') {
    return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
  }

  if (!validarCNPJ(cnpj)) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'cnpj_invalido',
        cnpj: (cnpj || '').replace(/(\d{8})(\d{4})/, '********$2'),
      })
    );
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  // Validar plano se fornecido (novo)
  if (planoId !== null && planoId <= 0) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
  }

  // NOVO FLUXO: Contrato não é mais validado aqui - será gerado após pagamento

  if (!validarEmail(email)) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'email_invalido',
        email,
      })
    );
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  if (!telefone || telefone.length < 10) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'telefone_invalido',
        telefone,
      })
    );
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
  }

  if (!endereco || !cidade || !estado || !cep) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'endereco_incompleto',
      })
    );
    return NextResponse.json(
      { error: 'Endereço completo é obrigatório' },
      { status: 400 }
    );
  }

  if (estado.length !== 2) {
    return NextResponse.json(
      { error: 'Estado deve ter 2 caracteres (UF)' },
      { status: 400 }
    );
  }

  if (
    !responsavelNome ||
    !validarCPF(responsavelCpf) ||
    !validarEmail(responsavelEmail) ||
    !responsavelCelular
  ) {
    console.info(
      JSON.stringify({
        event: 'cadastro_validation_failed',
        reason: 'responsavel_invalido',
      })
    );
    return NextResponse.json(
      { error: 'Dados do responsável incompletos ou inválidos' },
      { status: 400 }
    );
  }

  // Validar arquivos obrigatórios (exceto se flag NEXT_PUBLIC_DISABLE_ANEXOS estiver ativa)
  const anexosDesabilitados = process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';

  if (!anexosDesabilitados) {
    if (!cartaoCnpjFile || !contratoSocialFile || !docIdentificacaoFile) {
      console.info(
        JSON.stringify({
          event: 'cadastro_validation_failed',
          reason: 'anexos_faltando',
        })
      );
      return NextResponse.json(
        {
          error:
            'Todos os anexos são obrigatórios (Cartão CNPJ, Contrato Social, Doc Identificação)',
        },
        { status: 400 }
      );
    }
  } else {
    console.info(
      JSON.stringify({
        event: 'cadastro_anexos_desabilitados',
        flag: 'NEXT_PUBLIC_DISABLE_ANEXOS=true',
      })
    );
  }

  // Validar tipos de arquivo (PDF ou imagem) - apenas se anexos não estiverem desabilitados
  if (!anexosDesabilitados) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (
      !allowedTypes.includes(cartaoCnpjFile!.type) ||
      !allowedTypes.includes(contratoSocialFile!.type) ||
      !allowedTypes.includes(docIdentificacaoFile!.type)
    ) {
      return NextResponse.json(
        { error: 'Arquivos devem ser PDF, JPG ou PNG' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (
      cartaoCnpjFile!.size > maxSize ||
      contratoSocialFile!.size > maxSize ||
      docIdentificacaoFile!.size > maxSize
    ) {
      return NextResponse.json(
        { error: 'Arquivos não podem exceder 5MB' },
        { status: 400 }
      );
    }
  }

  // Salvar arquivos (com tratamento e logs) - apenas se anexos não estiverem desabilitados
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  let cartaoCnpjPath: string | null = null;
  let contratoSocialPath: string | null = null;
  let docIdentificacaoPath: string | null = null;

  if (!anexosDesabilitados) {
    try {
      cartaoCnpjPath = await salvarArquivo(
        cartaoCnpjFile as File,
        'cartao_cnpj',
        cnpjLimpo
      );
      contratoSocialPath = await salvarArquivo(
        contratoSocialFile as File,
        'contrato_social',
        cnpjLimpo
      );
      docIdentificacaoPath = await salvarArquivo(
        docIdentificacaoFile as File,
        'doc_identificacao',
        cnpjLimpo
      );
    } catch (fileError) {
      console.error(
        JSON.stringify({
          event: 'cadastro_file_save_error',
          error: String(fileError),
        })
      );
      return NextResponse.json(
        { error: 'Erro ao salvar os anexos', details: String(fileError) },
        { status: 500 }
      );
    }
  }

  // Executar dentro de uma transação atômica
  const db = await import('@/lib/db');

  try {
    const result = await db.transaction(async (txClient) => {
      // Determinar status inicial baseado no plano selecionado
      let statusToUse: StatusAprovacao = 'pendente' as StatusAprovacao;
      let requiresPersonalizadoSetup = false;

      if (planoId) {
        // Verificar tipo do plano para determinar fluxo
        const planoRes = await txClient.query(
          'SELECT tipo FROM planos WHERE id = $1',
          [planoId]
        );
        const plano = planoRes.rows[0];

        if (plano?.tipo === 'personalizado') {
          // Personalizado: aguarda definição de valor pelo admin
          statusToUse = 'pendente' as StatusAprovacao;
          requiresPersonalizadoSetup = true;
        } else {
          // Fixo ou outro: segue direto para pagamento
          statusToUse = 'aguardando_pagamento' as StatusAprovacao;
        }
      }
      // Verificar se email já existe
      const emailCheck = await txClient.query(
        'SELECT id FROM entidades WHERE email = $1',
        [email]
      );
      if (emailCheck.rows.length > 0) {
        throw new Error('Email já cadastrado no sistema');
      }

      // Verificar se CNPJ já existe
      const cnpjCheck = await txClient.query(
        'SELECT id FROM entidades WHERE cnpj = $1',
        [cnpjLimpo]
      );
      if (cnpjCheck.rows.length > 0) {
        throw new Error('CNPJ já cadastrado no sistema');
      }

      console.info(
        JSON.stringify({
          event: 'cadastro_cnpj_check',
          found: cnpjCheck.rows.length,
        })
      );

      // Inserir entidade
      const entidadeResult = await txClient.query<{
        id: number;
        nome: string;
        tipo: TipoEntidade;
        status: StatusAprovacao;
      }>(
        `INSERT INTO entidades (
          tipo, nome, cnpj, inscricao_estadual, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, ativa, plano_id, pagamento_confirmado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, false, $20, false
        ) RETURNING id, nome, tipo, status`,
        [
          tipo,
          nome,
          cnpjLimpo,
          inscricaoEstadual || null,
          email,
          telefone,
          endereco,
          cidade,
          estado.toUpperCase(),
          cep,
          responsavelNome,
          responsavelCpf.replace(/[^\d]/g, ''),
          responsavelCargo || null,
          responsavelEmail,
          responsavelCelular,
          cartaoCnpjPath,
          contratoSocialPath,
          docIdentificacaoPath,
          statusToUse,
          planoId || null,
        ]
      );
      const entidade = entidadeResult.rows[0];

      console.info(
        JSON.stringify({
          event: 'cadastro_entity_inserted',
          entidade_id: entidade.id,
        })
      );

      // Persistir numero de funcionários estimado
      if (numeroFuncionarios && Number(numeroFuncionarios) > 0) {
        await txClient.query(
          'UPDATE entidades SET numero_funcionarios_estimado = $1 WHERE id = $2',
          [numeroFuncionarios, entidade.id]
        );
        console.log('[CADASTRO] numero_funcionarios_estimado persistido', {
          entidadeId: entidade.id,
          numeroFuncionarios,
        });
      }

      // Determinar se é necessário direcionar para pagamento
      let requiresPayment = false;
      let simuladorUrl: string | null = null;
      let valorTotal: number | null = null;
      let valorPorFuncionario: number | null = null;
      let contratoIdCreated: number | null = null;

      if (planoId) {
        const planoRes = await txClient.query(
          'SELECT preco, tipo, nome FROM planos WHERE id = $1',
          [planoId]
        );
        const p = planoRes.rows[0];
        if (p) {
          // Para plano fixo, sempre R$20 por funcionário
          valorPorFuncionario = p.tipo === 'fixo' ? 20.0 : Number(p.preco || 0);

          if (p.tipo === 'fixo' && numeroFuncionarios) {
            // Calcular valor total para plano fixo
            valorTotal = valorPorFuncionario * numeroFuncionarios;
            requiresPayment = valorTotal > 0;
          } else if (p.tipo === 'personalizado') {
            // Para personalizado, usar o preço base se existir
            requiresPayment = valorPorFuncionario > 0;
            valorTotal = valorPorFuncionario;
          }

          // Criar contrato de aceite antecipado para planos fixos (contract-first)
          if (
            requiresPayment &&
            p.tipo === 'fixo' &&
            numeroFuncionarios &&
            Number(numeroFuncionarios) > 0
          ) {
            // Criar um registro de contrato pendente de aceite
            const conteudo = `Contrato para ${numeroFuncionarios} funcionário(s) - Plano: ${p.nome} - Valor total: R$ ${valorTotal!.toFixed(2)}`;

            // Inserir contrato usando aguardando_pagamento (agora disponível no enum)
            // Nota: Verificamos anteriormente que a tabela contratos não existe no dev db
            // Este código será mantido para quando a tabela for criada
            const contratoIns = await txClient.query<{ id: number }>(
              `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo)
               VALUES ($1, $2, $3, $4, 'aguardando_pagamento', false, $5) RETURNING id`,
              [entidade.id, planoId, numeroFuncionarios, valorTotal, conteudo]
            );
            contratoIdCreated = contratoIns.rows[0].id;

            // Não fornecer o simulador direto: exigir aceite do contrato antes
            simuladorUrl = null;

            // Log de evento específico
            console.info(
              JSON.stringify({
                event: 'cadastro_entidade_contract_created',
                entidade_id: entidade.id,
                contrato_id: contratoIdCreated,
                plano_id: planoId,
                valor_total: valorTotal,
                numero_funcionarios: numeroFuncionarios,
              })
            );

            // Expor o id do contrato no response através de contrato_id (frontend usará para abrir contrato)
            (global as any).__last_contract_id = contratoIdCreated; // debug hook for tests if needed
          } else if (requiresPersonalizadoSetup) {
            // Para personalizado, criar registro em contratacao_personalizada
            await txClient.query(
              `INSERT INTO contratacao_personalizada (
                contratante_id, numero_funcionarios_estimado, status, criado_em, atualizado_em
              ) VALUES ($1, $2, 'aguardando_valor_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [entidade.id, numeroFuncionarios || null]
            );

            console.info(
              JSON.stringify({
                event: 'cadastro_entidade_personalizado_created',
                entidade_id: entidade.id,
                plano_id: planoId,
                numero_funcionarios: numeroFuncionarios,
                status: 'aguardando_valor_admin',
              })
            );
          } else if (requiresPayment) {
            // Para outros tipos de plano, seguir o fluxo normal de simulador
            simuladorUrl = `/pagamento/simulador?entidade_id=${entidade.id}&plano_id=${planoId}&numero_funcionarios=${numeroFuncionarios || 0}`;
          }
        }

        console.info(
          JSON.stringify({
            event: 'cadastro_entidade_payment_check',
            entidade_id: entidade.id,
            plano_id: planoId,
            plano_tipo: p?.tipo,
            plano_nome: p?.nome,
            valor_por_funcionario: valorPorFuncionario,
            numero_funcionarios: numeroFuncionarios,
            valor_total: valorTotal,
            requiresPayment,
            simuladorUrl,
            novo_fluxo: 'contract-first',
          })
        );
      }

      // Retornar dados para fora da transação
      return {
        entidade,
        requiresPayment,
        simuladorUrl,
        contratoIdCreated,
        valorPorFuncionario,
        numeroFuncionarios,
        valorTotal,
      };
    });
    // Transação comitada automaticamente se chegou aqui

    // Log de sucesso
    console.info(
      JSON.stringify({
        event: 'cadastro_entidade_success',
        entidade_id: result.entidade.id,
        requiresPayment: result.requiresPayment,
        simuladorUrl: result.simuladorUrl,
        plano_id: planoId,
        valor_total: result.valorTotal,
        numero_funcionarios: result.numeroFuncionarios,
        novo_fluxo: 'contract-first',
      })
    );

    return NextResponse.json(
      {
        success: true,
        id: result.entidade.id,
        requires_payment: result.requiresPayment,
        simulador_url: result.simuladorUrl,
        contrato_id: result.contratoIdCreated,
        requires_contract_acceptance: result.contratoIdCreated !== null,
        payment_info: result.requiresPayment
          ? {
              valor_por_funcionario: result.valorPorFuncionario,
              numero_funcionarios: result.numeroFuncionarios,
              valor_total: result.valorTotal,
            }
          : null,
        message: result.requiresPayment
          ? result.contratoIdCreated
            ? 'Cadastro realizado! Aceite o contrato gerado para prosseguir ao simulador.'
            : 'Cadastro realizado! Prossiga para o simulador de pagamento.'
          : 'Cadastro realizado com sucesso! Aguarde análise do administrador.',
        entidade: {
          id: result.entidade.id,
          nome: result.entidade.nome,
          tipo: result.entidade.tipo,
          status: result.entidade.status,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Transação já fez rollback automaticamente em caso de erro

    console.error(
      JSON.stringify({
        event: 'cadastro_entidade_error',
        error: String(error),
        code: (error as any)?.code,
        constraint: (error as any)?.constraint,
        detail: (error as any)?.detail,
        hint: (error as any)?.hint,
        stack: error instanceof Error ? error.stack : undefined,
      })
    );

    if (error instanceof Error) {
      // Verificar mensagens de erro específicas
      if (error.message === 'Email já cadastrado no sistema') {
        return NextResponse.json(
          { error: 'Email já cadastrado no sistema' },
          { status: 409 }
        );
      }
      if (error.message === 'CNPJ já cadastrado no sistema') {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado no sistema' },
          { status: 409 }
        );
      }

      // Verificar violação de unicidade (PostgreSQL error code 23505)
      if ((error as any).code === '23505') {
        if ((error as any).constraint === 'entidades_email_unique') {
          return NextResponse.json(
            { error: 'Email já cadastrado no sistema' },
            { status: 409 }
          );
        }
        if ((error as any).constraint === 'entidades_cnpj_unique') {
          return NextResponse.json(
            { error: 'CNPJ já cadastrado no sistema' },
            { status: 409 }
          );
        }
        // Outras violações de unicidade
        if ((error as any).constraint?.includes('unique')) {
          return NextResponse.json(
            { error: 'Dados duplicados no sistema' },
            { status: 409 }
          );
        }
      }

      // Verificar erros de FK ou RLS
      if ((error as any).code === '23503') {
        // FK violation
        return NextResponse.json(
          { error: 'Dados de referência inválidos' },
          { status: 400 }
        );
      }
      if (error.message.includes('violates row level security policy')) {
        return NextResponse.json(
          { error: 'Erro de permissão no cadastro' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar cadastro' },
      { status: 500 }
    );
  }
}
