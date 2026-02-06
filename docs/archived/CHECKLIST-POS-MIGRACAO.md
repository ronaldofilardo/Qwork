# ✅ Checklist Pós-Migração LGPD

## 📋 Validação Imediata (Dia 0)

### Validação Técnica

- [ ] **Backup criado e armazenado em local seguro**
  - Arquivo: `backup-pre-lgpd-[timestamp].sql`
  - Tamanho: **\_** MB
  - Localização: **********\_**********

- [ ] **Script SQL executado sem erros**

  ```sql
  -- Verificar tabelas criadas
  SELECT COUNT(*) FROM administradores; -- Deve retornar > 0 se houver admin
  SELECT COUNT(*) FROM emissores;       -- Deve retornar > 0 se houver emissor
  ```

- [ ] **Auditoria de CPFs executada**
  - CPFs inválidos encontrados: **\_** (meta: 0)
  - Relatório salvo em: `logs/auditoria-cpf-[timestamp].json`

- [ ] **Colunas LGPD criadas em avaliacoes**

  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'avaliacoes'
  AND column_name IN ('base_legal', 'data_consentimento', 'ip_consentimento', 'data_validade', 'anonimizada');
  -- Deve retornar 5 linhas
  ```

- [ ] **Funções SQL criadas**
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_type = 'FUNCTION'
  AND routine_name IN ('executar_politica_retencao', 'validar_cpf_completo', 'anonimizar_avaliacao');
  -- Deve retornar 3 linhas
  ```

### Validação de Segurança

- [ ] **CPF mascarado em todas as interfaces**
  - Testar: Listar funcionários → Deve mostrar `***.***.*89-09`
  - Testar: Detalhes de funcionário → CPF mascarado
  - Testar: Relatórios → CPF mascarado

- [ ] **Logs não exibem CPF completo**
  - Verificar: `logs/` → Nenhum CPF completo visível
  - Verificar: Console do navegador → Sem CPF completo

- [ ] **Validação rigorosa de CPF funcionando**
  - Testar: Cadastrar CPF inválido → Deve rejeitar com erro "CPF inválido"
  - Testar: Cadastrar CPF válido → Deve aceitar

---

## 📅 Validação Semanal (Semana 1-2)

- [ ] **Monitorar logs de erro**
  - Verificar: `logs/` → Sem erros relacionados a CPF
  - Verificar: Erros 500 nas APIs → Nenhum relacionado a LGPD

- [ ] **Verificar base legal em novas avaliações**

  ```sql
  SELECT COUNT(*) FROM avaliacoes WHERE base_legal IS NULL AND criado_em > NOW() - INTERVAL '7 days';
  -- Meta: 0
  ```

- [ ] **Testar API de consentimento**

  ```bash
  curl -X POST http://localhost:3000/api/consentimento \
    -H "Content-Type: application/json" \
    -d '{"avaliacao_id": 1, "base_legal": "obrigacao_legal"}'
  # Deve retornar 200 OK
  ```

- [ ] **Conferir dados migrados**

  ```sql
  -- Administradores migrados corretamente?
  SELECT COUNT(*) FROM administradores WHERE cpf IN (
    SELECT cpf FROM funcionarios WHERE perfil = 'admin'
  );

  -- Emissores migrados corretamente?
  SELECT COUNT(*) FROM emissores WHERE cpf IN (
    SELECT cpf FROM funcionarios WHERE perfil = 'emissor'
  );
  ```

---

## 📆 Validação Mensal (Primeiro Mês)

- [ ] **Executar política de retenção manualmente**

  ```powershell
  pnpm lgpd:retencao
  ```

  - Avaliações anonimizadas: **\_**
  - Registros excluídos: **\_**
  - Relatório salvo em: `logs/retencao/retencao-[data].json`

- [ ] **Revisar histórico de exclusões**

  ```sql
  SELECT tipo_registro, COUNT(*) as total,
         MIN(data_exclusao) as primeira,
         MAX(data_exclusao) as ultima
  FROM historico_exclusoes
  GROUP BY tipo_registro;
  ```

- [ ] **Auditar CPFs novamente**

  ```powershell
  pnpm lgpd:auditar
  ```

  - CPFs inválidos: **\_** (meta: 0)

- [ ] **Verificar avaliações vencidas**
  ```sql
  SELECT COUNT(*) FROM avaliacoes
  WHERE data_validade < NOW()
  AND anonimizada = false
  AND status IN ('concluido', 'inativada');
  -- Meta: 0 (todas devem estar anonimizadas)
  ```

---

## 🎯 Validação de Conformidade (30 dias)

### Documentação

- [ ] **Política de Privacidade atualizada**
  - Arquivo: `docs/POLITICA-PRIVACIDADE-LGPD.md`
  - Publicada no site: [ ] Sim [ ] Não
  - Data de publicação: **/**/\_\_\_\_

- [ ] **Termo de Uso atualizado**
  - Inclui menção à LGPD: [ ] Sim [ ] Não
  - Link para política de privacidade: [ ] Sim [ ] Não

- [ ] **Documentação técnica revisada**
  - `docs/MIGRACAO-LGPD.md` → Completo e atualizado
  - `docs/GUIA-MASCARAMENTO-CPF.md` → Completo e atualizado
  - `docs/SUMARIO-EXECUTIVO-LGPD.md` → Revisado pela direção

### Treinamento

- [ ] **Equipe RH treinada**
  - Conteúdo: Novas funcionalidades LGPD
  - Participantes: **\_** pessoas
  - Data: **/**/\_\_\_\_

- [ ] **Equipe de Desenvolvimento treinada**
  - Conteúdo: Uso de componentes CPF mascarado
  - Participantes: **\_** pessoas
  - Data: **/**/\_\_\_\_

- [ ] **Administradores treinados**
  - Conteúdo: Política de retenção e auditoria
  - Participantes: **\_** pessoas
  - Data: **/**/\_\_\_\_

### Processos

- [ ] **Cron job de retenção configurado**
  - Frequência: [ ] Mensal (1º dia do mês)
  - Horário: [ ] 2h da manhã
  - Plataforma: [ ] Windows Task Scheduler [ ] Vercel Cron [ ] Outro: **\_**

- [ ] **Processo de auditoria mensal definido**
  - Responsável: **********\_**********
  - Checklist criado: [ ] Sim [ ] Não

- [ ] **Processo de atendimento a direitos dos titulares**
  - Prazo: 15 dias
  - Responsável: **********\_**********
  - Email: dpo@qwork.com.br

---

## 🔍 Validação de Interface (Usuário Final)

### Testes com Perfil Funcionário

- [ ] **Login funcionando**
  - CPF válido aceito: [ ] Sim
  - CPF inválido rejeitado: [ ] Sim

- [ ] **Dashboard exibe CPF mascarado**
  - Próprio CPF: [ ] Mascarado [ ] Completo
  - Screenshot: **********\_**********

- [ ] **Avaliação funciona normalmente**
  - Pode iniciar: [ ] Sim
  - Pode responder: [ ] Sim
  - Pode finalizar: [ ] Sim

### Testes com Perfil RH

- [ ] **Lista de funcionários exibe CPF mascarado**
  - CPF no formato: `***.***.*89-09` [ ] Sim
  - Botão "Ver" CPF completo: [ ] Disponível (se admin)

- [ ] **Cadastro de novo funcionário**
  - Valida CPF corretamente: [ ] Sim
  - Rejeita CPF inválido: [ ] Sim

- [ ] **Exportação de relatórios**
  - Excel: CPF mascarado [ ] Sim
  - PDF: CPF mascarado [ ] Sim

### Testes com Perfil Admin

- [ ] **Gestão de gestores RH**
  - CPF mascarado na lista: [ ] Sim
  - Validação rigorosa no cadastro: [ ] Sim

- [ ] **Opção de revelar CPF**
  - Botão "Ver CPF" funciona: [ ] Sim
  - Botão "Ocultar" funciona: [ ] Sim

---

## 📊 Métricas de Sucesso

### Indicadores Técnicos

| Métrica                              | Valor Atual | Meta | Status        |
| ------------------------------------ | ----------- | ---- | ------------- |
| CPFs inválidos                       | **\_**      | 0    | [ ] ✅ [ ] ❌ |
| Avaliações sem base legal            | **\_**      | 0    | [ ] ✅ [ ] ❌ |
| CPF completo em logs                 | **\_**      | 0    | [ ] ✅ [ ] ❌ |
| Avaliações vencidas não anonimizadas | **\_**      | 0    | [ ] ✅ [ ] ❌ |
| Uptime da API de consentimento       | **\_** %    | 99%  | [ ] ✅ [ ] ❌ |

### Indicadores de Conformidade

| Requisito LGPD               | Status        | Evidência             |
| ---------------------------- | ------------- | --------------------- |
| Art. 6º, I (Finalidade)      | [ ] ✅ [ ] ❌ | Base legal registrada |
| Art. 6º, II (Qualidade)      | [ ] ✅ [ ] ❌ | Validação de CPF      |
| Art. 6º, III (Necessidade)   | [ ] ✅ [ ] ❌ | CPF mascarado         |
| Art. 6º, V (Limitação)       | [ ] ✅ [ ] ❌ | Política de retenção  |
| Art. 7º (Bases Legais)       | [ ] ✅ [ ] ❌ | API de consentimento  |
| Art. 18 (Direitos Titulares) | [ ] ✅ [ ] ❌ | Processo definido     |

---

## 🚨 Ações Corretivas (Se Necessário)

### Se houver CPFs inválidos:

```sql
-- Listar CPFs inválidos
SELECT * FROM cpfs_invalidos;

-- Corrigir manualmente (exemplo)
UPDATE funcionarios SET cpf = '[CPF_CORRETO]' WHERE cpf = '[CPF_INVALIDO]';

-- Revalidar
pnpm lgpd:auditar
```

### Se houver avaliações sem base legal:

```sql
-- Atualizar avaliações antigas com base legal padrão
UPDATE avaliacoes
SET base_legal = 'obrigacao_legal',
    data_consentimento = criado_em
WHERE base_legal IS NULL;
```

### Se houver problemas de performance:

```sql
-- Criar índices adicionais se necessário
CREATE INDEX IF NOT EXISTS idx_avaliacoes_base_legal ON avaliacoes(base_legal);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data_validade ON avaliacoes(data_validade) WHERE anonimizada = false;
```

---

## 📝 Aprovações Finais

### Aprovação Técnica

- [ ] **Todos os testes técnicos passaram**
  - Responsável: **********\_**********
  - Cargo: Tech Lead / CTO
  - Data: **/**/\_\_\_\_
  - Assinatura: **********\_**********

### Aprovação Jurídica

- [ ] **Conformidade LGPD validada**
  - Responsável: **********\_**********
  - Cargo: DPO / Jurídico
  - Data: **/**/\_\_\_\_
  - Assinatura: **********\_**********

### Aprovação de Negócio

- [ ] **Impacto nos processos avaliado**
  - Responsável: **********\_**********
  - Cargo: Gerente de Produto / CEO
  - Data: **/**/\_\_\_\_
  - Assinatura: **********\_**********

---

## 🎉 Conclusão

**Status da Migração:** [ ] ✅ Concluída com Sucesso [ ] ⚠️ Pendências [ ] ❌ Bloqueadores

**Observações:**

---

---

---

**Próximas ações:**

---

---

---

---

**Data de conclusão:** **/**/\_**\_  
**Responsável pela validação:** ********\_\_\_**********

