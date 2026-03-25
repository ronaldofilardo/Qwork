/**
 * POST /api/representante/equipe/vendedores/[id]/documentos
 * Upload de documento para vendedor existente (multipart/form-data).
 *
 * Body (FormData):
 *   - tipo: 'cad' | 'nf_rpa'
 *   - arquivo: File (PDF, JPG, PNG — máx 3MB)
 *
 * Segurança: representante autenticado + vendedor vinculado via hierarquia_comercial
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';
import { validarArquivo } from '@/app/api/public/representantes/cadastro/helpers';
import {
  uploadDocumentoVendedor,
  type SubpastaVendedor,
} from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Parse multipart
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Envie os dados como multipart/form-data' },
        { status: 400 }
      );
    }

    const tipo = (formData.get('tipo') as string | null)?.trim();
    if (!tipo || !['cad', 'nf_rpa'].includes(tipo))
      return NextResponse.json(
        { error: 'tipo deve ser "cad" ou "nf_rpa"' },
        { status: 400 }
      );

    const arquivo = formData.get('arquivo') as File | null;
    const valArquivo = await validarArquivo(arquivo, 'Documento');
    if (!valArquivo.valid)
      return NextResponse.json(
        { error: valArquivo.error, field: 'arquivo' },
        { status: 400 }
      );

    // Sessão RLS
    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Validar vínculo: vendedor pertence a este representante?
    const vinculo = await query<{ id: number }>(
      `SELECT hc.id
       FROM hierarquia_comercial hc
       WHERE hc.vendedor_id = $1 AND hc.representante_id = $2 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );
    if (vinculo.rows.length === 0)
      return NextResponse.json(
        { error: 'Vendedor não encontrado ou sem vínculo ativo.' },
        { status: 403 }
      );

    // Buscar dados do representante
    const repData = await query<{ tipo_pessoa: string; cpf: string | null; cnpj: string | null }>(
      `SELECT tipo_pessoa, cpf, cnpj FROM public.representantes WHERE id = $1`,
      [sess.representante_id],
      rlsSess
    );
    if (repData.rows.length === 0)
      return NextResponse.json({ error: 'Representante não encontrado.' }, { status: 404 });

    const rep = repData.rows[0];
    const repTipoPessoa = rep.tipo_pessoa as 'pf' | 'pj';
    const repIdentificador = repTipoPessoa === 'pj' ? (rep.cnpj ?? rep.cpf ?? '') : (rep.cpf ?? '');

    // Buscar dados do vendedor
    const vndData = await query<{
      cpf: string;
      tipo_pessoa: string;
      cnpj: string | null;
    }>(
      `SELECT u.cpf, vp.tipo_pessoa, vp.cnpj
       FROM public.usuarios u
       JOIN public.vendedores_perfil vp ON vp.usuario_id = u.id
       WHERE u.id = $1`,
      [vendedorId],
      rlsSess
    );
    if (vndData.rows.length === 0)
      return NextResponse.json({ error: 'Vendedor não encontrado.' }, { status: 404 });

    const vnd = vndData.rows[0];
    const vendedorIdentificador = vnd.tipo_pessoa === 'pj' && vnd.cnpj ? vnd.cnpj : vnd.cpf;

    // Determinar subpasta e tipo de doc
    let subpasta: SubpastaVendedor;
    let docTipo: string;
    if (tipo === 'cad') {
      subpasta = 'CAD';
      docTipo = vnd.tipo_pessoa === 'pf' ? 'cpf' : 'cnpj';
    } else {
      // nf_rpa
      subpasta = vnd.tipo_pessoa === 'pj' ? 'NF' : 'RPA';
      docTipo = vnd.tipo_pessoa === 'pj' ? 'nf' : 'rpa';
    }

    // Upload
    const result = await uploadDocumentoVendedor({
      buffer: valArquivo.buffer!,
      tipo: docTipo as 'cpf' | 'cnpj' | 'cpf_responsavel' | 'nf' | 'rpa',
      repIdentificador,
      repTipoPessoa,
      vendedorIdentificador,
      subpasta,
      contentType: valArquivo.contentType!,
    });

    const docPath = result.arquivo_remoto?.key ?? result.path;

    // Atualizar campo no perfil
    const coluna = tipo === 'cad' ? 'doc_cad_path' : 'doc_nf_rpa_path';
    await query(
      `UPDATE public.vendedores_perfil SET ${coluna} = $1, atualizado_em = CURRENT_TIMESTAMP WHERE usuario_id = $2`,
      [docPath, vendedorId],
      rlsSess
    );

    return NextResponse.json({
      success: true,
      path: docPath,
      url: result.arquivo_remoto?.url ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
