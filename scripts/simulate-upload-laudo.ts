import { config } from 'dotenv';
config({ path: '.env.development' });

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import { uploadToBackblaze } from '@/lib/storage/backblaze-client';
import { salvarLaudoLocal, calcularHash } from '@/lib/storage/laudo-storage';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';

function usage() {
  console.log(
    `Usage: node scripts/simulate-upload-laudo.ts --file <path> --emissor <cpf> --senha <senha>`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  const emissorIndex = args.indexOf('--emissor');
  const senhaIndex = args.indexOf('--senha');

  const fileArg = fileIndex >= 0 ? args[fileIndex + 1] : 'README.md';
  const emissorCpf = emissorIndex >= 0 ? args[emissorIndex + 1] : '53051173991';
  const emissorSenha = senhaIndex >= 0 ? args[senhaIndex + 1] : '123';

  if (!fileArg) {
    usage();
    process.exit(1);
  }

  const inputPath = path.join(process.cwd(), fileArg);
  console.log(`[SIMULATE] Arquivo de entrada: ${inputPath}`);
  console.log(`[SIMULATE] Emissor (simulado): ${emissorCpf} / ${emissorSenha}`);

  // Ler ou gerar PDF
  let pdfBuffer: Buffer;
  const ext = path.extname(inputPath).toLowerCase();
  try {
    if (ext === '.pdf') {
      pdfBuffer = await fs.readFile(inputPath);
      console.log('[SIMULATE] PDF lido diretamente do arquivo');
    } else {
      // Gerar PDF simples a partir do conteúdo do arquivo usando jsPDF (mais rápido que Puppeteer para testes)
      console.log('[SIMULATE] Arquivo não é PDF — gerando PDF via jsPDF');
      const raw = await fs.readFile(inputPath, 'utf-8');
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      // Colocar até 10000 caracteres (simples) para evitar overflow
      const text = raw.substring(0, 10000);
      const maxWidth = 550;
      const lineHeight = 12;
      const marginLeft = 40;
      let cursorY = 40;

      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        doc.text(line, marginLeft, cursorY);
        cursorY += lineHeight;
        if (cursorY > 800) {
          doc.addPage();
          cursorY = 40;
        }
      }

      const arrayBuffer = doc.output('arraybuffer');
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log('[SIMULATE] PDF gerado via jsPDF');
    }
  } catch (err) {
    console.error('[SIMULATE] Falha ao ler/gerar PDF:', err);
    process.exit(1);
  }

  const hash = calcularHash(pdfBuffer);

  // Gerar um laudoId temporário baseado em timestamp
  const laudoId = Date.now();
  const loteId = Math.floor(Math.random() * 1000) + 1;

  // Salvar localmente
  try {
    await salvarLaudoLocal(laudoId, pdfBuffer, hash);
  } catch (err) {
    console.error('[SIMULATE] Falha ao salvar localmente:', err);
    process.exit(1);
  }

  // Tentar upload real se Backblaze estiver configurado
  const keyId = process.env.BACKBLAZE_KEY_ID;
  const appKey = process.env.BACKBLAZE_APPLICATION_KEY;

  if (keyId && appKey) {
    console.log(
      '[SIMULATE] Credenciais Backblaze detectadas — tentando upload real'
    );
    try {
      const timestamp = Date.now();
      const key = `laudos/lote-${loteId}/laudo-${timestamp}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      const res = await uploadToBackblaze(pdfBuffer, key, 'application/pdf');
      console.log('[SIMULATE] Upload realizado com sucesso:', res);

      // Atualizar metadados locais
      const metaPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudoId}.json`
      );
      const metaRaw = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(metaRaw);
      meta.arquivo_remoto = { ...res, uploadedAt: new Date().toISOString() };
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

      console.log(`[SIMULATE] Metadados locais atualizados com arquivo remoto`);
      process.exit(0);
    } catch (err) {
      console.error('[SIMULATE] Upload real falhou:', err);
      console.log('[SIMULATE] Continuando com simulação local');
    }
  }

  // Simulação: preencher metadados com URL simulada
  try {
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);

    const provider = process.env.BACKBLAZE_PROVIDER || 's2';
    const endpoint =
      process.env.BACKBLAZE_ENDPOINT ||
      process.env.BACKBLAZE_S2_ENDPOINT ||
      'https://s3.us-east-1.backblazeb2.com';
    const bucket = process.env.BACKBLAZE_BUCKET || 'laudos-qwork';
    const key = `laudos/lote-${loteId}/laudo-${Date.now()}-simulated.pdf`;

    meta.arquivo_remoto = {
      provider: 'backblaze',
      bucket,
      key,
      url: `${endpoint}/${bucket}/${key}`,
      uploadedAt: new Date().toISOString(),
    };

    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

    console.log(
      '[SIMULATE] Simulação concluída — metadados atualizados com arquivo_remoto simulado:'
    );
    console.log(JSON.stringify(meta.arquivo_remoto, null, 2));
    console.log(
      `[SIMULATE] Laudo salvo local: storage/laudos/laudo-${laudoId}.pdf`
    );
    process.exit(0);
  } catch (err) {
    console.error('[SIMULATE] Falha ao atualizar metadados simulados:', err);
    process.exit(1);
  }
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

main().catch((e) => {
  console.error('Erro não tratado:', e);
  process.exit(1);
});
