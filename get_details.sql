SELECT 'auditoria' as source, usuario_cpf as cpf, acao as context, data_criacao as date FROM auditoria WHERE usuario_cpf = '83905249022';
SELECT 'representantes' as source, cpf_responsavel_pj as cpf, nome_fantasia as context, data_vencimento_token as extra FROM representantes WHERE cpf_responsavel_pj = '83905249022';
SELECT 'session_logs' as source, cpf, user_agent as context, created_at as date FROM session_logs WHERE cpf = '83905249022' ORDER BY created_at DESC LIMIT 5;
SELECT 'representantes_cadastro_leads' as source, cpf_responsavel as cpf, razao_social as context, data_criacao as date FROM representantes_cadastro_leads WHERE cpf_responsavel = '83905249022';
