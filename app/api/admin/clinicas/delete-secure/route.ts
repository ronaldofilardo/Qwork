import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

interface DeleteRequestBody {
  password: string;
  clinicaId: number;
}

interface ClinicaInfo {
  id: number;
  nome: string;
  cnpj: string;
  ativa: boolean;
  tipo?: string; // Para diferenciar clinica/entidade
  contratante_id?: number; // Para clínicas associadas a entidades
}

interface CountResult {
  count: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sessão e permissão
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir clínicas' },
        { status: 403 }
      );
    }

    // 2. Extrair dados da requisição
    const body: DeleteRequestBody = await request.json();
    const { password, clinicaId } = body;

    if (!password || !clinicaId) {
      return NextResponse.json(
        { error: 'Senha e ID da clínica são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Obter informações do admin e validar senha
    const adminResult = await query<{ senha_hash: string; nome: string }>(
      'SELECT senha_hash, nome FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    const admin = adminResult.rows[0];
    const senhaValida = await bcrypt.compare(password, admin.senha_hash);

    // 4. Obter informações da clínica/entidade
    // Primeiro tenta na tabela clinicas (clínicas aprovadas)
    let clinicaResult = await query<ClinicaInfo>(
      'SELECT id, nome, cnpj, ativa, contratante_id FROM clinicas WHERE id = $1',
      [clinicaId]
    );

    let tipoEntidade = 'clinica';

    // Se não encontrou na tabela clinicas, tenta na tabela contratantes (entidades)
    if (clinicaResult.rows.length === 0) {
      clinicaResult = await query<ClinicaInfo>(
        'SELECT id, nome, cnpj, ativa, tipo FROM contratantes WHERE id = $1',
        [clinicaId]
      );
      tipoEntidade = 'entidade';
    }

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica ou entidade não encontrada' },
        { status: 404 }
      );
    }

    const clinica = clinicaResult.rows[0];

    // 5. Obter IP e User Agent para log
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 6. Limpar CNPJ (remover formatação - apenas números)
    const cnpjLimpo = clinica.cnpj.replace(/\D/g, '');

    // 8.1 Verificar existência de tabelas/funcões opcionais ANTES de possíveis logs
    const tableExists = async (tableName: string) => {
      const res = await query(
        `SELECT to_regclass('public.${tableName}') as reg`
      );
      return !!(res.rows[0] && res.rows[0].reg);
    };

    const functionExists = async (fnName: string) => {
      const res = await query(
        `SELECT COUNT(*) as c FROM pg_proc WHERE proname = $1`,
        [fnName]
      );
      return parseInt(res.rows[0].c, 10) > 0;
    };

    const hasRecibos = await tableExists('recibos');
    const hasPagamentos = await tableExists('pagamentos');
    const hasContratos = await tableExists('contratos');
    const hasFnDeleteSenha = await functionExists('fn_delete_senha_autorizado');
    const hasFnRegistrarLog = await functionExists(
      'registrar_log_exclusao_clinica'
    );
    const hasLogsTable = await tableExists('logs_exclusao_clinicas');

    // Helper para registrar log (usa função se disponível, senão insere diretamente na tabela)
    const registrarLog = async (
      p_clinica_id: number,
      p_clinica_nome: string,
      p_clinica_cnpj: string,
      p_tipo_entidade: string,
      p_admin_cpf: string,
      p_admin_nome: string,
      p_status: string,
      p_motivo_falha: string | null,
      p_total_gestores: number,
      p_total_empresas: number,
      p_total_funcionarios: number,
      p_total_avaliacoes: number,
      p_ip_origem: string | null,
      p_user_agent: string | null
    ) => {
      const params = [
        p_clinica_id,
        p_clinica_nome,
        p_clinica_cnpj,
        p_tipo_entidade,
        p_admin_cpf,
        p_admin_nome,
        p_status,
        p_motivo_falha,
        p_total_gestores,
        p_total_empresas,
        p_total_funcionarios,
        p_total_avaliacoes,
        p_ip_origem,
        p_user_agent,
      ];

      if (hasFnRegistrarLog) {
        await query(
          `SELECT registrar_log_exclusao_clinica(
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )`,
          params
        );
        return;
      }

      if (hasLogsTable) {
        await query(
          `INSERT INTO logs_exclusao_clinicas(
            clinica_id, clinica_nome, clinica_cnpj, tipo_entidade, admin_cpf, admin_nome,
            status, motivo_falha, total_gestores, total_empresas, total_funcionarios, total_avaliacoes,
            ip_origem, user_agent
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          params
        );
        return;
      }

      // Se nem função nem tabela existirem, apenas logar no servidor
      console.warn(
        'registrar_log_exclusao_clinica não disponível; log não registrado'
      );
    };

    // 7. Se senha incorreta, registrar tentativa negada
    if (!senhaValida) {
      // Registrar tentativa negada (usar placeholders para evitar tipos 'unknown' não resolvidos)
      await registrarLog(
        clinica.id,
        clinica.nome,
        cnpjLimpo,
        tipoEntidade,
        session.cpf,
        admin.nome,
        'negado',
        'Senha incorreta',
        0,
        0,
        0,
        0,
        ip,
        userAgent
      );

      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // 8. Contar registros que serão excluídos
    let gestoresQuery, empresasQuery, funcionariosQuery, avaliacoesQuery;

    if (tipoEntidade === 'clinica') {
      gestoresQuery =
        "SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1 AND perfil IN ('admin', 'rh')";
      empresasQuery =
        'SELECT COUNT(*) as count FROM empresas_clientes WHERE clinica_id = $1';
      funcionariosQuery =
        'SELECT COUNT(*) as count FROM funcionarios WHERE clinica_id = $1';
      avaliacoesQuery = `SELECT COUNT(*) as count FROM avaliacoes a
           INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
           WHERE f.clinica_id = $1`;

      if (clinica.contratante_id) {
        // Incluir contagens da entidade associada
        gestoresQuery += ' OR contratante_id = $2';
        funcionariosQuery += ' OR contratante_id = $2';
        avaliacoesQuery += ` OR f.contratante_id = $2`;
      }
    } else {
      // Para entidades
      gestoresQuery =
        "SELECT COUNT(*) as count FROM funcionarios WHERE contratante_id = $1 AND perfil IN ('admin', 'rh')";
      empresasQuery = 'SELECT 0 as count'; // Entidades não têm empresas diretamente
      funcionariosQuery =
        'SELECT COUNT(*) as count FROM funcionarios WHERE contratante_id = $1';
      avaliacoesQuery = `SELECT COUNT(*) as count FROM avaliacoes a
           INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
           WHERE f.contratante_id = $1`;
    }

    // Preparar parâmetros condicionalmente (evita passar params a queries sem placeholders)
    const empresasParams = empresasQuery.includes('$1') ? [clinicaId] : [];

    // Se for entidade, evitar executar a query dummy e retornar 0 diretamente (evita mocks falhos)
    const empresasPromise =
      tipoEntidade === 'clinica'
        ? query<CountResult>(empresasQuery, empresasParams)
        : Promise.resolve({ rows: [{ count: '0' }] } as {
            rows: { count: string }[];
          });

    const [gestoresCount, empresasCount, funcionariosCount, avaliacoesCount] =
      await Promise.all([
        query<CountResult>(
          gestoresQuery,
          tipoEntidade === 'clinica' && clinica.contratante_id
            ? [clinicaId, clinica.contratante_id]
            : [clinicaId]
        ),
        empresasPromise,
        query<CountResult>(
          funcionariosQuery,
          tipoEntidade === 'clinica' && clinica.contratante_id
            ? [clinicaId, clinica.contratante_id]
            : [clinicaId]
        ),
        query<CountResult>(
          avaliacoesQuery,
          tipoEntidade === 'clinica' && clinica.contratante_id
            ? [clinicaId, clinica.contratante_id]
            : [clinicaId]
        ),
      ]);

    const totais = {
      gestores: parseInt(gestoresCount.rows?.[0]?.count ?? '0', 10),
      empresas: parseInt(empresasCount.rows?.[0]?.count ?? '0', 10),
      funcionarios: parseInt(funcionariosCount.rows?.[0]?.count ?? '0', 10),
      avaliacoes: parseInt(avaliacoesCount.rows?.[0]?.count ?? '0', 10),
    };

    // (registrarLog e checagens foram movidos para cima para garantir declaração antes do uso)

    // 9. Executar exclusão em transação
    try {
      await query('BEGIN');

      // Se for clínica aprovada (tabela clinicas), deletar dependências primeiro
      if (tipoEntidade === 'clinica') {
        // 1. Reatribuir referências em lotes e laudos para conta de sistema (evitar uso do admin como dono)
        // Usar usuário placeholder '00000000000' para histórico/estado neutro
        const SYSTEM_USER_CPF = '00000000000';
        await query(
          'UPDATE lotes_avaliacao SET liberado_por = $1 WHERE liberado_por IN (SELECT cpf FROM funcionarios WHERE clinica_id = $2)',
          [SYSTEM_USER_CPF, clinicaId]
        );
        await query(
          'UPDATE laudos SET emissor_cpf = $1 WHERE emissor_cpf IN (SELECT cpf FROM funcionarios WHERE clinica_id = $2)',
          [SYSTEM_USER_CPF, clinicaId]
        );

        // 2. Deletar funcionários associados à clínica
        await query('DELETE FROM funcionarios WHERE clinica_id = $1', [
          clinicaId,
        ]);

        // 3. Deletar empresas clientes (cascadeará para lotes, avaliações, etc.)
        await query('DELETE FROM empresas_clientes WHERE clinica_id = $1', [
          clinicaId,
        ]);

        // 4. Se a clínica tiver contratante_id, deletar a entidade associada
        if (clinica.contratante_id) {
          // Reatribuir referências da entidade para o administrador
          await query(
            'UPDATE lotes_avaliacao SET liberado_por = $1 WHERE liberado_por IN (SELECT cpf FROM funcionarios WHERE contratante_id = $2)',
            [SYSTEM_USER_CPF, clinica.contratante_id]
          );
          await query(
            'UPDATE laudos SET emissor_cpf = $1 WHERE emissor_cpf IN (SELECT cpf FROM funcionarios WHERE contratante_id = $2)',
            [SYSTEM_USER_CPF, clinica.contratante_id]
          );

          // Deletar funcionários associados à entidade PRIMEIRO (evita triggers)
          await query('DELETE FROM funcionarios WHERE contratante_id = $1', [
            clinica.contratante_id,
          ]);

          // Deletar recibos associados (se existir)
          if (hasRecibos) {
            await query('DELETE FROM recibos WHERE contratante_id = $1', [
              clinica.contratante_id,
            ]);
          }

          // Deletar pagamentos associados (se existir)
          if (hasPagamentos) {
            await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
              clinica.contratante_id,
            ]);
          }

          // Deletar contratos associados (se existir)
          if (hasContratos) {
            await query('DELETE FROM contratos WHERE contratante_id = $1', [
              clinica.contratante_id,
            ]);
          }

          // Deletar senhas de forma segura (se função existir)
          if (hasFnDeleteSenha) {
            await query('SELECT fn_delete_senha_autorizado($1, $2)', [
              clinica.contratante_id,
              `Exclusão de entidade associada à clínica ${clinica.nome} por administrador ${admin.nome}`,
            ]);
          }

          // Finalmente deletar a entidade
          await query('DELETE FROM contratantes WHERE id = $1', [
            clinica.contratante_id,
          ]);
        }

        // 4. Deletar a clínica
        await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
      } else {
        // Se for entidade (tabela contratantes), deletar dependências primeiro
        // Reatribuir referências em lotes e laudos para o administrador, para evitar FKs
        await query(
          'UPDATE lotes_avaliacao SET liberado_por = $1 WHERE liberado_por IN (SELECT cpf FROM funcionarios WHERE contratante_id = $2)',
          [session.cpf, clinicaId]
        );
        await query(
          'UPDATE laudos SET emissor_cpf = $1 WHERE emissor_cpf IN (SELECT cpf FROM funcionarios WHERE contratante_id = $2)',
          [session.cpf, clinicaId]
        );

        // 1. Deletar funcionários associados à entidade PRIMEIRO (evita triggers)
        await query('DELETE FROM funcionarios WHERE contratante_id = $1', [
          clinicaId,
        ]);

        // 2. Deletar recibos associados (se existir)
        if (hasRecibos) {
          await query('DELETE FROM recibos WHERE contratante_id = $1', [
            clinicaId,
          ]);
        }

        // 3. Deletar pagamentos associados (se existir)
        if (hasPagamentos) {
          await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
            clinicaId,
          ]);
        }

        // 4. Deletar contratos associados (se existir)
        if (hasContratos) {
          await query('DELETE FROM contratos WHERE contratante_id = $1', [
            clinicaId,
          ]);
        }

        // 5. Deletar senhas de forma segura (se função existir)
        if (hasFnDeleteSenha) {
          await query('SELECT fn_delete_senha_autorizado($1, $2)', [
            clinicaId,
            `Exclusão de entidade ${clinica.nome} por administrador ${admin.nome}`,
          ]);
        }

        // 6. Finalmente deletar da tabela contratantes
        await query('DELETE FROM contratantes WHERE id = $1', [clinicaId]);
      }

      // Registrar sucesso no log (usar placeholders completos para evitar ambiguidade de tipo)
      await registrarLog(
        clinica.id,
        clinica.nome,
        cnpjLimpo,
        tipoEntidade,
        session.cpf,
        admin.nome,
        'sucesso',
        null,
        totais.gestores,
        totais.empresas,
        totais.funcionarios,
        totais.avaliacoes,
        ip,
        userAgent
      );

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `${tipoEntidade === 'clinica' ? 'Clínica' : 'Entidade'} excluída com sucesso`,
        totaisExcluidos: totais,
      });
    } catch (deleteError) {
      await query('ROLLBACK');

      // Registrar falha no log (usar placeholders completos para evitar ambiguidade de tipo)
      await registrarLog(
        clinica.id,
        clinica.nome,
        cnpjLimpo,
        tipoEntidade,
        session.cpf,
        admin.nome,
        'falha',
        deleteError instanceof Error
          ? deleteError.message
          : 'Erro desconhecido',
        0,
        0,
        0,
        0,
        ip,
        userAgent
      );

      throw deleteError;
    }
  } catch (error) {
    console.error('Erro ao excluir clínica:', error);
    return NextResponse.json(
      {
        error: 'Erro ao excluir clínica',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
