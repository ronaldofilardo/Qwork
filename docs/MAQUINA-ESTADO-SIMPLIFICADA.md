# Máquina de Estado Simplificada — Emissão Imediata (2026-01-16)

## Resumo

Documento consolidado com decisões, runbook, checklist e impactos da simplificação do fluxo de emissão de laudos.

## Contexto

- O estado `rascunho` foi removido do sistema para eliminar caminhos divergentes e comportamentos imprevisíveis.
- O cron de emissão foi desabilitado: a emissão agora ocorre **imediatamente** quando um lote é detectado como `concluido`.
- Edição do campo `observacoes` está **bloqueada** no fluxo padrão; apenas a emissão em **modo emergência** permite justificativa e edição controlada.
- Operação destrutiva autorizada: lotes aptos/emitidos e laudos pré-existentes foram **deletados** (script `scripts/delete_aptos_emitidos.sql` executado em 2026-01-16).

## Objetivos

- Tornar a emissão determinística e idempotente: conclusão do lote → emissão imediata.
- Preservar exceção operacional (emergência) com justificativa e auditoria.
- Reduzir superfície de erros causados por múltiplos caminhos (manual/cron/upsert).

## Fluxo detalhado

1. Recalculo de status
   - `recalcularStatusLote()` atualiza o status do lote com base nas avaliações.
   - Se o novo status for `concluido`, o lote é atualizado e a emissão imediata é iniciada.

2. Emissão imediata
   - Função central: `gerarLaudoCompletoEmitirPDF(loteId, emissorCPF)` — gera HTML, PDF, hash e atualiza `laudos.status = 'emitido'` e timestamps.
   - Após geração do PDF, o processo de envio segue normalmente (marcação `enviado`).

3. Emissão de emergência
   - Endpoint: `POST /api/emissor/laudos/[loteId]/emergencia`
   - Requer `motivo` (mínimo 20 caracteres)
   - Registra `modo_emergencia = true`, armazena justificativa, registra auditoria e permite ações manuais necessárias.

4. Edição de observações
   - `PUT /api/emissor/laudos/[loteId]` agora retorna 403 com mensagem: "Edição de observações não permitida". Use rota de emergência se necessário.

## Migração e banco de dados

- Migration: `database/migrations/013_remove_rascunho_status.sql`
  - Converte dados legados: `rascunho` → `ativo` (lotes), `rascunho` → `emitido` (laudos)
  - Recria tipos/enums sem `rascunho`, atualiza defaults e constraints
- Deleção autorizada (irreversível): `scripts/delete_aptos_emitidos.sql` — executado conforme decisão operacional; ver `logs/2026-01-16-remocao-rascunho.log` para contagens e auditoria.

## Runbook operacional (resumo rápido)

- Intervenção emergencial:
  1. Fazer `POST /api/emissor/laudos/[loteId]/emergencia` com `motivo` (>=20 chars)
  2. Conferir auditoria: `SELECT * FROM auditoria_laudos WHERE lote_id = $1;`
  3. Ver logs: `logs/2026-01-16-remocao-rascunho.log` e `notificacoes_admin`
- Falhas de geração de PDF: verificar `logs` e `notificacoes_admin`, reprocessar com `app/api/emissor/laudos/[loteId]/reprocessar` se necessário.

## Checklist de validação

- [ ] `pnpm build` passa (compilação + lint + type-check)
- [ ] Testes unitários e integração atualizados e passando (`pnpm test`)
- [ ] Cron endpoints retornam 410 (desabilitado)
- [ ] `GET /api/emissor/laudos/[loteId]` desencadeia emissão quando lote concluído
- [ ] `PUT /api/emissor/laudos/[loteId]` retorna 403
- [ ] Migration `013_remove_rascunho_status.sql` aplicada em staging e validada
- [ ] Script destrutivo executado conforme autorização e log registrado

## Impacto em testes e automações

- Prioridades de correção (em ordem):
  1. Cron endpoints tests (esperar 410 / desabilitado)
  2. `lib/lotes` and recálculo tests (validar emissão imediata e mock de `gerarLaudoCompletoEmitirPDF`)
  3. Notification/UI tests (remover referências a 'rascunho')
  4. Integration tests que esperam dados deletados — recriar fixtures ou ajustar expectativas

## Arquivos importantes

- Código/Runtime: `lib/laudo-auto.ts`, `lib/lotes.ts`, `app/api/emissor/laudos/[loteId]/route.ts`
- Cron endpoints: `app/api/cron/emitir-laudos-auto/route.ts`, `app/api/system/auto-laudo/route.ts`
- Migrations/Scripts: `database/migrations/013_remove_rascunho_status.sql`, `scripts/delete_aptos_emitidos.sql`
- Logs: `logs/2026-01-16-remocao-rascunho.log`

## Notas finais

- Esta alteração é breaking: documente aprovações e comunicações formais a operações e compliance.
- Recomenda-se monitoramento reforçado (métricas e alertas) por 72h após deploy.
