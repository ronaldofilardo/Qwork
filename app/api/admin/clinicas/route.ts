import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { validarCNPJ, validarEmail, validarCPF } from '@/lib/validators';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

export async function GET() {
  try {
    const session = await requireRole('admin');

    const result = await query(
      `SELECT id, nome, cnpj, email, telefone, endereco,
               cidade, estado, ativa, status,
               responsavel_nome, responsavel_cpf, responsavel_email,
               TO_CHAR(criado_em, 'YYYY-MM-DD HH24:MI:SS') as criado_em
        FROM contratantes
        WHERE tipo = 'clinica' AND status = 'aprovado'
        ORDER BY criado_em DESC`,
      [],
      session
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin');

    const data = await request.json();
    const {
      nome,
      _razao_social,
      cnpj,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      _inscricao_estadual,
      gestor_rh,
    } = data;

    // Validações básicas
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da clínica é obrigatório' },
        { status: 400 }
      );
    }

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Validar CNPJ
    if (!validarCNPJ(cnpj)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    // Validar email se fornecido
    if (email && !validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Validar gestor RH se fornecido
    if (gestor_rh) {
      if (!gestor_rh.nome || !gestor_rh.cpf || !gestor_rh.email) {
        return NextResponse.json(
          {
            error:
              'Dados do gestor RH incompletos (nome, CPF e email são obrigatórios)',
          },
          { status: 400 }
        );
      }

      if (!validarCPF(gestor_rh.cpf)) {
        return NextResponse.json(
          { error: 'CPF do gestor RH inválido' },
          { status: 400 }
        );
      }

      if (!validarEmail(gestor_rh.email)) {
        return NextResponse.json(
          { error: 'Email do gestor RH inválido' },
          { status: 400 }
        );
      }

      // Verificar se CPF já existe
      const cpfExiste = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        [gestor_rh.cpf.replace(/\D/g, '')],
        session
      );

      if (cpfExiste.rows.length > 0) {
        return NextResponse.json(
          { error: 'CPF do gestor RH já cadastrado' },
          { status: 409 }
        );
      }
    }

    // Limpar CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Verificar se CNPJ já existe
    const cnpjExiste = await query(
      'SELECT id FROM contratantes WHERE cnpj = $1',
      [cnpjLimpo],
      session
    );

    if (cnpjExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    // Iniciar transação
    await query('BEGIN', [], session);

    try {
      // Inserir clínica como contratante
      const resultClinica = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone, endereco,
          cidade, estado, cep, status,
          responsavel_nome, responsavel_cpf, responsavel_cargo,
          responsavel_email, responsavel_celular
        )
        VALUES ('clinica', $1, $2, $3, $4, $5, $6, $7, $8, 'aprovado', $9, $10, $11, $12, $13)
        RETURNING id, tipo, nome, cnpj, email, telefone, endereco,
                  cidade, estado, cep, ativa, status,
                  responsavel_nome, responsavel_cpf, responsavel_email,
                  TO_CHAR(criado_em, 'YYYY-MM-DD HH24:MI:SS') as criado_em`,
        [
          nome,
          cnpjLimpo,
          email || null,
          telefone || null,
          endereco || null,
          cidade || null,
          estado || null,
          '00000-000',
          gestor_rh?.nome || 'Responsável',
          gestor_rh?.cpf?.replace(/\D/g, '') || '00000000000',
          'Gestor',
          gestor_rh?.email || email,
          telefone || '00000000000',
        ],
        session
      );

      const clinicaCriada = resultClinica.rows[0] as Record<string, any>;

      // Se foi fornecido gestor RH, criar o usuário
      let gestorCriado = null;
      if (gestor_rh) {
        const cpfLimpo = gestor_rh.cpf.replace(/\D/g, '');
        const senhaHash = await bcrypt.hash(gestor_rh.senha || '123456', 10);

        const resultGestor = await query(
          `INSERT INTO funcionarios (
            cpf, nome, email, senha_hash, perfil, clinica_id, ativo
          )
          VALUES ($1, $2, $3, $4, 'rh', $5, true)
          RETURNING cpf, nome, email, ativo, criado_em`,
          [
            cpfLimpo,
            gestor_rh.nome,
            gestor_rh.email,
            senhaHash,
            clinicaCriada.id,
          ],
          session
        );

        gestorCriado = resultGestor.rows[0] as Record<string, any>;

        // Log de auditoria para criação do gestor
        await logAudit(
          {
            resource: 'funcionarios',
            action: 'INSERT',
            resourceId: cpfLimpo,
            newData: {
              cpf: cpfLimpo,
              nome: gestor_rh.nome,
              email: gestor_rh.email,
              perfil: 'rh',
              clinica_id: clinicaCriada.id,
            },
            ...extractRequestInfo(request),
          },
          session
        );
      }

      // Log de auditoria para criação da clínica
      await logAudit(
        {
          resource: 'contratantes',
          action: 'INSERT',
          resourceId: clinicaCriada.id,
          newData: {
            id: clinicaCriada.id,
            tipo: 'clinica',
            nome,
            cnpj: cnpjLimpo,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            status: 'aprovado',
          },
          ...extractRequestInfo(request),
        },
        session
      );

      await query('COMMIT', [], session);

      return NextResponse.json(
        {
          success: true,
          clinica: clinicaCriada,
          gestor_rh: gestorCriado,
        },
        { status: 201 }
      );
    } catch (error) {
      await query('ROLLBACK', [], session);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar clínica:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se é erro de CNPJ duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'constraint' in error &&
      (error as PostgresError).code === '23505' &&
      ((error as PostgresError).constraint === 'clinicas_cnpj_key' ||
        (error as PostgresError).constraint === 'contratantes_cnpj_key')
    ) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
