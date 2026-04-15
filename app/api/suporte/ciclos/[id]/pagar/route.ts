/**
 * POST /api/suporte/ciclos/[id]/pagar
 *
 * Suporte registra pagamento de um ciclo (nf_aprovada → pago).
 * Aceita comprovante de pagamento (PDF, PNG, JPG, WEBP — máx 5MB).
 * Armazena o comprovante e chama registrarPagamentoCiclo() que também
 * cascateia os status das comissões individuais: liberada → paga.
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { registrarPagamentoCiclo } from '@/lib/db/comissionamento/ciclos';
import { uploadDocumentoRepresentante } from '@/lib/storage/representante-storage';

export const dynamic = 'force-dynamic';

const COMPROVANTE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const COMPROVANTE_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('comprovante') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Campo "comprovante" obrigatório.' },
        { status: 400 }
      );
    }

    if (file.size > COMPROVANTE_MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Arquivo excede 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
        },
        { status: 400 }
      );
    }

    if (!COMPROVANTE_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo não aceito: ${file.type}. Use PDF, PNG, JPG ou WEBP.` },
        { status: 400 }
      );
    }

    // Buscar ciclo + dados do representante para o path de storage
    const cicloResult = await query(
      `SELECT c.id, c.status, c.representante_id,
              r.tipo_pessoa, r.cpf, r.cnpj
       FROM ciclos_comissao c
       JOIN representantes r ON r.id = c.representante_id
       WHERE c.id = $1 LIMIT 1`,
      [id]
    );

    if (cicloResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ciclo não encontrado.' },
        { status: 404 }
      );
    }

    const cicloRow = cicloResult.rows[0] as {
      id: number;
      status: string;
      representante_id: number;
      tipo_pessoa: 'pf' | 'pj';
      cpf: string | null;
      cnpj: string | null;
    };

    if (cicloRow.status !== 'nf_aprovada') {
      return NextResponse.json(
        {
          error: `Ciclo está com status '${cicloRow.status}'. Deve estar em 'nf_aprovada' para pagamento.`,
        },
        { status: 409 }
      );
    }

    // Upload do comprovante
    const buffer = Buffer.from(await file.arrayBuffer());
    const identificador =
      cicloRow.tipo_pessoa === 'pj'
        ? (cicloRow.cnpj ?? String(cicloRow.representante_id))
        : (cicloRow.cpf ?? String(cicloRow.representante_id));

    const uploadResult = await uploadDocumentoRepresentante(
      buffer,
      'rpa',
      identificador,
      file.type,
      cicloRow.tipo_pessoa,
      'COMP'
    );
    const comprovantePath = uploadResult.path;

    // Registrar pagamento (com cascata: liberada → paga nas comissoes_laudo)
    const { ciclo, erro } = await registrarPagamentoCiclo(
      id,
      comprovantePath,
      session.cpf,
      session.perfil
    );

    if (erro) {
      return NextResponse.json({ error: erro }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ciclo });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/ciclos/[id]/pagar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
