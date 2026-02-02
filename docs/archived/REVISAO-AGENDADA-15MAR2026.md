# Correções Q1 2026 - Agendadas para Revisão

**Data de criação:** 29 de janeiro de 2026  
**Revisão agendada:** 15 de março de 2026

---

## 📋 Propósito

Este arquivo lista correções implementadas no Q1 2026 (janeiro-fevereiro) que devem ser revisadas em 15/03/2026. Se estiverem concluídas e sem problemas reportados por 60 dias, podem ser arquivadas.

---

## 📝 Documentos para Revisão (15/03/2026)

### Correções de Janeiro 2026

1. **2026-01-02-cards-lotes-entidades.md**
   - Implementação de cards para lotes de entidades
   - Verificar: Nenhum bug reportado em 60 dias

2. **2026-01-05_alinhamento-elegibilidade-clinicas-entidades.md**
   - Alinhamento de regras de elegibilidade
   - Verificar: Sistema rodando estável

3. **2026-01-13-fluxo-cadastro-ativacao-sistemico.md**
   - Revisão completa do fluxo de cadastro e ativação
   - Verificar: Cadastros funcionando sem issues

4. **2026-01-22-fix-gestor-entidade-as-funcionario.md**
   - Correção crítica: Gestor entidade não deve estar em funcionários
   - Verificar: Testes passando, sem regressões

5. **2026-01-22-lint-chunking.md**
   - Implementação de chunking para linting
   - Verificar: Build estável sem erros de lint

6. **2026-01-22-rbac-rls-audit.md**
   - Auditoria completa de RBAC e RLS
   - ⚠️ Este foi CONSOLIDADO em security/GUIA-COMPLETO-RLS-RBAC.md
   - Pode ser arquivado imediatamente

7. **2026-01-23-criar-lotes-avaliacao.md**
   - Melhorias na criação de lotes
   - Verificar: Lotes criados sem erros

8. **2026-01-23-funcionarios-entidades-empresas-clinicas.md**
   - Segregação clara de funcionários por tipo de contratante
   - Verificar: RLS funcionando corretamente

9. **2026-01-24-segregacao-ambientes.md**
   - Separação de ambientes dev/test/prod
   - Verificar: Nenhum vazamento entre ambientes

10. **ANALISE-FLUXO-ENTIDADE-040126.md**
    - Análise completa do fluxo de entidades
    - Verificar: Documentação ainda relevante

11. **ANALISE-MAQUINA-ESTADO-EMISSAO-AUTOMATICA-2026-01-05.md**
    - Máquina de estado para emissão automática
    - Verificar: Emissão rodando sem falhas

12. **BUG-CRITICO-ENTIDADE-SEM-EMISSAO-AUTO-2026-01-05.md**
    - Fix de bug crítico
    - Verificar: Bug não reapareceu

13. **CORRECAO-073-ELEGIBILIDADE-CONSIDERA-APENAS-CONCLUIDAS.md**
    - Correção de elegibilidade
    - Verificar: Apenas avaliações concluídas contam

14. **CORRECAO-DEFINITIVA-ELEGIBILIDADE-073-074.md**
    - Correção definitiva (seguimento da 073)
    - Verificar: Sem necessidade de novas correções

15. **CORRECAO-EMISSAO-IMEDIATA-2026-01-18.md**
    - Fix de emissão imediata
    - Verificar: Emissões imediatas funcionando

16. **CORRECAO-FLUXO-PAGAMENTO-FRONTEND.md**
    - Correções no frontend de pagamento
    - Verificar: Fluxo de pagamento estável

17. **correcao-fluxo-pagamento-sem-recibo-20260118-1042.md**
    - Correção de pagamento sem recibo
    - Verificar: Recibos gerados corretamente

18. **correcao-migracoes-pos-reset-2026-01-22.md**
    - Correções após reset de banco
    - Verificar: Migrações aplicadas sem erros

19. **CORRECOES-CRITICAS-2026-01-04.md**
    - Múltiplas correções críticas
    - Verificar: Sistema estável

20. **CORRECOES-IMPLEMENTADAS-040126.md**
    - Resumo de correções de 04/01
    - Verificar: Todas funcionando

21. **CORRECOES-INCONSISTENCIAS-STATUS-2026-01-04.md**
    - Correções de inconsistências de status
    - Verificar: Status coerentes em todo sistema

22. **CORRECOES-QUERYCLIENTPROVIDER-2026-01-04.md**
    - Correções no QueryClientProvider
    - Verificar: Queries rodando sem problemas

---

## ✅ Checklist de Revisão (15/03/2026)

Para cada documento acima, verificar:

- [ ] Correção implementada há mais de 60 dias
- [ ] Nenhum bug relacionado reportado
- [ ] Testes relevantes passando
- [ ] Sistema rodando estável
- [ ] Sem necessidade de nova iteração

**Se TODOS os itens estiverem ✅, mover para `docs/archived/corrections-2026-Q1/`**

---

## 📊 Estatísticas

- **Total de documentos:** 22
- **Período:** 02/01/2026 - 24/01/2026
- **Data de revisão:** 15/03/2026
- **Critério:** 60 dias sem issues

---

## 🔧 Comando para Arquivamento (executar em 15/03/2026)

```powershell
# Verificar primeiro se todos os critérios foram atendidos!
# Depois executar:

git mv docs/corrections/2026-01-02-cards-lotes-entidades.md docs/archived/corrections-2026-Q1/
git mv docs/corrections/2026-01-05_alinhamento-elegibilidade-clinicas-entidades.md docs/archived/corrections-2026-Q1/
# ... (repetir para todos os arquivos listados)

# Ou em batch:
$files = @(
  "2026-01-02-cards-lotes-entidades.md",
  "2026-01-05_alinhamento-elegibilidade-clinicas-entidades.md",
  # ... (adicionar todos)
)

foreach ($file in $files) {
  git mv "docs/corrections/$file" "docs/archived/corrections-2026-Q1/"
}

git commit -m "chore(docs): Arquivar correções Q1 2026 após 60 dias sem issues"
```

---

## 📌 Notas

1. **Não arquivar antes de 15/03/2026** - Período de estabilização necessário
2. **Verificar logs de erros** antes de arquivar
3. **Consultar equipe** se houver dúvidas sobre estabilidade
4. **Manter documentação crítica** mesmo se antiga (ex: RBAC-RLS já consolidada)
