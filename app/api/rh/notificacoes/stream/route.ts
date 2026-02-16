import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { maskCPF } from '@/lib/request-utils';

export const dynamic = 'force-dynamic';

// Server-Sent Events endpoint para notificações em tempo real
export const GET = async (req: Request) => {
  const session = await Promise.resolve(getSession());
  if (!session || session.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }
  const user = session;

  // Configurar encoder para SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log(`[SSE] Cliente conectado: ${maskCPF(user.cpf)}`);

      // Função para enviar evento SSE
      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Enviar heartbeat inicial
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Função para buscar notificações
      const checkNotifications = async () => {
        try {
          const notificacoesQuery = await query(
            `
            SELECT
              'lote_concluido' as tipo,
              la.id as id_referencia,
              la.id as lote_id,
              ec.nome as empresa_nome,
              MAX(a.envio) as data_evento
            FROM lotes_avaliacao la
            JOIN avaliacoes a ON la.id = a.lote_id
            JOIN empresas_clientes ec ON la.empresa_id = ec.id
            WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
              AND NOT EXISTS (
                SELECT 1 FROM avaliacoes a2 
                WHERE a2.lote_id = la.id AND a2.status != 'concluida'
              )
              AND EXISTS (
                SELECT 1 FROM avaliacoes a3 
                WHERE a3.lote_id = la.id AND a3.status = 'concluida'
              )
            GROUP BY la.id, ec.nome
            HAVING MAX(a.envio) >= NOW() - INTERVAL '7 days'

            UNION ALL

            SELECT
              'laudo_enviado' as tipo,
              l.id as id_referencia,
              l.lote_id,
              ec.nome as empresa_nome,
              l.emitido_em as data_evento
            FROM laudos l
            JOIN lotes_avaliacao la ON l.lote_id = la.id
            JOIN empresas_clientes ec ON la.empresa_id = ec.id
            WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
              AND l.status = 'emitido'
              AND l.arquivo_remoto_url IS NOT NULL
              AND l.emitido_em >= NOW() - INTERVAL '7 days'

            ORDER BY data_evento DESC
            LIMIT 50
          `,
            [user.cpf]
          );

          const notificacoes = notificacoesQuery.rows.map((notif) => ({
            id: `${notif.tipo}_${notif.id_referencia}`,
            tipo: notif.tipo,
            lote_id: notif.lote_id,
            empresa_nome: notif.empresa_nome,
            data_evento: notif.data_evento,
            mensagem:
              notif.tipo === 'lote_concluido'
                ? `Lote ID: ${notif.lote_id} enviado`
                : `Laudo recebido para o lote ID: ${notif.lote_id}`,
          }));

          // Enviar notificações
          sendEvent({
            type: 'notifications',
            data: notificacoes,
            total: notificacoes.length,
            timestamp: new Date().toISOString(),
          });
        } catch (err: unknown) {
          console.error('[SSE] Erro ao buscar notificações:', err);
          sendEvent({
            type: 'error',
            message: 'Erro ao buscar notificações',
            timestamp: new Date().toISOString(),
          });
        }
      };

      // Buscar notificações inicialmente
      await checkNotifications();

      // Configurar polling a cada 30 segundos (mantém conexão ativa)
      const intervalId = setInterval(async () => {
        try {
          // Enviar heartbeat
          sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });

          // Buscar novas notificações
          await checkNotifications();
        } catch (err: unknown) {
          console.error('[SSE] Erro no polling:', err);
        }
      }, 30000); // 30 segundos

      // Limpar quando cliente desconectar
      req.signal.addEventListener('abort', () => {
        console.log(`[SSE] Cliente desconectado: ${maskCPF(user.cpf)}`);
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // Retornar resposta SSE
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilitar buffering nginx
    },
  });
};
