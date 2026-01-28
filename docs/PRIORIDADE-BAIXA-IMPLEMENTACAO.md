# Prioridade Baixa - Implementação Completa

## ✅ Status: TODAS AS FUNCIONALIDADES IMPLEMENTADAS

**Data de conclusão:** 21 de dezembro de 2025  
**Migrations corrigidas:** 022, 023  
**Nova migration:** 024 (Prioridade Baixa Features)

---

## 🔧 Correções de Migrations Anteriores

### Migration 022: RLS Contratação Personalizada (Corrigida)

**Problema identificado:** Uso de `OLD` em RLS policies (não suportado no PostgreSQL)

**Solução aplicada:**

- Removida referência a `OLD.status` na policy de update
- Simplificada verificação para permitir apenas status 'cancelado' e 'contrato_aceito'
- Removida verificação de imutabilidade de CNPJ/tipo em contratantes

**Arquivo:** `database/migrations/022_rls_contratacao_personalizada.sql`

### Migration 023: Sistema de Notificações (Reescrita Completa)

**Problemas identificados:**

- Erro de codificação WIN1252 vs UTF8
- Uso de `destinatario_id` (integer) ao invés de `destinatario_cpf` (text)
- Role `authenticated` não existe no PostgreSQL comum

**Solução aplicada:**

- **Novo arquivo:** `database/migrations/023_sistema_notificacoes_fix.sql`
- Alterada estrutura para usar `destinatario_cpf TEXT` ao invés de `destinatario_id INTEGER`
- Removidas referências a role `authenticated`, usando queries diretas
- Corrigidos triggers para usar loop e inserir notificações individualmente
- Atualizados serviços e APIs para usar CPF

**Arquivos atualizados:**

- `lib/notification-service.ts` - Todas as interfaces e métodos agora usam CPF
- `app/api/notificacoes/*.ts` - 4 rotas atualizadas para usar `session.cpf`
- `components/NotificationHub.tsx` - Props alteradas para usar CPF

**Script de aplicação:** `scripts/powershell/aplicar-migrations-corrigidas.ps1`

---

## 🎯 Novas Funcionalidades (Prioridade Baixa)

### 1. Histórico de Alterações de Valores

**Tabela:** `historico_alteracoes_valores`

**Funcionalidades:**

- ✅ Registra automaticamente todas as alterações de valores via trigger
- ✅ Armazena valores anteriores e novos
- ✅ Exige justificativa (mínimo 20 caracteres)
- ✅ Tipos de alteração: ajuste_manual, reajuste_anual, correcao_erro, acordo_comercial, outro
- ✅ Auditoria completa: CPF, nome, role, data, IP, user-agent
- ✅ View `vw_historico_alteracoes_valores_completo` com métricas:
  - Diferença de valor
  - Direção da mudança (aumento/redução)
  - Percentual de mudança
  - Dias desde alteração

**Trigger:** `trigger_registrar_alteracao_valor`

- Acionado em UPDATE de `contratacao_personalizada`
- Detecta mudanças em `valor_por_funcionario` ou `valor_total_estimado`
- Registro automático no histórico

### 2. Campos Customizáveis por Clínica

**Tabela:** `clinica_configuracoes`

**Funcionalidades:**

- ✅ Campos customizados via JSONB (totalmente flexível)
- ✅ Configurações de branding:
  - Logo URL
  - Cor primária (validação hexadecimal #RRGGBB)
  - Cor secundária
- ✅ Configurações de relatórios:
  - Template de relatório personalizado
  - Incluir logo em relatórios (boolean)
  - Formato de data preferencial (dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd)
- ✅ Constraint: uma configuração por clínica
- ✅ Função auxiliar: `obter_config_clinica(clinica_id, chave)` para buscar valores específicos

**Serviço:** `ClinicaConfiguracaoService`

- `buscarPorClinica(clinicaId)` - Buscar configuração
- `salvar(clinicaId, dto, cpfEditor)` - Upsert (insert or update)
- `obterCampoCustomizado(clinicaId, chave)` - Buscar campo específico
- `adicionarCampoCustomizado()` - Adicionar novo campo
- `removerCampoCustomizado()` - Remover campo
- `validarCor(cor)` - Validar formato hexadecimal
- `obterCores(clinicaId)` - Buscar cores ou retornar padrão
- `listarTodas()` - Listar todas (admin)

**API:** `GET/PUT /api/clinica/configuracoes`

**Exemplos de uso:**

```json
{
  "campos_customizados": {
    "campos_extras_funcionario": ["matricula_interna", "centro_custo"],
    "labels_customizados": {
      "funcionario": "Colaborador",
      "avaliacao": "Pesquisa"
    }
  },
  "cor_primaria": "#FF6B00",
  "cor_secundaria": "#0066CC",
  "formato_data_preferencial": "dd/MM/yyyy"
}
```

### 3. Templates de Contrato Editáveis

**Tabela:** `templates_contrato`

**Funcionalidades:**

- ✅ Templates armazenados como HTML/Markdown
- ✅ Sistema de placeholders: `{{contratante_nome}}`, `{{valor_total}}`, etc.
- ✅ Tipos: plano_fixo, plano_personalizado, padrao
- ✅ Versionamento automático (incrementa versão a cada update)
- ✅ Template padrão por tipo (apenas um pode ser padrão)
- ✅ Ativo/Inativo (soft delete)
- ✅ Tags e metadata (JSONB)
- ✅ Trigger garante apenas um template padrão por tipo

**Template padrão inserido:**

- Nome: "Contrato Plano Personalizado - Padrao"
- Inclui cláusulas padrão
- Placeholders para personalização

**Serviço:** `TemplateContratoService`

- `listar(tipo?, apenasAtivos)` - Listar templates
- `buscarPadrao(tipo)` - Buscar template padrão
- `buscarPorId(id)` - Buscar template específico
- `criar(dto, cpfCriador)` - Criar novo template
- `atualizar(id, dados, cpfEditor)` - Atualizar template (incrementa versão)
- `renderizarTemplate(conteudo, variaveis)` - Substituir placeholders
- `gerarContrato(dto)` - Gerar contrato renderizado
- `deletar(id)` - Soft delete (desativar)
- `clonar(id, novoNome, cpfCriador)` - Criar cópia

**API:** `GET/POST /api/admin/templates-contrato`

**Exemplo de uso:**

```typescript
const contratoRenderizado = await TemplateContratoService.gerarContrato({
  template_id: 1,
  variaveis: {
    contratante_nome: 'Clínica ABC',
    contratante_cnpj: '12.345.678/0001-99',
    valor_total: 10000,
    valor_por_funcionario: 50,
    numero_funcionarios: 200,
    data_contrato: '21/12/2025',
  },
});
```

### 4. Multi-Idioma para Notificações

**Tabela:** `notificacoes_traducoes`

**Idiomas suportados:**

- 🇧🇷 Português (pt_BR) - Padrão
- 🇺🇸 Inglês (en_US)
- 🇪🇸 Espanhol (es_ES)

**Funcionalidades:**

- ✅ Traduções armazenadas por chave + idioma
- ✅ Categorias: titulo, mensagem, botao, geral
- ✅ Constraint: uma tradução por chave+idioma
- ✅ Função `obter_traducao(chave, idioma)` com fallback para pt_BR
- ✅ Coluna `idioma_preferencial` adicionada em `clinicas`
- ✅ Traduções padrão inseridas para pré-cadastro criado (3 idiomas)

**Serviço:** `I18nService`

- `obterTraducao(chave, idioma)` - Buscar tradução
- `renderizarTexto(template, variaveis)` - Substituir placeholders
- `obterTraducaoRenderizada(chave, variaveis, idioma)` - Buscar e renderizar
- `salvarTraducao(dto)` - Upsert de tradução
- `listarPorChave(chave)` - Listar todos os idiomas de uma chave
- `listarChaves()` - Listar todas as chaves disponíveis
- `obterIdiomaClinica(clinicaId)` - Buscar idioma preferencial
- `atualizarIdiomaClinica(clinicaId, idioma)` - Atualizar idioma
- `listarPorCategoria(categoria, idioma?)` - Filtrar por categoria
- `deletar(chave, idioma)` - Deletar tradução
- `importarTraducoes(traducoes[])` - Import em lote
- `obterMapaTraducoes(idioma)` - Todas as traduções de um idioma
- `traducaoExiste(chave, idioma)` - Verificar existência
- `obterEstatisticas()` - Estatísticas de cobertura de traduções

**Chaves de tradução padrão inseridas:**

```
pre_cadastro_criado_titulo (pt_BR, en_US, es_ES)
pre_cadastro_criado_mensagem (pt_BR, en_US, es_ES)
pre_cadastro_criado_botao (pt_BR, en_US, es_ES)
```

**Exemplo de uso:**

```typescript
// Buscar tradução renderizada
const mensagem = await I18nService.obterTraducaoRenderizada(
  'pre_cadastro_criado_mensagem',
  { numero_funcionarios: 150 },
  'en_US'
);
// Resultado: "A new personalized plan pre-registration has been created and awaits value definition. Estimated employees: 150."

// Obter estatísticas
const stats = await I18nService.obterEstatisticas();
// { total_chaves: 3, traducoes_por_idioma: { pt_BR: 3, en_US: 3, es_ES: 3 }, chaves_incompletas: [] }
```

---

## 📁 Arquivos Criados/Modificados

### Migrations (3)

1. `database/migrations/022_rls_contratacao_personalizada.sql` (corrigido)
2. `database/migrations/023_sistema_notificacoes_fix.sql` (reescrito)
3. `database/migrations/024_prioridade_baixa_features.sql` (novo)

### Services (3 novos)

4. `lib/template-contrato-service.ts`
5. `lib/clinica-configuracao-service.ts`
6. `lib/i18n-service.ts`

### Serviços Atualizados (1)

7. `lib/notification-service.ts` - Alterado de ID para CPF

### APIs (3 novas, 4 atualizadas)

8. `app/api/admin/templates-contrato/route.ts` (GET/POST)
9. `app/api/clinica/configuracoes/route.ts` (GET/PUT)
10. `app/api/notificacoes/route.ts` (atualizado - usa CPF)
11. `app/api/notificacoes/contagem/route.ts` (atualizado - usa CPF)
12. `app/api/notificacoes/marcar-lida/route.ts` (atualizado - usa CPF)
13. `app/api/notificacoes/marcar-todas-lidas/route.ts` (atualizado - usa CPF)

### Componentes Atualizados (1)

14. `components/NotificationHub.tsx` - Props alteradas para usar CPF

### Scripts (1)

15. `scripts/powershell/aplicar-migrations-corrigidas.ps1`

---

## 🚀 Como Aplicar as Migrations

### Passo 1: Aplicar Migrations Corrigidas

```powershell
# Executar script automatizado
.\scripts\powershell\aplicar-migrations-corrigidas.ps1
```

### Passo 2: Aplicar Migration de Prioridade Baixa

```powershell
psql -U postgres -d nr-bps_db -f database/migrations/024_prioridade_baixa_features.sql
```

### Verificação

```sql
-- Verificar tabelas criadas
\dt historico_alteracoes_valores
\dt clinica_configuracoes
\dt templates_contrato
\dt notificacoes_traducoes

-- Verificar views
\dv vw_historico_alteracoes_valores_completo

-- Verificar funções
\df obter_config_clinica
\df obter_traducao
```

---

## 📊 Estatísticas de Implementação

| Métrica                       | Valor                    |
| ----------------------------- | ------------------------ |
| Migrations criadas/corrigidas | 3                        |
| Tabelas novas                 | 4                        |
| Views novas                   | 1                        |
| Triggers novos                | 2                        |
| Serviços novos                | 3                        |
| APIs novas                    | 2                        |
| APIs atualizadas              | 4                        |
| Componentes atualizados       | 1                        |
| Idiomas suportados            | 3                        |
| Traduções padrão              | 9 (3 chaves × 3 idiomas) |
| Linhas de código              | ~2.000+                  |

---

## ✅ Checklist de Funcionalidades

### Histórico de Alterações

- [x] Tabela de histórico criada
- [x] Trigger automático funcionando
- [x] View com métricas calculadas
- [x] Auditoria completa (CPF, data, IP, etc.)

### Campos Customizáveis

- [x] Tabela de configurações criada
- [x] Serviço completo implementado
- [x] API GET/PUT funcional
- [x] Validações de cores
- [x] Função auxiliar para buscar campos

### Templates de Contrato

- [x] Tabela de templates criada
- [x] Template padrão inserido
- [x] Sistema de versionamento
- [x] Renderização de placeholders
- [x] Serviço completo
- [x] API admin implementada
- [x] Trigger para garantir único padrão

### Multi-Idioma

- [x] Tabela de traduções criada
- [x] 3 idiomas suportados
- [x] Traduções padrão inseridas
- [x] Serviço I18n completo
- [x] Função de fallback
- [x] Idioma preferencial por clínica
- [x] Estatísticas de cobertura

---

## 🔮 Próximos Passos Sugeridos

### Opcional: Melhorias Futuras

1. **Editor visual de templates** - Interface WYSIWYG para editar contratos
2. **Página de administração de traduções** - Interface para gerenciar idiomas
3. **Histórico de alterações de configurações** - Rastrear mudanças em configurações
4. **Exportação de templates** - Download de templates como arquivos
5. **Validação de placeholders** - Verificar se todos os placeholders foram substituídos
6. **Temas personalizados** - Aplicar cores da clínica na UI
7. **Relatórios de uso de templates** - Quais templates são mais usados
8. **Versionamento de configurações** - Histórico de mudanças em configurações

---

## 📞 Suporte

### Verificar Estrutura

```sql
-- Histórico de alterações
SELECT * FROM vw_historico_alteracoes_valores_completo LIMIT 5;

-- Configurações
SELECT * FROM clinica_configuracoes WHERE clinica_id = 1;

-- Templates
SELECT id, nome, tipo_template, padrao, ativo FROM templates_contrato;

-- Traduções
SELECT chave_traducao, COUNT(*) as idiomas
FROM notificacoes_traducoes
GROUP BY chave_traducao;
```

### Testar Funções

```sql
-- Obter configuração
SELECT obter_config_clinica(1, 'campos_extras_funcionario');

-- Obter tradução
SELECT obter_traducao('pre_cadastro_criado_titulo', 'en_US');

-- Estatísticas de traduções
SELECT * FROM (
  SELECT idioma, COUNT(*) as total
  FROM notificacoes_traducoes
  GROUP BY idioma
) t;
```

---

## 🏆 Conclusão

Implementação **completa** das funcionalidades de Prioridade Baixa:

✅ **Histórico de Alterações** - Auditoria automática de mudanças de valores  
✅ **Campos Customizáveis** - Flexibilidade total por clínica  
✅ **Templates Editáveis** - Contratos personalizáveis com versionamento  
✅ **Multi-Idioma** - Suporte a 3 idiomas com fallback

**Correções aplicadas:**
✅ Migration 022 - RLS policies corrigidas  
✅ Migration 023 - Sistema de notificações reescrito (CPF-based)

**Status:** ✅ **PRONTO PARA PRODUÇÃO**

---

_Documento gerado em: 21 de dezembro de 2025_  
_Versão: 2.0_
