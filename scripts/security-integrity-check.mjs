import { query } from "../lib/db.js";

/**
 * Script de Verificação de Integridade de Segurança
 * Executa verificações periódicas para detectar inconsistências
 */

export async function runSecurityIntegrityCheck() {
  const issues = [];

  console.log("🔍 Iniciando verificação de integridade de segurança...");

  try {
    // 1. Verificar usuários sem clínica_id quando deveriam ter
    const usersWithoutClinic = await query(`
      SELECT COUNT(*) as count
      FROM funcionarios
      WHERE (perfil = 'rh' OR perfil = 'funcionario')
      AND clinica_id IS NULL
      AND ativo = true
    `);

    if (parseInt(usersWithoutClinic.rows[0].count) > 0) {
      issues.push({
        severity: "high",
        category: "MISSING_CLINIC_ASSOCIATION",
        description: "Usuários RH/Funcionário ativos sem associação de clínica",
        affectedRecords: parseInt(usersWithoutClinic.rows[0].count),
        recommendation:
          "Associar usuários a clínicas apropriadas ou desativá-los",
      });
    }

    // 2. Verificar clínicas inexistentes referenciadas
    const invalidClinicRefs = await query(`
      SELECT COUNT(*) as count
      FROM funcionarios f
      LEFT JOIN clinicas c ON c.id = f.clinica_id
      WHERE f.clinica_id IS NOT NULL
      AND c.id IS NULL
    `);

    if (parseInt(invalidClinicRefs.rows[0].count) > 0) {
      issues.push({
        severity: "critical",
        category: "INVALID_CLINIC_REFERENCE",
        description: "Usuários referenciando clínicas inexistentes",
        affectedRecords: parseInt(invalidClinicRefs.rows[0].count),
        recommendation: "Corrigir clinica_id ou remover usuários órfãos",
      });
    }

    // 3. Verificar funcionários em empresas de outras clínicas
    const crossClinicEmployees = await query(`
      SELECT COUNT(*) as count
      FROM funcionarios f
      JOIN empresas_clientes e ON e.id = f.empresa_id
      WHERE f.empresa_id IS NOT NULL
      AND f.clinica_id != e.clinica_id
    `);

    if (parseInt(crossClinicEmployees.rows[0].count) > 0) {
      issues.push({
        severity: "high",
        category: "CROSS_CLINIC_EMPLOYEE",
        description: "Funcionários associados a empresas de outras clínicas",
        affectedRecords: parseInt(crossClinicEmployees.rows[0].count),
        recommendation:
          "Reassociar funcionários à clínica correta ou mover empresas",
      });
    }

    // 4. Verificar múltiplos RH ativos na mesma clínica
    const multipleRH = await query(`
      SELECT clinica_id, COUNT(*) as rh_count
      FROM funcionarios
      WHERE perfil = 'rh' AND ativo = true
      GROUP BY clinica_id
      HAVING COUNT(*) > 1
    `);

    if (multipleRH.rows.length > 0) {
      issues.push({
        severity: "medium",
        category: "MULTIPLE_ACTIVE_RH",
        description: "Clínicas com múltiplos gestores RH ativos",
        affectedRecords: multipleRH.rows.length,
        recommendation: "Revisar política: apenas um RH ativo por clínica",
      });
    }

    // 5. Verificar empresas sem funcionários ativos
    const emptyCompanies = await query(`
      SELECT COUNT(*) as count
      FROM empresas_clientes e
      WHERE NOT EXISTS (
        SELECT 1 FROM funcionarios f
        WHERE f.empresa_id = e.id AND f.ativo = true
      )
    `);

    if (parseInt(emptyCompanies.rows[0].count) > 0) {
      issues.push({
        severity: "low",
        category: "EMPTY_COMPANIES",
        description: "Empresas sem funcionários ativos",
        affectedRecords: parseInt(emptyCompanies.rows[0].count),
        recommendation: "Considerar desativação ou remoção de empresas vazias",
      });
    }

    console.log(
      `✅ Verificação concluída. ${issues.length} problemas encontrados.`
    );

    return {
      passed: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error("❌ Erro na verificação de integridade:", error);
    issues.push({
      severity: "critical",
      category: "CHECK_FAILURE",
      description: `Erro ao executar verificação: ${error.message}`,
      affectedRecords: 0,
      recommendation: "Investigar erro no sistema de verificação",
    });

    return {
      passed: false,
      issues,
    };
  }
}

/**
 * Script executável para linha de comando
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityIntegrityCheck()
    .then((result) => {
      if (result.passed) {
        console.log("✅ Todas as verificações passaram!");
        process.exit(0);
      } else {
        console.log("❌ Problemas encontrados:");
        result.issues.forEach((issue, index) => {
          console.log(
            `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}`
          );
          console.log(`   ${issue.description}`);
          console.log(`   Registros afetados: ${issue.affectedRecords}`);
          console.log(`   Recomendação: ${issue.recommendation}`);
          console.log("");
        });
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Erro fatal:", error);
      process.exit(1);
    });
}
