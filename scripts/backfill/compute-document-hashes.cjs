#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function runSql(query) {
  const cmd = `psql -U postgres -d nr-bps_db -t -A -c "${query.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function sha256File(filePath) {
  const b = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(b).digest('hex');
}

function sizeFile(filePath) {
  return fs.statSync(filePath).size;
}

function getDocsToProcess() {
  const q = `SELECT id, caminho_arquivo FROM documentos_contratacao WHERE hash_original IS NULL`;
  const out = runSql(q);
  if (!out) return [];
  const lines = out.split('\n');
  return lines.map((l) => {
    const [id, caminho] = l.split('|');
    return { id: parseInt(id, 10), caminho };
  });
}

async function main() {
  console.log('Iniciando compute-document-hashes (dryRun=', dryRun, ')');
  const docs = getDocsToProcess();
  console.log(`Encontrados ${docs.length} documentos sem hash`);

  for (const d of docs) {
    const caminho = d.caminho;
    const resolved = path.isAbsolute(caminho)
      ? caminho
      : path.join(process.cwd(), caminho);
    if (!fs.existsSync(resolved)) {
      console.warn(`Arquivo não encontrado: ${resolved} (id=${d.id})`);
      continue;
    }

    try {
      const hash = sha256File(resolved);
      const size = sizeFile(resolved);
      console.log(
        `ID ${d.id}: hash=${hash.substring(0, 16)}..., tamanho=${Math.round(size / 1024)}KB`
      );

      if (!dryRun) {
        const upd = `UPDATE documentos_contratacao SET hash_original = '${hash}', tamanho_bytes = ${size}, atualizado_em = NOW() WHERE id = ${d.id}`;
        runSql(upd);
      }
    } catch (err) {
      console.error(`Erro processando id=${d.id}:`, err.message);
    }
  }

  console.log('compute-document-hashes finalizado');
}

main();
