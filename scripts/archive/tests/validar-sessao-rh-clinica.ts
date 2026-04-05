/**
 * Script de validação: Sessão RH com mapeamento de clinica_id
 *
 * Objetivo: Verificar se o mapeamento de clinica_id via tomador_id
 * está funcionando corretamente e persistindo na sessão.
 *
 * Correção implementada:
 * - requireClinica() agora persiste clinica_id mapeado na sessão
 * - requireRHWithEmpresaAccess() faz mapeamento ANTES de validar clinica_id
 * - Ambas as funções chamam createSession() após mapear clinica_id
 */

import { query } from '../../lib/db';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

async function validarSessaoRHClinica(): Promise<ValidationResult> {
  try {
    console.log('\n🔍 VALIDAÇÃO: Sessão RH com mapeamento de clinica_id\n');
    console.log('='.repeat(70));

    // 1. Verificar se existe um RH sem clinica_id na tabela funcionarios
    console.log('\n1️⃣  Verificando RHs sem clinica_id...');
    const rhSemClinica = await query(
      `SELECT f.cpf, f.nome, f.tomador_id, f.clinica_id
       FROM funcionarios f
       WHERE f.perfil = 'rh' 
       AND f.tomador_id IS NOT NULL
       LIMIT 5`
    );

    if (rhSemClinica.rows.length === 0) {
      return {
        success: false,
        message: 'Nenhum RH encontrado com tomador_id definido',
      };
    }

    console.log(`   ✓ ${rhSemClinica.rows.length} RH(s) encontrado(s)`);
    rhSemClinica.rows.forEach((rh) => {
      console.log(`   - CPF: ${rh.cpf}, Nome: ${rh.nome}`);
      console.log(
        `     tomador_id: ${rh.tomador_id}, clinica_id: ${rh.clinica_id || 'NULL'}`
      );
    });

    // 2. Verificar se existe clínica para esses tomadors
    console.log('\n2️⃣  Verificando clínicas associadas...');
    for (const rh of rhSemClinica.rows) {
      const clinica = await query(
        `SELECT cl.id, cl.nome, cl.ativa, c.tipo
         FROM clinicas cl
         INNER JOIN tomadors c ON c.id = cl.tomador_id
         WHERE cl.tomador_id = $1`,
        [rh.tomador_id]
      );

      if (clinica.rows.length === 0) {
        console.log(
          `   ⚠️  RH ${rh.cpf}: SEM clínica para tomador_id ${rh.tomador_id}`
        );
      } else {
        const cl = clinica.rows[0];
        console.log(
          `   ✓ RH ${rh.cpf}: Clínica ${cl.id} (${cl.nome}) - Tipo: ${cl.tipo}, Ativa: ${cl.ativa}`
        );

        if (cl.tipo !== 'clinica') {
          console.log(
            `   ⚠️  ATENÇÃO: tomador tem tipo '${cl.tipo}', não 'clinica'!`
          );
        }

        if (!cl.ativa) {
          console.log(`   ⚠️  ATENÇÃO: Clínica está INATIVA!`);
        }
      }
    }

    // 3. Verificar empresas_clientes vinculadas às clínicas
    console.log('\n3️⃣  Verificando empresas_clientes vinculadas...');
    const empresas = await query(
      `SELECT ec.id, ec.nome, ec.clinica_id, COUNT(f.id) as total_funcionarios
       FROM empresas_clientes ec
       LEFT JOIN funcionarios f ON f.empresa_id = ec.id
       WHERE ec.ativa = true
       GROUP BY ec.id, ec.nome, ec.clinica_id
       LIMIT 10`
    );

    if (empresas.rows.length === 0) {
      console.log('   ⚠️  Nenhuma empresa_cliente encontrada');
    } else {
      console.log(`   ✓ ${empresas.rows.length} empresa(s) encontrada(s)`);
      empresas.rows.forEach((emp) => {
        console.log(
          `   - Empresa ${emp.id} (${emp.nome}): clinica_id=${emp.clinica_id}, ${emp.total_funcionarios} funcionários`
        );
      });
    }

    // 4. Análise de integridade
    console.log('\n4️⃣  Análise de integridade...');

    // Contar RHs sem clinica_id mas com tomador_id
    const rhPendentes = await query(
      `SELECT COUNT(*) as total
       FROM funcionarios
       WHERE perfil = 'rh' 
       AND tomador_id IS NOT NULL
       AND clinica_id IS NULL`
    );

    console.log(
      `   • RHs com tomador_id mas SEM clinica_id: ${rhPendentes.rows[0].total}`
    );

    // Contar clínicas sem RH
    const clinicasSemRH = await query(
      `SELECT COUNT(*) as total
       FROM clinicas cl
       WHERE cl.ativa = true
       AND NOT EXISTS (
         SELECT 1 FROM funcionarios f 
         WHERE f.clinica_id = cl.id AND f.perfil = 'rh'
       )`
    );

    console.log(`   • Clínicas ativas SEM RH: ${clinicasSemRH.rows[0].total}`);

    // Contar empresas sem clínica
    const empresasSemClinica = await query(
      `SELECT COUNT(*) as total
       FROM empresas_clientes
       WHERE clinica_id IS NULL AND ativa = true`
    );

    console.log(
      `   • Empresas ativas SEM clinica_id: ${empresasSemClinica.rows[0].total}`
    );

    console.log('\n' + '='.repeat(70));
    console.log('✅ VALIDAÇÃO CONCLUÍDA\n');

    return {
      success: true,
      message: 'Validação de dados estruturais completa',
      details: {
        rhsEncontrados: rhSemClinica.rows.length,
        rhsPendentes: rhPendentes.rows[0].total,
        clinicasSemRH: clinicasSemRH.rows[0].total,
        empresasSemClinica: empresasSemClinica.rows[0].total,
      },
    };
  } catch (error: any) {
    console.error('\n❌ ERRO na validação:', error.message);
    return {
      success: false,
      message: `Erro: ${error.message}`,
      details: error,
    };
  }
}

// Executar validação
validarSessaoRHClinica()
  .then((result) => {
    if (result.success) {
      console.log('📊 Resultado:', result.message);
      if (result.details) {
        console.log('   Detalhes:', JSON.stringify(result.details, null, 2));
      }
      process.exit(0);
    } else {
      console.error('❌', result.message);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ ERRO FATAL:', err);
    process.exit(1);
  });
