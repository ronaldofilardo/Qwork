#!/usr/bin/env node

/**
 * Script de validação da organização do projeto
 * Verifica se todos os arquivos estão nas pastas corretas
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const expectedStructure = {
  "scripts/analysis": [
    "analisar-",
    "analise-",
    "identificar-",
    "investigar-",
    "listar_",
    "verificar-dados-orfaos",
  ],
  "scripts/checks": ["check-"],
  "scripts/cleanup": ["limpar-", "limpeza-", "avaliacoes-null"],
  "scripts/debug": ["debug-", "detalhes-"],
  "scripts/fixes": ["aplicar-", "corrigir-", "recriar-", "fix-"],
  "scripts/migrations": ["run_migration_", "apply_migration_"],
  "scripts/tests": ["test-", "teste-", "criar_lote_teste"],
  "scripts/updates": ["update-"],
  "scripts/verification": ["verificar-"],
  "scripts/powershell": [".ps1"],
  docs: [".md"],
  reports: ["eslint-report", "jest-results", "lighthouse-", "relatorio-"],
  "scripts/sql": [".sql"],
  database: [".backup"],
};

function checkFileOrganization() {
  console.log("🔍 Validando organização dos arquivos...\n");

  let allGood = true;
  const issues = [];

  // Verificar se arquivos estão nas pastas corretas
  for (const [folder, patterns] of Object.entries(expectedStructure)) {
    const folderPath = path.join(rootDir, folder);

    if (!fs.existsSync(folderPath)) {
      issues.push(`❌ Pasta ${folder} não existe`);
      allGood = false;
      continue;
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => !fs.statSync(path.join(folderPath, f)).isDirectory());

    for (const pattern of patterns) {
      const matchingFiles = files.filter((file) => {
        if (
          pattern.endsWith(".ps1") ||
          pattern.endsWith(".md") ||
          pattern.endsWith(".sql") ||
          pattern.endsWith(".backup")
        ) {
          return file.endsWith(pattern);
        }
        return file.startsWith(pattern) || file.includes(pattern);
      });

      if (matchingFiles.length === 0) {
        console.log(
          `⚠️  Nenhum arquivo encontrado para padrão "${pattern}" em ${folder}`
        );
      } else {
        console.log(
          `✅ ${matchingFiles.length} arquivo(s) encontrado(s) para "${pattern}" em ${folder}`
        );
      }
    }
  }

  // Verificar se não há arquivos .mjs na raiz
  const rootFiles = fs
    .readdirSync(rootDir)
    .filter(
      (f) =>
        !fs.statSync(path.join(rootDir, f)).isDirectory() && f.endsWith(".mjs")
    );

  if (rootFiles.length > 0) {
    issues.push(
      `❌ Arquivos .mjs encontrados na raiz: ${rootFiles.join(", ")}`
    );
    allGood = false;
  } else {
    console.log("✅ Nenhum arquivo .mjs na raiz");
  }

  // Verificar se não há arquivos .ps1 fora de scripts/powershell
  const ps1Files = [];
  function scanForPs1(dir, relativePath = "") {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relPath = path.join(relativePath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        if (
          item !== "node_modules" &&
          item !== ".git" &&
          item !== ".next" &&
          item !== "coverage"
        ) {
          scanForPs1(fullPath, relPath);
        }
      } else if (
        item.endsWith(".ps1") &&
        !relPath.startsWith("scripts\\powershell")
      ) {
        ps1Files.push(relPath);
      }
    }
  }
  scanForPs1(rootDir);

  if (ps1Files.length > 0) {
    issues.push(
      `❌ Arquivos .ps1 fora de scripts/powershell: ${ps1Files.join(", ")}`
    );
    allGood = false;
  } else {
    console.log("✅ Todos os arquivos .ps1 estão em scripts/powershell");
  }

  // Verificar estrutura geral
  const requiredFolders = ["scripts", "docs", "reports", "database"];
  for (const folder of requiredFolders) {
    if (!fs.existsSync(path.join(rootDir, folder))) {
      issues.push(`❌ Pasta obrigatória ${folder} não existe`);
      allGood = false;
    } else {
      console.log(`✅ Pasta ${folder} existe`);
    }
  }

  console.log("\n" + "=".repeat(50));

  if (allGood) {
    console.log("🎉 Organização do projeto está correta!");
    process.exit(0);
  } else {
    console.log("❌ Problemas encontrados:");
    issues.forEach((issue) => console.log(`   ${issue}`));
    process.exit(1);
  }
}

checkFileOrganization();
