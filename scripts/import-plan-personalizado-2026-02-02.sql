-- Import plano 'Personalizado' from local to Neon
INSERT INTO planos (tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, caracteristicas, created_at, updated_at)
VALUES ('personalizado'::tipo_plano, 'Personalizado', 'Atende a todos os interessados nos nossos serviços', NULL, NULL, NULL, true, '["Setup incluído.","Sem limite de uso."]', '2026-01-31 20:10:43.938649', '2026-01-31 20:10:43.938649')
RETURNING id;
