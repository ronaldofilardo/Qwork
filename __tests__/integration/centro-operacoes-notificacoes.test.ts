/**
 * Testes de Integração - Centro de Operações de Notificações
 *
 * Valida todo o fluxo de notificações persistentes:
 * - Criação automática em eventos de negócio
 * - Persistência até resolução explícita
 * - Segurança e isolamento multi-tenant (RLS)
 * - Resolução individual e em massa
 */

import { query } from '@/lib/db';
import {
  criarNotificacao,
  resolverNotificacao,
  resolverNotificacoesPorContexto,
  buscarNotificacoesNaoResolvidas,
  contarNotificacoesNaoResolvidas,
} from '@/lib/notifications/create-notification';

// Interface para o tipo retornado por buscarNotificacoesNaoResolvidas
interface NotificacaoResult {
  id: number;
  destinatario_cpf: string;
}

describe('Centro de Operações - Notificações Persistentes', () => {
  let tomadorId: number;
  let clinicaId: number;
  let tomadorCpf: string;

  beforeAll(async () => {
    // Setup: criar tomador e clínica de teste
    const tomador = await query(
      `INSERT INTO tomadors (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, status, pagamento_confirmado
      ) VALUES (
        'entidade', 'Teste Notif', '12345678000199', 'teste@empresa.com',
        '11999999999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234-567',
        'Gestor Teste', '99988877766', 'gestor@teste.com', '11988888888',
        true, 'aprovado', true
      ) RETURNING id, responsavel_cpf`
    );
    tomadorId = tomador.rows[0].id;
    tomadorCpf = tomador.rows[0].responsavel_cpf;

    const clinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa)
       VALUES ('Clínica Teste', '98765432000188', true)
       RETURNING id`
    );
    clinicaId = clinica.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query(`DELETE FROM notificacoes WHERE destinatario_cpf IN ($1, $2)`, [
      tomadorCpf,
      '12345678901', // CPF padrão da clínica
    ]);
    await query(`DELETE FROM tomadors WHERE id = $1`, [tomadorId]);
    await query(`DELETE FROM clinicas WHERE id = $1`, [clinicaId]);
  });

  describe('1. Criação de Notificações', () => {
    it('deve criar notificação de parcela pendente', async () => {
      const notifId = await criarNotificacao({
        tipo: 'parcela_pendente',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Parcela 2/6 - Vence em 05/02',
        mensagem: 'Você tem uma parcela pendente de R$ 499,90',
        dados_contexto: {
          pagamento_id: 123,
          numero_parcela: 2,
          total_parcelas: 6,
          valor: 499.9,
        },
        link_acao: '/rh/conta#pagamentos',
        botao_texto: 'Ver Pagamentos',
        prioridade: 'alta',
      });

      expect(notifId).toBeGreaterThan(0);

      // Verificar que foi criada no banco
      const notif = await query(`SELECT * FROM notificacoes WHERE id = $1`, [
        notifId,
      ]);
      expect(notif.rows[0].resolvida).toBe(false);
      expect(notif.rows[0].tipo).toBe('parcela_pendente');
    });

    it('deve criar notificação de lote concluído', async () => {
      const notifId = await criarNotificacao({
        tipo: 'lote_concluido_aguardando_laudo',
        destinatario_id: clinicaId,
        destinatario_tipo: 'clinica',
        titulo: 'Lote TESTE-001 concluído',
        mensagem: 'Laudo em processamento',
        dados_contexto: {
          lote_id: 999,
        },
        link_acao: '/clinica/lotes/999',
        prioridade: 'media',
      });

      expect(notifId).toBeGreaterThan(0);
    });

    it('deve criar notificação de laudo emitido', async () => {
      const notifId = await criarNotificacao({
        tipo: 'laudo_enviado',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Laudo do Lote TESTE-002 emitido',
        mensagem: 'Laudo disponível para download',
        dados_contexto: {
          lote_id: 998,
        },
        link_acao: '/entidade/lotes',
        prioridade: 'media',
      });

      expect(notifId).toBeGreaterThan(0);
    });
  });

  describe('2. Busca e Filtros', () => {
    it('deve buscar notificações não resolvidas', async () => {
      const notifs: NotificacaoResult[] = await buscarNotificacoesNaoResolvidas(
        tomadorId,
        'tomador'
      );

      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs.every((n) => n.resolvida === false));
    });

    it('deve filtrar por tipo de notificação', async () => {
      const notifs: NotificacaoResult[] = await buscarNotificacoesNaoResolvidas(
        tomadorId,
        'tomador',
        { tipo: 'parcela_pendente' }
      );

      expect(notifs.every((n) => n.tipo === 'parcela_pendente')).toBe(true);
    });

    it('deve contar notificações por tipo', async () => {
      const contadores = await contarNotificacoesNaoResolvidas(
        tomadorId,
        'tomador'
      );

      expect(contadores.total).toBeGreaterThan(0);
      expect(contadores.parcela_pendente).toBeGreaterThan(0);
    });
  });

  describe('3. Resolução de Notificações', () => {
    it('deve resolver notificação individual', async () => {
      // Criar notificação de teste
      const notifId = await criarNotificacao({
        tipo: 'parcela_pendente',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Teste Resolução',
        mensagem: 'Notificação para teste de resolução',
      });

      // Resolver
      const resolvida = await resolverNotificacao({
        notificacao_id: notifId,
        cpf_resolvedor: '12345678901',
      });

      expect(resolvida).toBe(true);

      // Verificar no banco
      const notif = await query(`SELECT * FROM notificacoes WHERE id = $1`, [
        notifId,
      ]);
      expect(notif.rows[0].resolvida).toBe(true);
      expect(notif.rows[0].resolvido_por_cpf).toBe('12345678901');
      expect(notif.rows[0].data_resolucao).not.toBeNull();
    });

    it('deve resolver múltiplas notificações por contexto', async () => {
      const loteId = 888;

      // Criar 3 notificações do mesmo lote
      await criarNotificacao({
        tipo: 'lote_concluido_aguardando_laudo',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Lote 888 - Notif 1',
        mensagem: 'Teste',
        dados_contexto: { lote_id: loteId },
      });

      await criarNotificacao({
        tipo: 'laudo_enviado',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Lote 888 - Notif 2',
        mensagem: 'Teste',
        dados_contexto: { lote_id: loteId },
      });

      await criarNotificacao({
        tipo: 'laudo_enviado',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Lote 888 - Notif 3',
        mensagem: 'Teste',
        dados_contexto: { lote_id: loteId },
      });

      // Resolver todas por contexto
      const count = await resolverNotificacoesPorContexto({
        chave_contexto: 'lote_id',
        valor_contexto: loteId.toString(),
        cpf_resolvedor: '12345678901',
      });

      expect(count).toBe(3);

      // Verificar que todas foram resolvidas
      const notifs = await query(
        `SELECT COUNT(*) as count FROM notificacoes 
         WHERE dados_contexto->>'lote_id' = $1 AND resolvida = false`,
        [loteId.toString()]
      );
      expect(parseInt(notifs.rows[0].count as string)).toBe(0);
    });

    it('não deve resolver notificação já resolvida', async () => {
      const notifId = await criarNotificacao({
        tipo: 'parcela_pendente',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Teste Dupla Resolução',
        mensagem: 'Teste',
      });

      // Primeira resolução
      await resolverNotificacao({
        notificacao_id: notifId,
        cpf_resolvedor: '12345678901',
      });

      // Tentar resolver novamente
      const resolvida = await resolverNotificacao({
        notificacao_id: notifId,
        cpf_resolvedor: '12345678901',
      });

      expect(resolvida).toBe(false);
    });
  });

  describe('4. Segurança e RLS', () => {
    it('deve isolar notificações entre tomadors', async () => {
      // Criar outro tomador
      const outro = await query(
        `INSERT INTO tomadors (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          ativa, status, pagamento_confirmado
        ) VALUES (
          'entidade', 'Outro tomador', '88888888000188', 'outro@teste.com',
          '11999999998', 'Rua Outro, 456', 'São Paulo', 'SP', '01234-566',
          'Outro Gestor', '88888888888', 'outro@teste.com', '11988888887',
          true, 'aprovado', true
        ) RETURNING id`
      );
      const outroId: number = outro.rows[0].id;

      try {
        // Criar notificação para o primeiro
        await criarNotificacao({
          tipo: 'parcela_pendente',
          destinatario_id: tomadorId,
          destinatario_tipo: 'tomador',
          titulo: 'Notif tomador 1',
          mensagem: 'Teste',
        });

        // Buscar notificações do segundo (não deve ver a do primeiro)
        const notifs: NotificacaoResult[] =
          await buscarNotificacoesNaoResolvidas(outroId, 'tomador');

        expect(notifs.every((n) => n.destinatario_cpf === '99999999999')).toBe(
          true
        );
      } finally {
        await query(`DELETE FROM notificacoes WHERE destinatario_cpf = $1`, [
          '99999999999',
        ]);
        await query(`DELETE FROM tomadors WHERE id = $1`, [outroId]);
      }
    });

    it('deve isolar notificações entre clínicas e tomadors', async () => {
      const notifstomador: NotificacaoResult[] =
        await buscarNotificacoesNaoResolvidas(tomadorId, 'tomador');
      const notifsClinica: NotificacaoResult[] =
        await buscarNotificacoesNaoResolvidas(clinicaId, 'clinica');

      // Não deve haver overlap
      const idstomador = notifstomador.map((n) => n.id);
      const idsClinica = notifsClinica.map((n) => n.id);

      const intersection = idstomador.filter((id) =>
        idsClinica.includes(id)
      );
      expect(intersection.length).toBe(0);
    });
  });

  describe('5. Auditoria', () => {
    it('deve registrar auditoria ao resolver notificação', async () => {
      const notifId = await criarNotificacao({
        tipo: 'parcela_pendente',
        destinatario_id: tomadorId,
        destinatario_tipo: 'tomador',
        titulo: 'Teste Auditoria',
        mensagem: 'Teste',
      });

      await resolverNotificacao({
        notificacao_id: notifId,
        cpf_resolvedor: '12345678901',
      });

      // Verificar registro na auditoria
      const auditoria = await query(
        `SELECT * FROM auditoria_geral 
         WHERE tabela_afetada = 'notificacoes' 
         AND acao = 'RESOLVE' 
         AND dados_novos->>'notificacao_id' = $1`,
        [String(notifId)]
      );

      expect(auditoria.rows.length).toBe(1);
      expect(auditoria.rows[0].cpf_responsavel).toBe('12345678901');
    });
  });
});
