#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script de teste: Download de laudo do Backblaze
 * Testa download direto e via presigned URL
 */
import { downloadFromBackblaze, getPresignedUrl } from '@/lib/storage/backblaze-client';
import { lerLaudo, lerMetadados } from '@/lib/storage/laudo-storage';
import fs from 'fs/promises';

async function main() {
  const laudoId = Number(process.argv[2] || '5');
  
  console.log(`\n[TEST] Testando download do laudo ${laudoId}...\n`);

  // 1. Ler metadados
  console.log('[1/4] Lendo metadados locais...');
  const meta = await lerMetadados(laudoId);
  if (!meta) {
    console.error(`❌ Metadados não encontrados para laudo ${laudoId}`);
    process.exit(1);
  }
  
  console.log(`✅ Metadados encontrados:`);
  console.log(`   - Arquivo: ${meta.arquivo}`);
  console.log(`   - Hash: ${meta.hash}`);
  console.log(`   - Criado em: ${meta.criadoEm}`);
  
  if (!meta.arquivo_remoto) {
    console.error(`❌ Laudo ${laudoId} não foi sincronizado para Backblaze`);
    process.exit(1);
  }
  
  console.log(`   - Remoto: ${meta.arquivo_remoto.provider}`);
  console.log(`   - Bucket: ${meta.arquivo_remoto.bucket}`);
  console.log(`   - Key: ${meta.arquivo_remoto.key}`);
  console.log(`   - URL: ${meta.arquivo_remoto.url}`);

  // 2. Download direto via SDK
  console.log(`\n[2/4] Testando download direto via SDK...`);
  try {
    const buffer = await downloadFromBackblaze(meta.arquivo_remoto.key);
    console.log(`✅ Download bem-sucedido: ${buffer.length} bytes`);
    
    // Verificar hash
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (hash === meta.hash) {
      console.log(`✅ Hash verificado: OK`);
    } else {
      console.warn(`⚠️  Hash divergente:`);
      console.warn(`   Esperado: ${meta.hash}`);
      console.warn(`   Obtido:   ${hash}`);
    }
  } catch (err) {
    console.error(`❌ Erro no download direto:`, err instanceof Error ? err.message : String(err));
  }

  // 3. Gerar presigned URL
  console.log(`\n[3/4] Gerando presigned URL (15 min)...`);
  try {
    const presignedUrl = await getPresignedUrl(meta.arquivo_remoto.key, 900);
    console.log(`✅ URL gerada com sucesso:`);
    console.log(`   ${presignedUrl.substring(0, 100)}...`);
  } catch (err) {
    console.error(`❌ Erro ao gerar URL:`, err instanceof Error ? err.message : String(err));
  }

  // 4. Testar função lerLaudo (fallback híbrido)
  console.log(`\n[4/4] Testando função lerLaudo() (local + remoto)...`);
  try {
    const buffer = await lerLaudo(laudoId);
    console.log(`✅ Laudo lido com sucesso: ${buffer.length} bytes`);
  } catch (err) {
    console.error(`❌ Erro ao ler laudo:`, err instanceof Error ? err.message : String(err));
  }

  console.log(`\n✅ Teste concluído com sucesso!\n`);
}

main().catch((err) => {
  console.error('[TEST] Erro inesperado:', err);
  process.exit(1);
});
