export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * ⚠️ ENDPOINT OBSOLETO - NÃO UTILIZAR
 *
 * Este endpoint foi substituído por lógica automática de conclusão
 * nos endpoints /api/avaliacao/save e /api/avaliacao/respostas
 *
 * As avaliações agora são concluídas AUTOMATICAMENTE quando atingem 37 respostas.
 * Ver DEPRECATED.md nesta pasta para mais detalhes.
 *
 * @deprecated Será removido em versão futura
 */
export function POST(_request: Request) {
  return NextResponse.json(
    {
      error:
        'Endpoint obsoleto. Avaliações são concluídas automaticamente ao salvar a 37ª resposta.',
      deprecated: true,
      alternativas: ['/api/avaliacao/save', '/api/avaliacao/respostas'],
    },
    { status: 410 } // 410 Gone - recurso não mais disponível
  );
}
