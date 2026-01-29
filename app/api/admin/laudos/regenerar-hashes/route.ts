/**
 * API para regenerar hashes de laudos
 * POST /api/admin/laudos/regenerar-hashes
 *
 * Calcula o hash SHA-256 de laudos que não possuem hash
 * Requer perfil admin
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface LaudoSemHash {
  id: number;
  lote_id: number;
  status: string;
}

async function calcularHashDoArquivo(laudoId: number): Promise<string | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );

    await fs.access(filePath);
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return hash;
  } catch {
    return null;
  }
}

export async function POST(_req: Request) {
  try {
    // Verificar autenticação e permissão
    const user = await requireRole('admin');
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso negado', success: false },
        { status: 403 }
      );
    }

    console.log(
      `[ADMIN] ${user.nome} (${user.cpf}) iniciou regeneração de hashes de laudos`
    );

    // Buscar laudos sem hash
    const resultado = await query(
      `SELECT id, lote_id, status
       FROM laudos
       WHERE hash_pdf IS NULL OR hash_pdf = ''
       ORDER BY id ASC
       LIMIT 100`, // Limitar para evitar timeout em produção
      []
    );

    const laudosSemHash: LaudoSemHash[] = resultado.rows;

    if (laudosSemHash.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os laudos já possuem hash',
        processados: 0,
        atualizados: 0,
        erros: 0,
      });
    }

    let processados = 0;
    let atualizados = 0;
    let erros = 0;
    const detalhes: Array<{
      laudoId: number;
      status: 'atualizado' | 'erro' | 'arquivo_nao_encontrado';
      hash?: string;
      erro?: string;
    }> = [];

    // Processar cada laudo
    for (const laudo of laudosSemHash) {
      processados++;

      try {
        const hash = await calcularHashDoArquivo(laudo.id);

        if (hash) {
          await query(
            `UPDATE laudos 
             SET hash_pdf = $1, atualizado_em = NOW() 
             WHERE id = $2 AND (hash_pdf IS NULL OR hash_pdf = '')`,
            [hash, laudo.id]
          );

          atualizados++;
          detalhes.push({
            laudoId: laudo.id,
            status: 'atualizado',
            hash: hash.substring(0, 16) + '...',
          });
        } else {
          erros++;
          detalhes.push({
            laudoId: laudo.id,
            status: 'arquivo_nao_encontrado',
          });
        }
      } catch (err) {
        erros++;
        detalhes.push({
          laudoId: laudo.id,
          status: 'erro',
          erro: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    console.log(
      `[ADMIN] Regeneração de hashes concluída: ${atualizados}/${processados} atualizados`
    );

    return NextResponse.json({
      success: true,
      message: `Processados ${processados} laudos. ${atualizados} hashes atualizados.`,
      processados,
      atualizados,
      erros,
      detalhes,
    });
  } catch (error) {
    console.error('Erro ao regenerar hashes:', error);
    return NextResponse.json(
      {
        error: 'Erro ao regenerar hashes',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
