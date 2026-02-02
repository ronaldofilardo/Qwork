# Migração 080 — Atualizar verificar_inativacao_consecutiva

Resumo:

- Substitui a função `verificar_inativacao_consecutiva` para refletir nova regra: primeiro lote após importação/inscrição é permitido sem sinalização; a partir da 2ª inativação o sistema sinaliza restrição (exige justificativa e permite forçar).

Passo a passo de deploy (staging/prod):

1. Fazer backup do banco (pg_dump) e armazenar em local seguro.
2. Validar localmente em staging: rodar os testes automatizados mencionados abaixo.
3. Aplicar a migration no banco de destino:
   - psql -U postgres -h <host> -p <port> -d nr-bps_db -f database/migrations/080_update_verificar_inativacao_consecutiva.sql
4. Validar que a função foi atualizada (consulta no pg_proc ou executando a verificação via endpoint GET /api/avaliacoes/inativar?avaliacao_id=...)
5. Rodar testes de integração ou smoke tests em staging; se OK, promover para produção.
6. Em caso de problema, restaurar o backup do passo 1.

Testes que comprovam o comportamento:

- **tests**/api/avaliacoes/inativar-validacao.test.ts (GET)
- **tests**/api/avaliacoes/inativar-contratante.test.ts (POST)

Notas:

- Esta migration é segura para aplicar em produção via psql, pois usa CREATE OR REPLACE FUNCTION.
- Recomenda-se executar a suíte de testes de API/integration e confirmar logs/auditoria após a aplicação.

Se quiser, posso preparar um pequeno PR template com checklist para QA antes do merge (incluir:

- backups feitos,
- testes unit passados,
- smoke tests em staging OK,
- mudança documentada no CHANGELOG).
