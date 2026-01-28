#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function runBuild() {
  try {
    console.log("🚀 Executando pnpm run build...");
    const output = execSync("pnpm run build", {
      encoding: "utf8",
      stdio: "pipe",
    });
    console.log("✅ Build bem-sucedido!");
    return { success: true, output };
  } catch (error) {
    console.log("❌ Build falhou. Analisando erros...");
    return {
      success: false,
      output: error.stdout || "",
      error: error.stderr || "",
    };
  }
}

function parseBuildErrors(output) {
  const errors = [];
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar erros de módulo não encontrado
    if (line.includes("Module not found: Can't resolve")) {
      // Encontrar a linha do arquivo
      let fileLine = "";
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].startsWith("./")) {
          fileLine = lines[j].trim();
          break;
        }
      }

      if (fileLine) {
        let moduleName = "";
        // Tentar diferentes padrões de extração
        const patterns = [
          /Can't resolve '([^']*)'/,
          /Can't resolve ''([^']*)''/,
          /Can't resolve "([^"]*)"/,
          /Can't resolve ""([^"]*)"" /,
        ];

        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match && match[1]) {
            moduleName = match[1];
            break;
          }
        }

        // Fallback: procurar por módulos conhecidos no contexto
        if (!moduleName) {
          const nextLine = lines[i + 1] || "";
          if (nextLine.includes("next/server")) moduleName = "next/server";
          else if (nextLine.includes("@/lib/types/enums"))
            moduleName = "@/lib/types/enums";
          else if (line.includes("next/server")) moduleName = "next/server";
          else if (line.includes("@/lib/types/enums"))
            moduleName = "@/lib/types/enums";
        }

        if (moduleName) {
          errors.push({
            type: "module",
            file: fileLine.replace("./", ""),
            module: moduleName,
            error: line,
          });
        }
      }
    }

    // Detectar erros de TypeScript
    if (line.includes("Type error:")) {
      // Encontrar a linha do arquivo
      let fileLine = "";
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].includes(".tsx") || lines[j].includes(".ts")) {
          fileLine = lines[j].trim();
          break;
        }
      }

      if (fileLine) {
        errors.push({
          type: "typescript",
          file: fileLine,
          error: line,
          context: lines.slice(Math.max(0, i - 2), i + 3).join("\n"),
        });
      }
    }

    // Detectar warnings do ESLint
    if (line.includes("Warning:")) {
      // Encontrar a linha do arquivo
      let fileLine = "";
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].includes(".tsx") || lines[j].includes(".ts")) {
          fileLine = lines[j].trim();
          break;
        }
      }

      if (fileLine) {
        errors.push({
          type: "eslint",
          file: fileLine,
          error: line,
          context: lines.slice(Math.max(0, i - 1), i + 2).join("\n"),
        });
      }
    }
  }

  return errors;
}

function fixImportError(filePath, moduleName) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${fullPath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, "utf8");

    // Corrigir importações malformadas
    if (moduleName === "next/server") {
      // Corrigir import from "'next/server'" para 'next/server'
      content = content.replace(/from "'next\/server'"/g, "from 'next/server'");

      // Adicionar NextRequest se não estiver presente e for usado
      if (
        content.includes("NextRequest") &&
        !content.includes("NextRequest,")
      ) {
        content = content.replace(
          /import \{([^}]*)\} from 'next\/server'/g,
          "import { NextRequest, $1 } from 'next/server'"
        );
      }
    } else if (moduleName.startsWith("@/")) {
      // Corrigir outras importações com aspas duplas
      const escapedModule = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      content = content.replace(
        new RegExp(`from "'${escapedModule}'"`, "g"),
        `from '${moduleName}'`
      );
    }

    // Corrigir catch blocks sem parâmetros
    content = content.replace(
      /}\s*catch\s*\{([^}]*?error[^}]*?)\}/gs,
      (match, catchBody) => {
        // Verificar se já tem parâmetro
        if (match.includes("catch (")) return match;

        // Adicionar parâmetro error
        return match.replace("catch {", "catch (error) {");
      }
    );

    fs.writeFileSync(fullPath, content);
    console.log(`🔧 Corrigido: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ Erro ao corrigir ${filePath}: ${error.message}`);
    return false;
  }
}

async function autoFixBuild() {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔄 Tentativa ${attempts}/${maxAttempts}`);

    const result = runBuild();

    if (result.success) {
      console.log("🎉 Build corrigido com sucesso!");
      return true;
    }

    const errors = parseBuildErrors(result.output + (result.error || ""));

    if (errors.length === 0) {
      console.log(
        "❌ Erros encontrados mas não puderam ser analisados automaticamente"
      );
      console.log("Output do build:");
      console.log(result.output);
      return false;
    }

    console.log(`📋 Encontrados ${errors.length} erros:`);
    errors.forEach((error) => {
      if (error.type === "module") {
        console.log(`  - [MÓDULO] ${error.file}: ${error.module}`);
      } else if (error.type === "typescript") {
        console.log(`  - [TYPESCRIPT] ${error.file}: ${error.error}`);
      } else if (error.type === "eslint") {
        console.log(`  - [ESLINT] ${error.file}: ${error.error}`);
      }
    });

    let fixedCount = 0;
    for (const error of errors) {
      if (error.type === "module") {
        if (fixImportError(error.file, error.module)) {
          fixedCount++;
        }
      } else {
        console.log(
          `⚠️  Tipo de erro não suportado automaticamente: ${error.type}`
        );
      }
    }

    if (fixedCount === 0) {
      console.log("❌ Nenhum erro pôde ser corrigido automaticamente");
      return false;
    }

    console.log(
      `✅ ${fixedCount} erros corrigidos. Tentando build novamente...`
    );
  }

  console.log("❌ Máximo de tentativas atingido");
  return false;
}

// Executar se chamado diretamente
if (require.main === module) {
  autoFixBuild().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { autoFixBuild, runBuild, parseBuildErrors, fixImportError };
