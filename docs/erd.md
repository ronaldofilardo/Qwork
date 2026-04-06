# ERD — QWork Database

> Gerado automaticamente em: 2026-04-05T22:09:56.126Z
> Para regenerar: `pnpm db:erd`

## Índice de Domínios

- [🏗️ Foundation](#foundation) — 5 tabela(s)
- [👤 Identidade](#identidade) — 8 tabela(s)
- [🏢 Entidades & Comercial](#entidades-comercial) — 10 tabela(s)
- [📋 Avaliações & Laudos](#avalia-es-laudos) — 5 tabela(s)
- [💰 Financeiro & Notificações](#financeiro-notifica-es) — 5 tabela(s)
- [📦 Outros](#outros) — 38 tabela(s)

---

## 🏗️ Foundation

**Tabelas:**

- `audit_access_denied` — Logs de tentativas de acesso bloqueadas por RLS
- `audit_logs` — Logs de auditoria - removidos registros de emergÃªncia e codigo/titulo de lote (2026-02-03)
- `notificacoes_admin` — Notificações para administradores sobre eventos críticos do sistema
- `tokens_retomada_pagamento` — Tokens de uso único para retomada de processo de pagamento

```mermaid
erDiagram
  audit_access_denied { %% Logs de tentativas de acesso bloqueadas por RLS
    bigint id PK
    char(11) user_cpf
    varchar(20) user_perfil
    varchar(50) attempted_action
    varchar(100) resource
    text resource_id
    text reason
    text query_text
    inet ip_address
    timestamp created_at
  }
  audit_logs { %% Logs de auditoria - removidos registros de emergÃªncia e codigo/titulo de lote (
    bigint id PK
    char(11) user_cpf "CPF do usuário que executou a ação. NULL indica ação automática do sistema."
    varchar(20) user_perfil "Perfil do usuário que executou a ação (pode ser NULL para operações sem contexto"
    varchar(50) action
    varchar(100) resource
    text resource_id
    jsonb old_data
    jsonb new_data
    inet ip_address
    text user_agent
    text details
    timestamp created_at
    int clinica_id "ID da clínica relacionada à ação (quando aplicável)."
    int entidade_id
  }
  notificacoes_admin { %% Notificações para administradores sobre eventos críticos do sistema
    int id PK
    varchar(50) tipo "Tipo de notificação para categorização e filtros"
    text mensagem "Mensagem descritiva da notificação"
    int lote_id FK "Referência ao lote relacionado (opcional)"
    bool visualizada
    timestamptz criado_em
    varchar(200) titulo
    int contrato_id FK
    int pagamento_id FK
    jsonb dados_contexto "JSON com dados adicionais relevantes para a notificação"
    bool lida
    bool resolvida
    timestamp data_leitura
    timestamp data_resolucao
    varchar(11) resolvido_por_cpf
    text observacoes_resolucao
    timestamp atualizado_em
    int entidade_id
    int clinica_id FK
  }
  schema_migrations {
    bigint version PK
    bool dirty
  }
  tokens_retomada_pagamento { %% Tokens de uso único para retomada de processo de pagamento
    int id PK
    varchar(32) token "Hash MD5 único para identificar a sessão de retomada"
    int contrato_id FK
    bool usado
    timestamp usado_em
    timestamp expira_em "Data/hora de expiração do token (72 horas por padrão)"
    timestamp criado_em
    int entidade_id
  }
  notificacoes_admin }o--|| clinicas : "clinica_id"
  notificacoes_admin }o--|| contratos : "contrato_id"
  notificacoes_admin }o--|| lotes_avaliacao : "lote_id"
  notificacoes_admin }o--|| pagamentos : "pagamento_id"
  tokens_retomada_pagamento }o--|| contratos : "contrato_id"
```

## 👤 Identidade

**Tabelas:**

- `clinica_configuracoes` — Configuracoes e campos customizaveis por clinica
- `clinicas_empresas` — Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que elas atendem
- `clinicas_senhas` — Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)
- `funcionarios` — Policies antigas que usavam FKs diretas foram removidas
- `funcionarios_clinicas` — Relacionamento M:N entre funcionários e empresas clientes (via clínicas de medicina ocupacional). Permite histórico de vínculos.
- `funcionarios_entidades` — Relacionamento M:N entre funcionários e entidades (tomadores tipo=entidade). Permite histórico de vínculos.
- `usuarios` — UsuÃ¡rios do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidades_senhas/clinicas_senhas.

```mermaid
erDiagram
  clinica_configuracoes { %% Configuracoes e campos customizaveis por clinica
    int id PK
    int clinica_id
    jsonb campos_customizados
    text logo_url
    text cor_primaria
    text cor_secundaria
    int template_relatorio_id
    bool incluir_logo_relatorios
    text formato_data_preferencial
    timestamp criado_em
    timestamp atualizado_em
    text atualizado_por_cpf
  }
  clinicas {
    int id PK
    varchar(200) nome
    varchar(18) cnpj
    varchar(50) inscricao_estadual
    varchar(100) email
    varchar(20) telefone
    text endereco
    varchar(100) cidade
    varchar(2) estado
    varchar(10) cep
    varchar(100) responsavel_nome
    varchar(11) responsavel_cpf
    varchar(100) responsavel_cargo
    varchar(100) responsavel_email
    varchar(20) responsavel_celular
    varchar(500) cartao_cnpj_path
    varchar(500) contrato_social_path
    varchar(500) doc_identificacao_path
    status_aprovacao_enum status
    text motivo_rejeicao
    text observacoes_reanalise
    bool ativa
    timestamp criado_em
    timestamp atualizado_em
    timestamp aprovado_em
    varchar(11) aprovado_por_cpf
    int numero_funcionarios_estimado
    timestamp data_primeiro_pagamento
    timestamp data_liberacao_login
    bool contrato_aceito
    varchar(20) tipo
    int entidade_id FK
    varchar(2048) cartao_cnpj_arquivo_remoto_key
    varchar(50) cartao_cnpj_arquivo_remoto_provider
    varchar(255) cartao_cnpj_arquivo_remoto_bucket
    text cartao_cnpj_arquivo_remoto_url
    varchar(2048) contrato_social_arquivo_remoto_key
    varchar(50) contrato_social_arquivo_remoto_provider
    varchar(255) contrato_social_arquivo_remoto_bucket
    text contrato_social_arquivo_remoto_url
    varchar(2048) doc_identificacao_arquivo_remoto_key
    varchar(50) doc_identificacao_arquivo_remoto_provider
    varchar(255) doc_identificacao_arquivo_remoto_bucket
    text doc_identificacao_arquivo_remoto_url
  }
  clinicas_empresas { %% Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que e
    int clinica_id PK "ID da clinica de medicina ocupacional"
    int empresa_id PK,FK "ID da empresa cliente atendida pela clÃ­nica"
    timestamp criado_em
  }
  clinicas_senhas { %% Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores
    int id PK
    int clinica_id "ReferÃªncia para a clÃ­nica"
    varchar(11) cpf "CPF do usuÃ¡rio RH"
    text senha_hash "Hash bcrypt da senha"
    bool primeira_senha_alterada "Indica se o usuÃ¡rio jÃ¡ alterou a senha inicial"
    timestamp created_at
    timestamp updated_at
    timestamptz criado_em
    timestamptz atualizado_em
  }
  funcionarios { %% Policies antigas que usavam FKs diretas foram removidas
    int id PK
    char(11) cpf
    varchar(100) nome
    varchar(50) setor
    varchar(50) funcao
    varchar(100) email
    text senha_hash
    varchar(20) perfil "Perfil do usuario: funcionario (pessoa avaliada), rh (clinica), gestor (entidade"
    bool ativo
    timestamp criado_em
    timestamp atualizado_em
    varchar(20) matricula
    varchar(50) turno
    varchar(50) escala
    varchar(50) nivel_cargo
    int ultima_avaliacao_id FK "ID da última avaliação concluída ou inativada (denormalizado para performance)"
    timestamp ultima_avaliacao_data_conclusao "Data de conclusão da última avaliação (denormalizado)"
    varchar(20) ultima_avaliacao_status "Status da última avaliação: concluida ou inativada (denormalizado)"
    text ultimo_motivo_inativacao "Motivo de inativação quando ultima_avaliacao_status = inativada"
    timestamp data_ultimo_lote "Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo "
    date data_nascimento "Data de nascimento do funcionário (YYYY-MM-DD)"
    int indice_avaliacao "NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunc"
    timestamp incluido_em "Data e hora em que o funcionário foi incluído no sistema"
    timestamp inativado_em "Data e hora em que o funcionário foi inativado"
    varchar(11) inativado_por "CPF do usuário que inativou o funcionário"
    varchar(20) ultimo_lote_codigo "Código do lote da última avaliação (denormalizado)"
    usuario_tipo_enum usuario_tipo
  }
  funcionarios_clinicas { %% Relacionamento M:N entre funcionários e empresas clientes (via clínicas de medic
    int id PK
    int funcionario_id FK "ID do funcionário (pessoa física avaliada)"
    int empresa_id FK "ID da empresa cliente (atendida pela clínica) à qual o funcionário pertence"
    bool ativo "TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)"
    timestamp data_vinculo "Data em que o funcionário foi vinculado à empresa (via clínica)"
    timestamp data_desvinculo "Data em que o vínculo foi encerrado (NULL = vínculo ativo)"
    int clinica_id FK "ID da clínica de medicina ocupacional que gerencia este funcionário"
    timestamp atualizado_em
    timestamp criado_em
    varchar(100) setor "Setor do funcionario nesta empresa (pode diferir entre empresas)"
    varchar(100) funcao "Funcao do funcionario nesta empresa"
    varchar(20) matricula "Matricula do funcionario nesta empresa"
    varchar(50) nivel_cargo "Nivel de cargo: operacional ou gestao (pode diferir entre empresas)"
    varchar(50) turno "Turno de trabalho nesta empresa"
    varchar(50) escala "Escala de trabalho nesta empresa"
    int indice_avaliacao "Indice sequencial da ultima avaliacao concluida nesta empresa (0 = nunca fez)"
    timestamp data_ultimo_lote "Data/hora da ultima avaliacao valida concluida nesta empresa"
  }
  funcionarios_entidades { %% Relacionamento M:N entre funcionários e entidades (tomadores tipo=entidade). Per
    int id PK
    int funcionario_id FK "ID do funcionário (pessoa física avaliada)"
    int entidade_id "ID da entidade (tomador tipo=entidade) - empresa que administra seus próprios fu"
    bool ativo "TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)"
    timestamp data_vinculo "Data em que o funcionário foi vinculado à entidade"
    timestamp data_desvinculo "Data em que o vínculo foi encerrado (NULL = vínculo ativo)"
    timestamp atualizado_em
    timestamp criado_em
    varchar(100) setor "Setor do funcionario nesta entidade (pode diferir entre entidades)"
    varchar(100) funcao "Funcao do funcionario nesta entidade"
    varchar(20) matricula "Matricula do funcionario nesta entidade"
    varchar(50) nivel_cargo "Nivel de cargo: operacional ou gestao (pode diferir entre entidades)"
    varchar(50) turno "Turno de trabalho nesta entidade"
    varchar(50) escala "Escala de trabalho nesta entidade"
    int indice_avaliacao "Indice sequencial da ultima avaliacao concluida nesta entidade (0 = nunca fez)"
    timestamp data_ultimo_lote "Data/hora da ultima avaliacao valida concluida nesta entidade"
  }
  usuarios { %% UsuÃ¡rios do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidade
    int id PK
    varchar(11) cpf "CPF Ãºnico do usuÃ¡rio"
    varchar(200) nome
    varchar(100) email
    int clinica_id "Para RH: vÃ­nculo com clÃ­nica (senha em clinicas_senhas)"
    int entidade_id "Para Gestor: vÃ­nculo com entidade (senha em entidades_senhas)"
    bool ativo
    timestamp criado_em
    timestamp atualizado_em
    usuario_tipo_enum tipo_usuario
    text senha_hash
    varchar(20) telefone
  }
  clinicas }o--|| entidades : "entidade_id"
  clinicas_empresas }o--|| empresas_clientes : "empresa_id"
  funcionarios }o--|| avaliacoes : "ultima_avaliacao_id"
  funcionarios_clinicas }o--|| clinicas : "clinica_id"
  funcionarios_clinicas }o--|| empresas_clientes : "empresa_id"
  funcionarios_clinicas }o--|| funcionarios : "funcionario_id"
  funcionarios_entidades }o--|| funcionarios : "funcionario_id"
```

## 🏢 Entidades & Comercial

**Tabelas:**

- `aceites_termos_entidade` — Registro de aceites vinculados ao CNPJ/contratante (prova legal mesmo após remoção do usuário)
- `aceites_termos_usuario` — Registro individual de aceites de termos por CPF (auditoria legal/LGPD)
- `contratos` — Contratos gerados para contratantes. Fluxo simplificado sem tabelas intermediárias.
- `empresas_clientes` — View vw_comparativo_empresas removida (usava empresa_id direta)
- `entidades` — Entidades contratantes do sistema (empresas que contratam avaliações).
    Renomeada de "contratantes" em Migration 420 (2026-02-05).
- `entidades_senhas` — Tabela de senhas de gestores de entidades
- `representantes` — Representantes comerciais independentes que indicam clínicas/entidades ao QWork
- `representantes_cadastro_leads` — Leads de cadastro de representantes vindos da landing page. Admin revisa docs e converte em representante oficial.
- `representantes_senhas` — Senhas de representantes â€” substitui senha_repres inline. PadrÃ£o anÃ¡logo a entidades_senhas/clinicas_senhas.
- `vinculos_comissao` — Vínculo entre representante e entidade/clínica que gera direito a comissão. Dura 1 ano da data de cadastro do cliente; renovável manualmente.

```mermaid
erDiagram
  aceites_termos_entidade { %% Registro de aceites vinculados ao CNPJ/contratante (prova legal mesmo após remoç
    bigint id PK
    varchar(14) entidade_cnpj "CNPJ da empresa/clínica contratante"
    varchar(50) entidade_tipo
    int entidade_id
    varchar(255) entidade_nome
    varchar(11) responsavel_cpf "CPF do gestor/RH que aceitou em nome da entidade"
    varchar(255) responsavel_nome
    varchar(50) responsavel_tipo
    varchar(50) termo_tipo
    int versao_termo
    timestamp aceito_em
    inet ip_address
    timestamp responsavel_removido_em "Data de remoção do responsável (mantém histórico legal)"
    text responsavel_remover_motivo
  }
  aceites_termos_usuario { %% Registro individual de aceites de termos por CPF (auditoria legal/LGPD)
    bigint id PK
    varchar(11) usuario_cpf "CPF do usuário que aceitou o termo"
    varchar(50) usuario_tipo "Tipo de usuário: rh, gestor"
    int usuario_entidade_id
    varchar(50) termo_tipo "Tipo de termo aceito: termos_uso, politica_privacidade"
    int versao_termo "Versão do termo aceito (para futuro controle de mudanças)"
    timestamp aceito_em
    inet ip_address
    text user_agent
    text sessao_id
    timestamp revogado_em
    text motivo_revogacao
    varchar(11) revogado_por
  }
  contratos { %% Contratos gerados para contratantes. Fluxo simplificado sem tabelas intermediári
    int id PK
    int numero_funcionarios
    decimal valor_total
    status_aprovacao_enum status "Status extra usado para controle de pagamento (payment_pending, payment_paid, et"
    bool aceito
    bool pagamento_confirmado
    text conteudo
    timestamp criado_em
    timestamp atualizado_em
    timestamp aceito_em
    varchar(64) ip_aceite
    timestamp data_aceite
    varchar(128) hash_contrato
    text conteudo_gerado "Conteúdo completo do contrato gerado para o contratante"
    timestamp data_pagamento
    varchar(11) criado_por_cpf
    int entidade_id
    int tomador_id
    varchar(50) tipo_tomador "Tipo do tomador: entidade ou clinica"
  }
  empresas_clientes { %% View vw_comparativo_empresas removida (usava empresa_id direta)
    int id PK
    varchar(100) nome
    varchar(18) cnpj
    varchar(100) email
    varchar(20) telefone
    text endereco
    varchar(50) cidade
    varchar(2) estado
    varchar(10) cep
    bool ativa
    int clinica_id "ID da clÃ­nica de medicina ocupacional que atende esta empresa (NOT NULL - obrig"
    timestamp criado_em
    timestamp atualizado_em
    text representante_nome "Nome do representante legal da empresa (opcional)"
    varchar(30) representante_fone "Telefone do representante (opcional)"
    varchar(100) representante_email "Email do representante (opcional)"
    text responsavel_email "Email do responsável pela empresa"
    varchar cartao_cnpj_path "Caminho do arquivo CartÃ£o CNPJ enviado no cadastro"
    varchar contrato_social_path "Caminho do arquivo Contrato Social enviado no cadastro"
    varchar doc_identificacao_path "Caminho do arquivo de identificaÃ§Ã£o do representante enviado no cadastro"
  }
  entidades { %% Entidades contratantes do sistema (empresas que contratam avaliações).     Reno
    int id PK
    varchar(200) nome
    varchar(18) cnpj
    varchar(50) inscricao_estadual
    varchar(100) email
    varchar(20) telefone
    text endereco
    varchar(100) cidade
    varchar(2) estado
    varchar(10) cep
    varchar(100) responsavel_nome "Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro"
    varchar(11) responsavel_cpf
    varchar(100) responsavel_cargo
    varchar(100) responsavel_email
    varchar(20) responsavel_celular
    varchar(500) cartao_cnpj_path
    varchar(500) contrato_social_path
    varchar(500) doc_identificacao_path
    status_aprovacao_enum status "pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento"
    text motivo_rejeicao
    text observacoes_reanalise
    bool ativa
    timestamp criado_em
    timestamp atualizado_em
    timestamp aprovado_em "Timestamp em que o contratante foi aprovado por um admin"
    varchar(11) aprovado_por_cpf "CPF do admin que aprovou o contratante"
    int numero_funcionarios_estimado "NÃºmero estimado de funcionÃ¡rios para o contratante"
    timestamp data_primeiro_pagamento
    varchar(50) tipo
    varchar(2048) cartao_cnpj_arquivo_remoto_key
    varchar(50) cartao_cnpj_arquivo_remoto_provider
    varchar(255) cartao_cnpj_arquivo_remoto_bucket
    text cartao_cnpj_arquivo_remoto_url
    varchar(2048) contrato_social_arquivo_remoto_key
    varchar(50) contrato_social_arquivo_remoto_provider
    varchar(255) contrato_social_arquivo_remoto_bucket
    text contrato_social_arquivo_remoto_url
    varchar(2048) doc_identificacao_arquivo_remoto_key
    varchar(50) doc_identificacao_arquivo_remoto_provider
    varchar(255) doc_identificacao_arquivo_remoto_bucket
    text doc_identificacao_arquivo_remoto_url
  }
  entidades_senhas { %% Tabela de senhas de gestores de entidades
    int id PK
    int entidade_id FK
    varchar(11) cpf
    text senha_hash
    bool primeira_senha_alterada
    timestamp created_at
    timestamp updated_at
    timestamptz criado_em
    timestamptz atualizado_em
  }
  representantes { %% Representantes comerciais independentes que indicam clínicas/entidades ao QWork
    int id PK
    tipo_pessoa_representante tipo_pessoa "pf: emite RPA; pj: emite NF de Serviços"
    varchar(150) nome
    varchar(150) email
    varchar(20) telefone
    char(11) cpf
    char(14) cnpj
    char(11) cpf_responsavel_pj
    varchar(12) codigo "Código único público do representante (alfanumérico, ex: K7X2Q9P3), usado no for"
    varchar(5) banco_codigo
    varchar(10) agencia
    varchar(20) conta
    varchar(20) tipo_conta
    varchar(150) titular_conta
    varchar(150) pix_chave
    varchar(20) pix_tipo
    text doc_identificacao_path
    text comprovante_conta_path
    status_representante status "Status do representante: apto, aguardando_senha, expirado, desativado, rejeitado"
    bool aceite_termos
    timestamptz aceite_termos_em
    bool aceite_disclaimer_nv
    timestamptz aceite_disclaimer_nv_em
    int bloqueio_conflito_pf_id FK
    timestamptz criado_em
    timestamptz atualizado_em
    timestamptz aprovado_em
    char(11) aprovado_por_cpf
    decimal percentual_comissao "DEPRECADO: comissÃ£o agora Ã© por lead/vÃ­nculo (vinculos_comissao.percentual_co"
    varchar(60) senha_hash "Hash bcrypt do codigo â€” permite login unificado via CPF + senha"
    varchar(60) senha_repres "Senha criada pelo próprio representante via link de convite (bcrypt rounds=12)"
    varchar(64) convite_token "Token de uso único para criação de senha (hex-64, expira em 7 dias)"
    timestamp convite_expira_em "Expiração do token de convite; verificado on-demand (sem cron)"
    int convite_tentativas_falhas "Contador de tentativas inválidas; bloqueado após 3"
    timestamp convite_usado_em "Quando o representante usou o link e criou a senha (auditoria)"
    varchar(20) dados_bancarios_status
    timestamptz dados_bancarios_solicitado_em
    timestamptz dados_bancarios_confirmado_em
    bool aceite_politica_privacidade "Representante aceitou a Política de Privacidade no primeiro acesso ao portal"
    timestamptz aceite_politica_privacidade_em "Data/hora em que o representante aceitou a Política de Privacidade"
    decimal percentual_vendedor_direto "DEPRECADO: usar vinculos_comissao.percentual_comissao_representante para vendas "
  }
  representantes_cadastro_leads { %% Leads de cadastro de representantes vindos da landing page. Admin revisa docs e 
    uuid id PK
    tipo_pessoa_representante tipo_pessoa
    varchar(200) nome
    varchar(200) email
    varchar(20) telefone
    char(11) cpf
    char(14) cnpj
    varchar(255) razao_social
    char(11) cpf_responsavel
    varchar(255) doc_cpf_filename
    varchar(2048) doc_cpf_key "Chave do arquivo no storage (local: storage/representante/{id}/..., prod: rep-qw"
    text doc_cpf_url
    varchar(255) doc_cnpj_filename
    varchar(2048) doc_cnpj_key
    text doc_cnpj_url
    varchar(255) doc_cpf_resp_filename
    varchar(2048) doc_cpf_resp_key
    text doc_cpf_resp_url
    status_cadastro_lead status "pendente_verificacao=aguardando admin; verificado=docs ok; rejeitado=negado; con"
    text motivo_rejeicao
    varchar(45) ip_origem
    text user_agent
    timestamptz criado_em
    timestamptz verificado_em
    varchar(11) verificado_por
    timestamptz convertido_em
    int representante_id FK "FK para representantes: preenchido quando o lead Ã© convertido em representante "
  }
  representantes_senhas { %% Senhas de representantes â€” substitui senha_repres inline. PadrÃ£o anÃ¡logo a e
    int id PK
    int representante_id FK
    varchar(11) cpf
    varchar(60) senha_hash
    bool primeira_senha_alterada
    timestamp criado_em
    timestamp atualizado_em
  }
  vinculos_comissao { %% Vínculo entre representante e entidade/clínica que gera direito a comissão. Dura
    int id PK
    int representante_id FK
    int entidade_id FK
    int lead_id FK
    date data_inicio
    date data_expiracao "data_inicio + INTERVAL 1 year. Sistema bloqueia renovação após expiração (23:59 "
    status_vinculo status
    timestamptz ultimo_laudo_em "Atualizado pelo trigger sempre que um laudo vinculado é emitido. JOB diário veri"
    timestamptz criado_em
    timestamptz atualizado_em
    timestamptz encerrado_em
    text encerrado_motivo
    int clinica_id FK "FK para clinicas: preenchido quando o tomador Ã© uma clÃ­nica cadastrada via flu"
    decimal valor_negociado "Valor negociado por avaliação/funcionário informado pelo admin ao associar manua"
    decimal percentual_comissao_representante "Percentual de comissÃ£o do representante neste vÃ­nculo (propagado do lead)"
    decimal percentual_comissao_vendedor "Percentual de comissÃ£o do vendedor neste vÃ­nculo (propagado do lead). 0 se ven"
    int num_vidas_estimado
  }
  entidades_senhas }o--|| entidades : "entidade_id"
  representantes }o--|| representantes : "bloqueio_conflito_pf_id"
  representantes_cadastro_leads }o--|| representantes : "representante_id"
  representantes_senhas }o--|| representantes : "representante_id"
  vinculos_comissao }o--|| clinicas : "clinica_id"
  vinculos_comissao }o--|| entidades : "entidade_id"
  vinculos_comissao }o--|| leads_representante : "lead_id"
  vinculos_comissao }o--|| representantes : "representante_id"
```

## 📋 Avaliações & Laudos

**Tabelas:**

- `avaliacoes` — Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional
- `laudos` — Laudos psicologicos emitidos por emissores.

REGRA DE NEGOCIO CRITICA - IMUTABILIDADE:
  Laudos emitidos (status=emitido ou enviado) sao documentos PERMANENTES.
  - Nenhum arquivo fisico em storage/laudos/ pode ser deletado
  - Nenhum registro nesta tabela pode ser alterado apos emissao
  - O hash_pdf comprova integridade do documento
  - Backups existem localmente (storage/laudos/) e remotamente (Backblaze)

PROTECOES ATIVAS (apos Migration 1137):
  - Trigger enforce_laudo_immutability: bloqueia UPDATE/DELETE de laudos emitidos
  - Trigger trg_validar_laudo_emitido: valida campos obrigatorios na emissao
  - Trigger trg_audit_laudo_delete_attempt: audita tentativas de DELETE
  - RLS laudos_no_delete_app_roles: bloqueia DELETE via roles de aplicacao
  - lib/storage/laudo-guard.ts: guard no filesystem local
  - assertNotLaudoBackblazeKey: guard no Backblaze

FLUXO CORRETO DE CRIACAO (veja tambem migration 1100):
  1. RH/Entidade solicita emissao
  2. Admin define valor e gera link de pagamento
  3. Pagamento confirmado
  4. Emissor gera laudo (POST /api/emissor/laudos/[loteId])
  5. PDF gerado localmente + hash SHA-256 calculado
  6. Status = emitido (IMUTAVEL a partir daqui)
  7. Upload assincrono para Backblaze
  8. Status = enviado
- `laudos_storage_log` — Registro imutável (append-only) de todos os arquivos físicos de laudos gerados.
Cada linha representa um arquivo de laudo que EXISTE no storage.
REGRA DE NEGÓCIO: Nenhuma linha pode ser alterada ou removida.
RLS garante: apenas INSERT é permitido a qualquer role.
Migration 1137 — 2026-04-03.
- `lotes_avaliacao` — Lotes de avaliaÃ§Ã£o - identificaÃ§Ã£o apenas por ID (alinhado com laudos.id)

```mermaid
erDiagram
  avaliacoes { %% Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua
    int id PK
    char(11) funcionario_cpf FK
    timestamp inicio
    timestamp envio
    varchar(20) status "Status da avaliaÃ§Ã£o: iniciada, em_andamento, concluida, inativada (nÃ£o increm"
    int grupo_atual
    timestamp criado_em
    timestamp atualizado_em
    int lote_id FK
    timestamptz inativada_em "Timestamp quando a avaliacao foi inativada pelo RH"
    text motivo_inativacao "Motivo informado pelo RH para inativacao da avaliacao"
    timestamp concluida_em
    bool identificacao_confirmada "Flag: funcionÃ¡rio confirmou ser o titular da avaliaÃ§Ã£o antes de responder"
    timestamp identificacao_confirmada_em "Timestamp em que a confirmaÃ§Ã£o de identificaÃ§Ã£o foi registrada"
  }
  laudos { %% Laudos psicologicos emitidos por emissores.  REGRA DE NEGOCIO CRITICA - IMUTAB
    int id PK
    int lote_id FK
    char(11) emissor_cpf FK
    text observacoes
    varchar(20) status "Status do laudo: apenas 'enviado' (emissão é automática)"
    timestamp criado_em
    timestamp emitido_em
    timestamp enviado_em
    timestamp atualizado_em
    varchar(64) hash_pdf "Hash SHA-256 do arquivo PDF do laudo para verificação de integridade"
    bigint job_id
    varchar(32) arquivo_remoto_provider
    varchar(255) arquivo_remoto_bucket
    varchar(1024) arquivo_remoto_key
    text arquivo_remoto_url
    bytea relatorio_individual "Arquivo PDF do relatório individual do funcionário"
    bytea relatorio_lote "Arquivo PDF do relatório do lote completo"
    bytea relatorio_setor "Arquivo PDF do relatório setorial/estatístico"
    varchar(64) hash_relatorio_individual "Hash SHA-256 do relatório individual para integridade"
    varchar(64) hash_relatorio_lote "Hash SHA-256 do relatório de lote para integridade"
    varchar(64) hash_relatorio_setor "Hash SHA-256 do relatório setorial para integridade"
    timestamp arquivo_remoto_uploaded_at "Timestamp de quando o laudo foi feito upload para o storage remoto (Backblaze)"
    varchar(255) arquivo_remoto_etag "ETag retornado pelo storage remoto para verificação de integridade"
    bigint arquivo_remoto_size "Tamanho do arquivo em bytes no storage remoto"
  }
  laudos_storage_log { %% Registro imutável (append-only) de todos os arquivos físicos de laudos gerados.
    bigint id PK
    int laudo_id FK
    int lote_id
    int clinica_id
    int entidade_id
    text arquivo_path "Caminho relativo ao diretório de trabalho (ex: storage/laudos/laudo-42.pdf)"
    varchar(64) hash_sha256 "Hash SHA-256 do conteúdo do arquivo no momento de geração. Imutável."
    varchar(255) backblaze_bucket
    varchar(1024) backblaze_key
    text backblaze_url
    char(11) emissor_cpf
    bigint tamanho_bytes
    timestamp registrado_em
  }
  lotes_avaliacao { %% Lotes de avaliaÃ§Ã£o - identificaÃ§Ã£o apenas por ID (alinhado com laudos.id)
    int id PK "Identificador Ãºnico do lote (igual ao ID do laudo correspondente)"
    int clinica_id
    int empresa_id FK
    text descricao
    varchar(20) tipo
    varchar(20) status "Status do lote: rascunho, ativo, concluido, emissao_solicitada, emissao_em_andam"
    char(11) liberado_por "CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gesto"
    timestamp liberado_em
    timestamp criado_em
    timestamp atualizado_em
    varchar(64) hash_pdf "Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria"
    int numero_ordem "NÃºmero sequencial do lote na empresa (ex: 10 para o 10Âº lote da empresa)"
    timestamptz emitido_em "Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)"
    timestamptz enviado_em "Data/hora em que o laudo foi marcado como enviado para RH/Entidade"
    int setor_id "Setor da empresa ao qual o lote pertence (opcional)"
    timestamp laudo_enviado_em "Data e hora em que o laudo foi enviado pelo emissor para a clínica"
    timestamp finalizado_em
    int entidade_id FK
    status_pagamento status_pagamento "Status do pagamento: aguardando_cobranca, aguardando_pagamento, pago, expirado"
    timestamptz solicitacao_emissao_em "Timestamp quando RH/Gestor solicitou a emissÃ£o"
    decimal valor_por_funcionario "Valor em R$ cobrado por funcionÃ¡rio (definido pelo admin)"
    uuid link_pagamento_token "Token UUID Ãºnico para acesso pÃºblico ao link de pagamento"
    timestamptz link_pagamento_expira_em "Data/hora de expiraÃ§Ã£o do link de pagamento (7 dias)"
    timestamptz link_pagamento_enviado_em "Timestamp quando o link foi gerado e enviado"
    varchar(20) pagamento_metodo "MÃ©todo de pagamento escolhido: pix, boleto, cartao"
    int pagamento_parcelas "NÃºmero de parcelas (1-12) para cartÃ£o de crÃ©dito"
    timestamptz pago_em "Timestamp de confirmaÃ§Ã£o do pagamento"
    decimal valor_servico "Valor do serviço de avaliação para este lote. Utilizado pelo sistema de comissio"
    timestamptz link_disponibilizado_em
  }
  resultados {
    int id PK
    int avaliacao_id FK
    int grupo
    varchar(100) dominio
    decimal score
    varchar(20) categoria
    timestamp criado_em
  }
  avaliacoes }o--|| funcionarios : "funcionario_cpf"
  avaliacoes }o--|| lotes_avaliacao : "lote_id"
  laudos }o--|| funcionarios : "emissor_cpf"
  laudos }o--|| lotes_avaliacao : "lote_id"
  laudos_storage_log }o--|| laudos : "laudo_id"
  lotes_avaliacao }o--|| empresas_clientes : "empresa_id"
  lotes_avaliacao }o--|| entidades : "entidade_id"
  resultados }o--|| avaliacoes : "avaliacao_id"
```

## 💰 Financeiro & Notificações

**Tabelas:**

- `comissoes_laudo` — Comissão gerada para um representante a cada laudo emitido e pago. Status: retida→aprovada→congelada→liberada→paga ou cancelada.
- `notificacoes` — Sistema de notificações em tempo real para admin e gestores
- `notificacoes_traducoes` — Traducoes de notificacoes para multi-idioma
- `pagamentos` — Registro de pagamentos de contratantes
- `recibos` — Recibos financeiros gerados após confirmação de pagamento, separados do contrato de serviço

```mermaid
erDiagram
  comissoes_laudo { %% Comissão gerada para um representante a cada laudo emitido e pago. Status: retid
    int id PK
    int vinculo_id FK
    int representante_id FK
    int entidade_id FK
    int laudo_id FK
    decimal percentual_comissao "Percentual do representante aplicado diretamente sobre o valor_laudo. FÃ³rmula: "
    decimal valor_laudo
    decimal valor_comissao "Valor final da comissÃ£o: valor_laudo Ã— percentual_comissao / 100. Armazenado p"
    status_comissao status
    motivo_congelamento motivo_congelamento
    date mes_emissao "Primeiro dia do mês em que o laudo foi emitido (ex: 2026-03-01 para laudos de ma"
    date mes_pagamento "Primeiro dia do mês em que o Admin deve pagar. Determinado pela regra do corte ("
    timestamptz data_emissao_laudo
    timestamptz data_aprovacao
    timestamptz data_liberacao
    timestamptz data_pagamento
    timestamptz nf_rpa_enviada_em
    timestamptz nf_rpa_aprovada_em
    timestamptz nf_rpa_rejeitada_em
    text nf_rpa_motivo_rejeicao
    text comprovante_pagamento_path
    timestamptz criado_em
    timestamptz atualizado_em
    text nf_path "Caminho relativo do arquivo NF/RPA no storage. DEV: /storage/NF/{codigo_rep}/. P"
    text nf_nome_arquivo "Nome original do arquivo NF/RPA enviado pelo representante (ex: NF-2026-03.pdf)."
    int lote_pagamento_id FK "FK para o lote de avaliaÃ§Ã£o cujo pagamento originou esta comissÃ£o. Usado para"
    int clinica_id FK "FK para clinicas: preenchido quando o tomador Ã© uma clÃ­nica RH-flow sem entida"
    int parcela_numero "Número da parcela (1-based). 1 para pagamento à vista."
    int total_parcelas "Total de parcelas do pagamento. 1 para à vista, até 12 para parcelado."
    timestamptz parcela_confirmada_em "Timestamp em que a parcela correspondente foi confirmada como paga (webhook Asaa"
    int vendedor_id "ID do vendedor (usuarios.id) quando tipo_beneficiario=vendedor. NULL para comiss"
    varchar(20) tipo_beneficiario "representante ou vendedor. Determina quem recebe esta comissÃ£o."
    int ciclo_id FK "Ciclo de fechamento mensal ao qual esta comissÃ£o pertence. NULL = nÃ£o consolid"
  }
  notificacoes { %% Sistema de notificações em tempo real para admin e gestores
    int id PK
    tipo_notificacao tipo
    prioridade_notificacao prioridade
    text destinatario_cpf "CPF do destinatário quando aplicável"
    text destinatario_tipo
    text titulo "Título resumido da notificação"
    text mensagem "Mensagem detalhada da notificação"
    jsonb dados_contexto "JSONB com dados adicionais específicos do tipo de notificação"
    text link_acao
    text botao_texto
    bool lida
    timestamp data_leitura
    bool arquivada
    int contratacao_personalizada_id
    timestamp criado_em
    timestamp expira_em "Data de expiração da notificação (limpeza automática)"
    bool resolvida "Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida"
    timestamp data_resolucao "Data/hora em que a notificação foi marcada como resolvida"
    varchar(11) resolvido_por_cpf "CPF do usuário que resolveu a notificação"
    int clinica_id
    timestamp data_evento
    varchar(20) tomador_tipo
  }
  notificacoes_traducoes { %% Traducoes de notificacoes para multi-idioma
    int id PK
    text chave_traducao
    idioma_suportado idioma
    text conteudo
    text categoria
    timestamp criado_em
    timestamp atualizado_em
  }
  pagamentos { %% Registro de pagamentos de contratantes
    int id PK
    decimal valor
    varchar(50) metodo
    varchar(50) status
    varchar(255) plataforma_id
    varchar(100) plataforma_nome
    jsonb dados_adicionais
    timestamp data_pagamento
    timestamp data_confirmacao
    varchar(500) comprovante_path
    text observacoes
    timestamp criado_em
    timestamp atualizado_em
    int numero_parcelas "Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)"
    text recibo_url "URL para visualização do recibo gerado"
    varchar(50) recibo_numero "Número do recibo gerado após confirmação do pagamento (formato: REC-AAAA-NNNNN)"
    jsonb detalhes_parcelas "detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_paga"
    int numero_funcionarios
    decimal valor_por_funcionario
    int contrato_id FK "Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagam"
    varchar(255) idempotency_key "Chave de idempotência para evitar duplicação de pagamentos (opcional)"
    varchar(255) external_transaction_id "ID da transação no gateway de pagamento (Stripe, Mercado Pago, etc) para rastrea"
    varchar(255) provider_event_id "ID único do evento do provedor de pagamento (para deduplicação de webhooks)"
    int entidade_id
    int clinica_id FK
    int tomador_id
    varchar(50) asaas_customer_id "ID do cliente no Asaas (cus_xxx)"
    text asaas_payment_url "URL de checkout Asaas (para cartÆo)"
    text asaas_boleto_url "URL do boleto banc rio"
    text asaas_invoice_url "URL da fatura/invoice"
    text asaas_pix_qrcode "C¢digo PIX Copia e Cola"
    text asaas_pix_qrcode_image "Imagem QR Code PIX em base64"
    decimal asaas_net_value "Valor l¡quido ap¢s dedu‡Æo de taxas Asaas"
    date asaas_due_date "Data de vencimento do pagamento"
    varchar(50) asaas_payment_id "ID do pagamento no Asaas (pay_xxx)"
  }
  recibos { %% Recibos financeiros gerados após confirmação de pagamento, separados do contrato
    int id PK
    int contrato_id FK
    int pagamento_id FK
    varchar(50) numero_recibo "Número único do recibo no formato REC-AAAA-NNNNN"
    date vigencia_inicio "Data de início da vigência = data do pagamento"
    date vigencia_fim "Data de fim da vigência = data_pagamento + 364 dias"
    int numero_funcionarios_cobertos "Quantidade de funcionários cobertos pelo plano contratado"
    decimal valor_total_anual "Valor total anual do plano"
    decimal valor_por_funcionario "Valor cobrado por funcionário (se aplicável)"
    varchar(50) forma_pagamento
    int numero_parcelas
    decimal valor_parcela
    jsonb detalhes_parcelas "JSON com detalhamento de cada parcela e vencimento"
    text descricao_pagamento "Descrição textual da forma de pagamento para incluir no PDF"
    text conteudo_pdf_path
    text conteudo_texto
    varchar(11) emitido_por_cpf
    bool ativo
    timestamp criado_em
    timestamp atualizado_em
    bytea pdf "PDF binário do recibo (BYTEA)"
    char(64) hash_pdf "Hash SHA-256 do PDF binário em hexadecimal (64 caracteres)"
    inet ip_emissao "Endereço IP de onde o recibo foi emitido"
    varchar(14) emitido_por "CPF do usuário que emitiu o recibo (formato: XXX.XXX.XXX-XX)"
    bool hash_incluso "Indica se o hash foi incluído no rodapé do PDF"
    varchar(255) backup_path "Caminho relativo do arquivo PDF de backup no sistema de arquivos"
    int parcela_numero "Número da parcela associada ao recibo (1, 2, 3...)"
    int clinica_id FK "ID da clínica associada ao recibo (opcional, para suporte a RH/Clínica)"
    int entidade_id
  }
  comissoes_laudo }o--|| ciclos_comissao : "ciclo_id"
  comissoes_laudo }o--|| clinicas : "clinica_id"
  comissoes_laudo }o--|| entidades : "entidade_id"
  comissoes_laudo }o--|| laudos : "laudo_id"
  comissoes_laudo }o--|| lotes_avaliacao : "lote_pagamento_id"
  comissoes_laudo }o--|| representantes : "representante_id"
  comissoes_laudo }o--|| vinculos_comissao : "vinculo_id"
  pagamentos }o--|| clinicas : "clinica_id"
  pagamentos }o--|| contratos : "contrato_id"
  recibos }o--|| clinicas : "clinica_id"
  recibos }o--|| contratos : "contrato_id"
  recibos }o--|| pagamentos : "pagamento_id"
```

## 📦 Outros

**Tabelas:**

- `auditoria` — Tabela de auditoria para registrar todas as aÃ§Ãµes do sistema
- `auditoria_laudos` — Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)
- `auditoria_recibos` — Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocessamento, erro)
- `avaliacao_resets` — Immutable audit log of evaluation reset operations
- `ciclos_comissao` — Fechamento mensal de comissÃµes. Permite envio de NF/RPA consolidada por mÃªs ou individual por comissÃ£o.
- `comissionamento_auditoria` — Log imutável de todas as transições de status no módulo de comissionamento
- `confirmacao_identidade` — Registros de confirmaÃ§Ã£o de identidade para fins de auditoria jurÃ­dica
- `entidade_configuracoes` — ConfiguraÃ§Ãµes de branding (logo, cores) por entidade
- `fila_emissao` — Fila de processamento assíncrono para emissão de laudos com retry automático
- `laudo_generation_jobs` — Jobs para geração de PDFs de laudos; consumidos por worker externo.
- `leads_representante` — Leads de indicação criados pelo representante. Um CNPJ só pode ter um lead ativo por vez. Após 90 dias sem conversão, o lead expira e o CNPJ fica livre para nova indicação.
- `logs_admin` — Auditoria de ações administrativas no sistema
- `mfa_codes` — CÃ³digos de autenticaÃ§Ã£o multifator (MFA) para funcionÃ¡rios
- `role_permissions` — Admin tem apenas permissões de cadastro (RH, clínicas, admins). 
Operações como gerenciar avaliações, lotes, empresas e funcionários são de responsabilidade de RH e entidade_gestor.
Emissão de laudos é exclusiva de emissores.
- `session_logs` — Registra todos os acessos (login/logout) de usuários do sistema para auditoria
- `templates_contrato` — Templates editaveis para geracao de contratos
- `vendedores_dados_bancarios` — Dados bancÃ¡rios de vendedores â€” acesso restrito ao perfil suporte. EdiÃ§Ãµes sÃ£o auditadas em comissionamento_auditoria.
- `webhook_logs` — Log de webhooks recebidos do Asaas Payment Gateway

```mermaid
erDiagram
  _migration_issues {
    int id PK
    int migration_version
    varchar(50) issue_type
    text description
    jsonb data
    bool resolved
    timestamp created_at
  }
  analise_estatistica {
    int id PK
    int avaliacao_id FK
    int grupo
    decimal score_original
    decimal score_ajustado
    bool anomalia_detectada
    varchar(100) tipo_anomalia
    text recomendacao
    timestamp created_at
  }
  auditoria { %% Tabela de auditoria para registrar todas as aÃ§Ãµes do sistema
    int id PK
    varchar(50) entidade_tipo
    int entidade_id
    varchar(50) acao
    varchar(100) status_anterior
    varchar(100) status_novo
    varchar(11) usuario_cpf
    varchar(50) usuario_perfil
    varchar(45) ip_address
    text user_agent
    jsonb dados_alterados
    jsonb metadados
    varchar(64) hash_operacao "Hash SHA-256 para verificaÃ§Ã£o de integridade da operaÃ§Ã£o"
    timestamp criado_em
  }
  auditoria_geral {
    int id PK
    varchar(100) tabela_afetada
    varchar(50) acao
    varchar(11) cpf_responsavel
    jsonb dados_anteriores
    jsonb dados_novos
    timestamp criado_em
  }
  auditoria_laudos { %% Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessament
    bigint id PK
    int lote_id FK "Referencia ao lote de avaliacao. FK com ON DELETE CASCADE."
    int laudo_id
    varchar(11) emissor_cpf
    varchar(200) emissor_nome
    varchar(64) acao "Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual"
    varchar(32) status "Status associado ao evento (emitido, enviado, erro, pendente)"
    inet ip_address
    text observacoes
    timestamp criado_em
    varchar(11) solicitado_por "CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes man"
    varchar(20) tipo_solicitante "Tipo do solicitante: rh, gestor_entidade, admin, emissor. Obrigatório quando sol"
    int tentativas "Contador de tentativas de processamento para retry logic. Default 0."
    text erro "Mensagem de erro detalhada quando processamento falha. NULL se bem-sucedido."
  }
  auditoria_recibos { %% Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocess
    int id PK
    int recibo_id FK
    varchar(80) acao
    varchar(40) status
    varchar(50) ip_address
    text observacoes
    timestamp criado_em
  }
  avaliacao_resets { %% Immutable audit log of evaluation reset operations
    uuid id PK "Unique identifier for the reset operation"
    int avaliacao_id FK "ID of the evaluation that was reset"
    int lote_id FK "ID of the batch/cycle containing the evaluation"
    int requested_by_user_id "User ID who requested the reset"
    varchar(50) requested_by_role "Role of the user at the time of reset (rh or gestor_entidade)"
    text reason "Mandatory justification for the reset operation"
    int respostas_count "Number of responses deleted during reset"
    timestamptz created_at "Timestamp when the reset was performed"
  }
  ciclos_comissao { %% Fechamento mensal de comissÃµes. Permite envio de NF/RPA consolidada por mÃªs ou
    int id PK
    int representante_id FK
    int vendedor_id
    varchar(20) tipo_beneficiario
    date mes_referencia
    decimal valor_total
    int qtd_comissoes
    varchar(30) status
    text nf_path
    text nf_nome_arquivo
    timestamptz nf_enviada_em
    timestamptz nf_aprovada_em
    timestamptz nf_rejeitada_em
    text nf_motivo_rejeicao
    timestamptz data_pagamento
    text comprovante_pagamento_path
    timestamptz criado_em
    timestamptz atualizado_em
    timestamptz fechado_em
  }
  comissionamento_auditoria { %% Log imutável de todas as transições de status no módulo de comissionamento
    bigint id PK
    varchar(50) tabela
    int registro_id
    varchar(60) status_anterior
    varchar(60) status_novo
    varchar(30) triggador
    text motivo
    jsonb dados_extras
    char(11) criado_por_cpf
    timestamptz criado_em
  }
  confirmacao_identidade { %% Registros de confirmaÃ§Ã£o de identidade para fins de auditoria jurÃ­dica
    int id PK
    int avaliacao_id FK "Foreign key para avaliacoes. Pode ser NULL para confirmaÃ§Ãµes de identidade fei"
    char(11) funcionario_cpf FK "CPF do funcionÃ¡rio que confirmou"
    varchar(100) nome_confirmado "Nome exibido na confirmaÃ§Ã£o"
    char(11) cpf_confirmado "CPF exibido na confirmaÃ§Ã£o (deve ser igual ao funcionario_cpf)"
    date data_nascimento "Data de nascimento exibida na confirmaÃ§Ã£o"
    timestamptz confirmado_em "Data/hora em que a confirmaÃ§Ã£o foi realizada"
    inet ip_address "EndereÃ§o IP de origem da confirmaÃ§Ã£o"
    text user_agent "User-Agent do navegador usado na confirmaÃ§Ã£o"
    timestamptz criado_em
  }
  emissao_queue {
    int id PK
    int lote_id FK
    int tentativas
    text ultimo_erro
    timestamptz proxima_execucao
    timestamptz criado_em
    timestamptz atualizado_em
  }
  entidade_configuracoes { %% ConfiguraÃ§Ãµes de branding (logo, cores) por entidade
    int id PK
    int entidade_id FK
    text logo_url "Logo em base64 data URI (data:image/...;base64,...) â€” max 256KB decoded"
    text cor_primaria
    text cor_secundaria
    timestamp criado_em
    timestamp atualizado_em
    text atualizado_por_cpf
  }
  fila_emissao { %% Fila de processamento assíncrono para emissão de laudos com retry automático
    int id PK
    int lote_id FK
    int tentativas "Número de tentativas de processamento"
    int max_tentativas "Máximo de tentativas antes de desistir"
    timestamp proxima_tentativa "Timestamp da próxima tentativa (com backoff exponencial)"
    text erro "Mensagem do último erro ocorrido"
    timestamp criado_em
    timestamp atualizado_em
  }
  fk_migration_audit {
    int id PK
    varchar(100) tabela
    varchar(100) coluna_origem
    varchar(50) tipo_migracao
    int registros_afetados
    varchar(50) status
    jsonb detalhes
    text erro
    timestamp iniciado_em
    timestamp concluido_em
    timestamp criado_em
  }
  hierarquia_comercial {
    int id PK
    int vendedor_id FK
    int representante_id FK
    int comercial_id FK
    bool ativo
    decimal percentual_override
    text obs
    timestamptz criado_em
    timestamptz atualizado_em
    timestamptz data_fim "Data em que o vÃ­nculo foi encerrado (inativaÃ§Ã£o). NULL = vÃ­nculo ativo."
  }
  importacoes_clinica {
    int id PK
    int clinica_id FK
    varchar(11) usuario_cpf
    varchar(255) arquivo_nome
    int total_linhas
    int empresas_criadas
    int empresas_existentes
    int funcionarios_criados
    int funcionarios_atualizados
    int vinculos_criados
    int vinculos_atualizados
    int inativacoes
    int total_erros
    varchar(50) status
    jsonb erros_detalhes
    jsonb mapeamento_colunas
    int tempo_processamento_ms
    timestamp criado_em
  }
  laudo_arquivos_remotos {
    int id PK
    int laudo_id FK
    varchar(32) provider
    varchar(255) bucket
    varchar(1024) key
    text url
    varchar(128) checksum
    bigint size_bytes
    varchar(32) tipo
    varchar(255) criado_por
    timestamp criado_em
  }
  laudo_downloads {
    int id PK
    int laudo_id FK
    int arquivo_remoto_id FK
    varchar(14) usuario_cpf
    varchar(45) ip
    text user_agent
    timestamp created_at
  }
  laudo_generation_jobs { %% Jobs para geração de PDFs de laudos; consumidos por worker externo.
    bigint id PK
    int lote_id FK
    int laudo_id
    varchar(20) status
    int attempts
    int max_attempts "Número máximo de tentativas antes de mover para DLQ/falha permanente"
    text last_error
    jsonb payload "Payload opcional com parâmetros (ex.: options para geração, template overrides)"
    timestamptz created_at
    timestamptz updated_at
    timestamptz processed_at
    timestamptz finished_at
  }
  leads_representante { %% Leads de indicação criados pelo representante. Um CNPJ só pode ter um lead ativo
    int id PK
    int representante_id FK
    char(14) cnpj
    varchar(200) razao_social
    varchar(150) contato_nome
    varchar(150) contato_email
    varchar(20) contato_telefone
    timestamptz criado_em
    timestamptz data_expiracao "data_criacao + INTERVAL 90 days — exato, com hora. Expira no mesmo horário que f"
    status_lead status
    tipo_conversao_lead tipo_conversao
    int entidade_id FK "FK para entidades: preenchido quando a clínica/entidade conclui o cadastro"
    timestamptz data_conversao
    varchar(64) token_atual "Token on-demand gerado quando rep clica 'Copiar link'. Expira em 90 dias a parti"
    timestamptz token_gerado_em
    timestamptz token_expiracao
    timestamptz atualizado_em
    decimal valor_negociado "Valor negociado pelo representante com a empresa no momento da indicaÃ§Ã£o. Obri"
    int vendedor_id FK
    text origem
    decimal percentual_comissao "DEPRECADO: usar percentual_comissao_representante. Mantido para backward compat."
    text observacoes
    text tipo_cliente
    bool requer_aprovacao_comercial
    text aprovado_por
    text aprovacao_obs
    timestamptz aprovacao_em
    decimal percentual_comissao_representante "Percentual de comissÃ£o do representante para este lead (0-40%)"
    decimal percentual_comissao_vendedor "Percentual de comissÃ£o do vendedor para este lead (0-40%). Default 0 quando rep"
    int num_vidas_estimado
  }
  logs_admin { %% Auditoria de ações administrativas no sistema
    int id PK
    varchar(11) admin_cpf
    varchar(100) acao "Tipo de ação executada pelo administrador"
    varchar(50) entidade_tipo
    int entidade_id
    jsonb detalhes "JSON com informações detalhadas da ação"
    varchar(45) ip_origem
    timestamp criado_em
  }
  lote_id_allocator {
    bigint last_id
  }
  mfa_codes { %% CÃ³digos de autenticaÃ§Ã£o multifator (MFA) para funcionÃ¡rios
    int id PK
    varchar(11) cpf FK
    varchar(6) code
    timestamp expires_at
    bool used
    timestamp created_at
  }
  migration_guidelines {
    int id PK
    text category
    text guideline
    text example
    timestamp created_at
  }
  pdf_jobs {
    int id PK
    int recibo_id FK
    varchar(20) status
    int attempts
    int max_attempts
    text error_message
    timestamp created_at
    timestamp updated_at
    timestamp processed_at
  }
  permissions {
    int id PK
    varchar(100) name
    varchar(50) resource
    varchar(50) action
    text description
    timestamp created_at
  }
  policy_expression_backups {
    int id PK
    text schema_name
    text table_name
    text policy_name
    text using_expr
    text with_check_expr
    timestamp created_at
  }
  questao_condicoes {
    int id PK
    int questao_id
    int questao_dependente
    varchar(10) operador
    int valor_condicao
    varchar(20) categoria
    bool ativo
    timestamp created_at
  }
  rate_limit_entries {
    varchar(255) key PK
    int count
    timestamp expires_at
  }
  relatorio_templates {
    int id PK
    varchar(100) nome
    varchar(20) tipo
    text descricao
    jsonb campos_incluidos
    jsonb filtros_padrao
    varchar(20) formato_saida
    bool ativo
    timestamp created_at
    timestamp updated_at
  }
  respostas {
    int id PK
    int avaliacao_id FK
    int grupo
    varchar(10) item
    int valor
    timestamp criado_em
    int questao
  }
  role_permissions { %% Admin tem apenas permissões de cadastro (RH, clínicas, admins).  Operações como
    int role_id PK,FK
    int permission_id PK,FK
    timestamp granted_at
  }
  roles {
    int id PK
    varchar(100) name
    varchar(100) display_name
    text description
    int hierarchy_level
    bool active
    timestamp created_at
  }
  session_logs { %% Registra todos os acessos (login/logout) de usuários do sistema para auditoria
    bigint id PK
    varchar(11) cpf "CPF do usuário que fez login"
    varchar(20) perfil "Perfil do usuário no momento do login (funcionario, rh, emissor, admin)"
    int clinica_id "ID da clínica associada ao usuário (para RH e emissores)"
    int empresa_id "ID da empresa associada ao funcionário"
    timestamp login_timestamp
    timestamp logout_timestamp
    inet ip_address
    text user_agent
    interval session_duration "Duração calculada da sessão (logout - login)"
    timestamp criado_em
  }
  templates_contrato { %% Templates editaveis para geracao de contratos
    int id PK
    text nome
    text descricao
    text tipo_template
    text conteudo
    bool ativo
    bool padrao
    int versao
    timestamp criado_em
    text criado_por_cpf
    timestamp atualizado_em
    text atualizado_por_cpf
    ARRAY tags
    jsonb metadata
  }
  vendedores_dados_bancarios { %% Dados bancÃ¡rios de vendedores â€” acesso restrito ao perfil suporte. EdiÃ§Ãµes 
    int id PK
    int usuario_id FK
    varchar(10) banco_codigo
    varchar(20) agencia
    varchar(30) conta
    varchar(20) tipo_conta
    varchar(200) titular_conta
    varchar(200) pix_chave
    varchar(20) pix_tipo
    timestamp criado_em
    timestamp atualizado_em
  }
  vendedores_perfil {
    int id PK
    int usuario_id FK
    varchar(12) codigo
    varchar(10) sexo
    text endereco
    varchar(100) cidade
    char(2) estado
    varchar(9) cep
    text doc_path
    timestamp criado_em
    timestamp atualizado_em
    varchar(64) convite_token "Token de uso Ãºnico para criaÃ§Ã£o de senha (hex-64, expira em 7 dias)"
    timestamp convite_expira_em
    int convite_tentativas_falhas
    timestamp convite_usado_em
    bool primeira_senha_alterada "Flag: vendedor trocou a senha provisÃ³ria no primeiro acesso"
    bool aceite_termos "Vendedor aceitou Termos de Uso"
    timestamp aceite_termos_em
    bool aceite_politica_privacidade "Vendedor aceitou PolÃ­tica de Privacidade"
    timestamp aceite_politica_privacidade_em
    bool aceite_disclaimer_nv "Vendedor aceitou Contrato de RepresentaÃ§Ã£o NÃƒO-CLT"
    timestamp aceite_disclaimer_nv_em
    char(2) tipo_pessoa
    char(14) cnpj
    char(11) cpf_responsavel_pj
    varchar(200) razao_social
    text doc_cad_path
    text doc_nf_rpa_path
  }
  webhook_logs { %% Log de webhooks recebidos do Asaas Payment Gateway
    int id PK
    varchar(50) payment_id "ID do pagamento no Asaas (pay_xxx)"
    varchar(100) event "Tipo de evento (PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc)"
    jsonb payload "Payload completo do webhook em JSON"
    timestamp processed_at
    varchar(45) ip_address
    text user_agent
    int processing_duration_ms "Tempo de processamento em milissegundos"
    text error_message
    timestamp created_at
  }
  analise_estatistica }o--|| avaliacoes : "avaliacao_id"
  auditoria_laudos }o--|| lotes_avaliacao : "lote_id"
  auditoria_recibos }o--|| recibos : "recibo_id"
  avaliacao_resets }o--|| avaliacoes : "avaliacao_id"
  avaliacao_resets }o--|| lotes_avaliacao : "lote_id"
  ciclos_comissao }o--|| representantes : "representante_id"
  confirmacao_identidade }o--|| avaliacoes : "avaliacao_id"
  confirmacao_identidade }o--|| funcionarios : "funcionario_cpf"
  emissao_queue }o--|| lotes_avaliacao : "lote_id"
  entidade_configuracoes }o--|| entidades : "entidade_id"
  fila_emissao }o--|| lotes_avaliacao : "lote_id"
  hierarquia_comercial }o--|| usuarios : "comercial_id"
  hierarquia_comercial }o--|| representantes : "representante_id"
  importacoes_clinica }o--|| clinicas : "clinica_id"
  laudo_arquivos_remotos }o--|| laudos : "laudo_id"
  laudo_downloads }o--|| laudo_arquivos_remotos : "arquivo_remoto_id"
  laudo_downloads }o--|| laudos : "laudo_id"
  laudo_generation_jobs }o--|| lotes_avaliacao : "lote_id"
  leads_representante }o--|| entidades : "entidade_id"
  leads_representante }o--|| representantes : "representante_id"
  leads_representante }o--|| usuarios : "vendedor_id"
  mfa_codes }o--|| funcionarios : "cpf"
  pdf_jobs }o--|| recibos : "recibo_id"
  respostas }o--|| avaliacoes : "avaliacao_id"
  role_permissions }o--|| permissions : "permission_id"
  role_permissions }o--|| roles : "role_id"
  vendedores_dados_bancarios }o--|| usuarios : "usuario_id"
  vendedores_perfil }o--|| usuarios : "usuario_id"
```

---

## 📊 Estatísticas

| Metrica | Valor |
|---------|-------|
| Total de tabelas | 71 |
| Total de FKs | 79 |
| Tabelas com COMMENT | 48 |
| Colunas com COMMENT | 249 |
| 🏗️ Foundation | 5 tabelas |
| 👤 Identidade | 8 tabelas |
| 🏢 Entidades & Comercial | 10 tabelas |
| 📋 Avaliações & Laudos | 5 tabelas |
| 💰 Financeiro & Notificações | 5 tabelas |
| 📦 Outros | 38 tabelas |
