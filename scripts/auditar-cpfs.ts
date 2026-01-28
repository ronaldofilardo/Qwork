/**
 * Script de Auditoria de CPFs
 *
 * Identifica CPFs inválidos no banco de dados
 * Conformidade LGPD - Princípio da Qualidade dos Dados (Art. 6º, II)
 */

import { query } from '../lib/db';
import { validarCPF, mascararCPFParaLog } from '../lib/cpf-utils';
import fs from 'fs';
import path from 'path';

interface RegistroAuditoria {
  tabela: string;
  id: number;
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
}

async function auditarCPFs() {
  console.log('🔍 Iniciando auditoria de CPFs...\n');

  try {
    // 1. Auditar funcionários
    const funcionarios = await query(`
      SELECT id, cpf, nome, email, ativo 
      FROM funcionarios 
      ORDER BY id
    `).catch((err) => {
      console.error('❌ Erro durante auditoria de CPFs:', err);
      throw err;
    });

    const cpfsInvalidos: RegistroAuditoria[] = [];
    const cpfsValidos: RegistroAuditoria[] = [];

    console.log(`📋 Analisando ${funcionarios.rows.length} funcionários...`);

    for (const func of funcionarios.rows) {
      const registro: RegistroAuditoria = {
        tabela: 'funcionarios',
        id: func.id,
        cpf: func.cpf,
        nome: func.nome,
        email: func.email,
        ativo: func.ativo,
      };

      // Calcular máscara uma vez e armazenar para evitar múltiplas chamadas em testes
      const cpfMaskVal = (
        mascararCPFParaLog(func.cpf) ?? String(func.cpf ?? '')
      ).trim();
      (registro as any).cpf_mascarada = cpfMaskVal;

      if (validarCPF(func.cpf)) {
        cpfsValidos.push(registro);
      } else {
        cpfsInvalidos.push(registro);
      }
    }

    // 2. Buscar avaliações para incluir nas estatísticas
    const avaliacoes = await query(`
      SELECT id, funcionario_cpf, status
      FROM avaliacoes
      ORDER BY id
    `).catch((err) => {
      console.error('❌ Erro durante auditoria de CPFs:', err);
      throw err;
    });

    const totalAvaliacoes =
      avaliacoes && avaliacoes.rows ? avaliacoes.rows.length : 0;

    // 3. Relatório
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE AUDITORIA DE CPFs');
    console.log('='.repeat(80));

    console.log(`\n✅ CPFs Válidos: ${cpfsValidos.length}`);
    console.log(`❌ CPFs Inválidos: ${cpfsInvalidos.length}`);

    if (cpfsInvalidos.length > 0) {
      console.log('\n⚠️  ATENÇÃO: CPFs INVÁLIDOS ENCONTRADOS:\n');
      console.log(
        '┌────────────────────────────────────────────────────────────────┐'
      );
      console.log(
        '│ ID   │ Tabela        │ CPF Mascarado │ Nome              │ Ativo │'
      );
      console.log(
        '├────────────────────────────────────────────────────────────────┤'
      );

      cpfsInvalidos.forEach((reg) => {
        const idStr = String(reg.id).padEnd(5);
        const tabelaStr = reg.tabela.padEnd(14);
        const cpfMask = (
          mascararCPFParaLog(reg.cpf) ?? String(reg.cpf ?? '')
        ).padEnd(14);
        // armazenar máscara para evitar chamadas repetidas em relatórios
        (reg as any).cpf_mascarada = cpfMask.trim();
        const nomeStr = (reg.nome ?? '').substring(0, 18).padEnd(18);
        const ativoStr = reg.ativo ? '✓' : '✗';

        console.log(
          `│ ${idStr}│ ${tabelaStr}│ ${cpfMask}│ ${nomeStr}│ ${ativoStr}     │`
        );
      });

      console.log(
        '└────────────────────────────────────────────────────────────────┘'
      );

      console.log('\n📋 AÇÕES RECOMENDADAS:');
      console.log('1. Verificar com RH/Administração os dados corretos');
      console.log('2. Atualizar CPFs inválidos com valores corretos');
      console.log('3. Se não houver correção possível, inativar os registros');
      console.log('4. Registrar no log de conformidade LGPD');
    } else {
      console.log('\n✅ Todos os CPFs estão válidos!');
    }

    // 3. Verificar duplicatas (CPFs repetidos)
    const duplicatas = await query(`
      SELECT cpf, COUNT(*) as total
      FROM funcionarios
      GROUP BY cpf
      HAVING COUNT(*) > 1
    `);

    if (duplicatas && duplicatas.rows && duplicatas.rows.length > 0) {
      console.log('\n⚠️  DUPLICATAS ENCONTRADAS:\n');
      console.log('┌─────────────────────────────┐');
      console.log('│ CPF Mascarado │ Total       │');
      console.log('├─────────────────────────────┤');

      duplicatas.rows.forEach((dup) => {
        const cpfMask = (
          mascararCPFParaLog(dup.cpf) ?? String(dup.cpf ?? '')
        ).padEnd(14);
        console.log(`│ ${cpfMask}│ ${dup.total}           │`);
      });

      console.log('└─────────────────────────────┘');
    }

    // 4. Estatísticas gerais
    console.log('\n' + '='.repeat(80));
    console.log('📊 ESTATÍSTICAS GERAIS');
    console.log('='.repeat(80));

    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as ativos,
        COUNT(*) FILTER (WHERE ativo = false) as inativos,
        COUNT(DISTINCT clinica_id) as clinicas,
        COUNT(DISTINCT empresa_id) as empresas
      FROM funcionarios
    `);

    const s =
      stats && stats.rows && stats.rows[0]
        ? stats.rows[0]
        : { total: 0, ativos: 0, inativos: 0, clinicas: 0, empresas: 0 };

    console.log(`\nTotal de funcionários: ${s.total}`);
    console.log(`├─ Ativos: ${s.ativos}`);
    console.log(`└─ Inativos: ${s.inativos}`);
    console.log(`\nClínicas: ${s.clinicas}`);
    console.log(`Empresas: ${s.empresas}`);

    // 5. Gerar arquivo de log e relatório
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logData = {
      data_auditoria: new Date().toISOString(),
      total_funcionarios: funcionarios.rows.length,
      cpfs_validos: cpfsValidos.length,
      cpfs_invalidos: cpfsInvalidos.length,
      registros_invalidos: cpfsInvalidos.map((r) => ({
        tabela: r.tabela,
        id: r.id,
        cpf_mascarado: mascararCPFParaLog(r.cpf),
        nome: r.nome,
        email: r.email,
        ativo: r.ativo,
      })),
      duplicatas: (duplicatas && duplicatas.rows ? duplicatas.rows : []).map(
        (d) => ({
          cpf_mascarado: mascararCPFParaLog(d.cpf),
          total: d.total,
        })
      ),
    };

    // Salvar log JSON (sincrono para compatibilidade com mocks de teste)
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `auditoria-cpf-${timestamp}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    // Gerar relatório textual (síncrono)
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });

    let reportContent = '';
    reportContent += 'RELATÓRIO DE AUDITORIA DE CPFs - LGPD\n';
    reportContent += '='.repeat(80) + '\n\n';
    reportContent += `Total de funcionários: ${funcionarios.rows.length}\n`;
    reportContent += `CPFs válidos: ${cpfsValidos.length}\n`;
    reportContent += `CPFs inválidos: ${cpfsInvalidos.length}\n\n`;

    if (cpfsValidos.length > 0) {
      reportContent += 'CPFs Válidos:\n';
      cpfsValidos.forEach((r) => {
        let mask =
          (r as any).cpf_mascarada ??
          mascararCPFParaLog(r.cpf) ??
          String(r.cpf ?? '');
        if (mask === String(r.cpf)) {
          // fallback: manter apenas os 4 últimos dígitos mascarados
          mask = `*******${String(r.cpf).slice(-4)}`;
        }
        reportContent += `${mask} - ${r.nome}\n`;
      });
      reportContent += '\n';
    }

    if (cpfsInvalidos.length > 0) {
      reportContent += 'CPFs Inválidos:\n';
      cpfsInvalidos.forEach((r) => {
        let mask =
          (r as any).cpf_mascarada ??
          mascararCPFParaLog(r.cpf) ??
          String(r.cpf ?? '');
        if (mask === String(r.cpf)) {
          mask = `*******${String(r.cpf).slice(-4)}`;
        }
        reportContent += `${mask} - ${r.nome}\n`;
      });
      reportContent += '\n';
    }

    if (duplicatas && duplicatas.rows && duplicatas.rows.length > 0) {
      reportContent += 'Duplicatas:\n';
      duplicatas.rows.forEach((d) => {
        reportContent += `${mascararCPFParaLog(d.cpf)} - ${d.total}\n`;
      });
      reportContent += '\n';
    }

    const reportPath = path.join(
      reportsDir,
      `relatorio-auditoria-cpfs-${timestamp}.txt`
    );
    fs.writeFileSync(reportPath, reportContent);

    console.log(`\n💾 Log de auditoria salvo em: ${logPath}`);
    console.log('\n' + '='.repeat(80));
    console.log('✅ Auditoria concluída');
    console.log('='.repeat(80) + '\n');

    // Retornar resultados (não lançar para permitir que testes avaliem o output)
    const duplicatesCount =
      duplicatas && duplicatas.rows ? duplicatas.rows.length : 0;

    const result = {
      totalFuncionarios: funcionarios.rows.length,
      cpfsValidos: cpfsValidos.length,
      cpfsInvalidos: cpfsInvalidos.length,
      totalAvaliacoes: totalAvaliacoes,
      duplicatasCount: duplicatesCount,
      relatorioGerado: true,
    };

    // Se a função for chamada internamente, retornamos o resultado para o test
    if (require.main !== module) {
      return result;
    }

    // Se executando como CLI, falhar com exit code 1 se houver problemas
    if (result.cpfsInvalidos > 0 || duplicatesCount > 0) {
      console.error('CPFs inválidos ou duplicatas encontradas');
      process.exit(1);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro durante auditoria de CPFs:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Exportar função para testes
export { auditarCPFs };

// Executar auditoria se chamado diretamente
if (require.main === module) {
  auditarCPFs()
    .then((result) => {
      // Se houver problemas detectados, usar exit code 1
      if (result && (result.cpfsInvalidos > 0 || result.duplicatasCount > 0)) {
        process.exit(1);
      }

      console.log('Auditoria finalizada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}
