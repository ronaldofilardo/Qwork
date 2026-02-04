# Plano de Injeção de Avaliações Aleatórias

## 📋 Objetivo

Injetar avaliações com respostas aleatórias no sistema para gerar laudos mais robustos e testar a capacidade de análise do sistema com **funcionários já existentes** no banco.

## 🎯 Dados Configurados

### Informações Fornecidas

- **CNPJ da Clínica**: `09110380000191` (RLJ COMERCIAL EXPORTADORA)
- **CPF do RH**: `04703084945` (Tani aKari)
- **CNPJ da Empresa**: `65406011000111` (deve existir no banco)
- **Banco de Dados**: `Neon PostgreSQL` (nuvem)
- **Connection String**: `postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require`

### Parâmetros do Script

- **Funcionários**: Usa até 50 funcionários **existentes** da empresa
- **Avaliações por Funcionário**: 1 (avaliação atual)
- **Respostas por Avaliação**: 37 itens (todos os grupos COPSOQ III + extensões)
- **Status Final do Lote**: `concluido` (pronto para solicitação de emissão)

## 📊 Estrutura das Avaliações

### Grupos de Questões (COPSOQ III + Extensões)

1. **Grupo 1 - Demandas no Trabalho** (4 itens) - Negativa
2. **Grupo 2 - Organização e Conteúdo** (4 itens) - Positiva
3. **Grupo 3 - Relações Interpessoais** (6 itens) - Positiva
4. **Grupo 4 - Interface Trabalho-Indivíduo** (4 itens) - Negativa
5. **Grupo 5 - Valores no Trabalho** (3 itens) - Positiva
6. **Grupo 6 - Personalidade (Opcional)** (2 itens) - Positiva
7. **Grupo 7 - Saúde e Bem-Estar** (3 itens) - Negativa
8. **Grupo 8 - Comportamentos Ofensivos** (3 itens) - Negativa
9. **Grupo 9 - Jogos de Apostas** (4 itens) - Negativa
10. **Grupo 10 - Endividamento** (4 itens) - Negativa

### Escala de Respostas

```
Nunca:        0
Raramente:   25
Às vezes:    50
Muitas vezes: 75
Sempre:     100
```

## 🎲 Lógica de Geração Aleatória

### Distribuição Inteligente

O script utiliza uma distribuição probabilística mais realista:

#### Grupos Negativos (menos é melhor)

- **30%** → Nunca (0)
- **25%** → Raramente (25)
- **20%** → Às vezes (50)
- **15%** → Muitas vezes (75)
- **10%** → Sempre (100)

#### Grupos Positivos (mais é melhor)

- **10%** → Nunca (0)
- **15%** → Raramente (25)
- **20%** → Às vezes (50)
- **25%** → Muitas vezes (75)
- **30%** → Sempre (100)

Esta distribuição simula um cenário mais realista onde:

- Grupos negativos tendem a ter menos problemas
- Grupos positivos tendem a ter mais aspectos favoráveis
- Ainda há variabilidade suficiente para análises estatísticas

## 🔧 O que o Script Faz

### 1. Validação Inicial

✅ Verifica se a clínica existe (CNPJ 09110380000191)  
✅ Verifica se o RH existe (CPF 04703084945)  
✅ Verifica se o RH tem perfil correto  
✅ Verifica se a empresa existe (CNPJ 65406011000111)

### 2. Busca de Funcionários Existentes

👥 Busca funcionários ativos da empresa (máximo 50)  
📋 Considera apenas funcionários com perfil 'funcionario'  
🎯 Respeita o `nivel_cargo` de cada funcionário

### 3. Criação do Lote

📦 Calcula próximo `numero_ordem` do lote  
🏷️ Gera código no formato XXX-DDMMAA  
📝 Cria lote com status 'ativo'

### 4. Geração de Avaliações

🎯 Para cada funcionário existente:

- Cria 1 avaliação com status 'concluida'
- Gera 37 respostas aleatórias (todos os itens dos 10 grupos)
- Calcula scores por grupo
- Categoriza resultados (baixo/médio/alto)
- Cria vínculo na tabela `lotes_avaliacao_funcionarios`
- Atualiza `indice_avaliacao` do funcionário

### 5. Finalização

✅ Marca lote como 'concluido'  
📊 Deixa pronto para solicitação de emissão de laudo

### 6. Dados Criados

#### Lote de Avaliação

```sql
codigo = XXX-DDMMAA (ex: 001-310126)
numero_ordem = sequencial por empresa
status = 'concluido'
tipo = 'completo'
liberado_por = 04703084945 (CPF do RH)
```

#### Avaliações (usa funcionários existentes)

```sql
funcionario_cpf = CPF do funcionário existente
lote_id = ID do lote criado
status = 'concluida'
inicio = NOW()
envio = NOW()
grupo_atual = 10 (completa)
```

#### Vínculo Lote-Funcionário

```sql
lotes_avaliacao_funcionarios:
  - lote_id
  - funcionario_id
  - avaliacao_id
```

#### Respostas

```sql
avaliacao_id
grupo (1-10)
item (Q1, Q2, Q3... Q37)
valor (0, 25, 50, 75 ou 100)
```

#### Resultados

```sql
avaliacao_id
grupo (1-10)
dominio (nome do grupo)
score (média calculada)
categoria (baixo/medio/alto)
```

## 🚀 Execução

### Pré-requisitos

```bash
# Instalar dependências (se necessário)
npm install pg

# ⚠️ IMPORTANTE: O script conecta direto no banco Neon (nuvem)
# NÃO usar em produção sem ajustes
```

### Comando de Execução

```bash
# Na raiz do projeto
node scripts/injetar-avaliacoes-aleatorias.mjs
```

### ⚠️ ATENÇÃO

- O script conecta diretamente no banco **Neon** (PostgreSQL na nuvem)
- **NÃO** criar novos funcionários, usa os existentes
- Empresa e clínica **devem existir** no banco
- O lote é marcado como **'concluido'** automaticamente
- Após execução, o RH pode solicitar emissão do laudo

### Saída Esperada

```
✅ Conectado ao banco Neon

📋 Verificando clínica...
   ✓ Clínica encontrada: RLJ COMERCIAL EXPORTADORA (ID: 21)

👤 Verificando RH...
   ✓ RH encontrado: Tani aKari

🏢 Verificando empresa...
   ✓ Empresa encontrada: [Nome da Empresa] (ID: XX)

👥 Buscando funcionários da empresa...
   ✓ 50 funcionários encontrados

   1. João Silva (12345678901) - Administrativo/Analista - Nível: operacional
   2. Maria Santos (23456789012) - RH/Coordenador - Nível: gestao
   ... e mais 48 funcionários

📦 Preparando lote de avaliação...
   ✓ Lote criado: 001-310126 (ID: XX, Ordem: 1)

🎯 Criando avaliações (1 por funcionário)...
   📝 João Silva (12345678901) - Nível: operacional
      ✓ Avaliação criada (ID: XX) - 37 respostas
   📝 Maria Santos (23456789012) - Nível: gestao
      ✓ Avaliação criada (ID: XX) - 37 respostas
   ...

📋 Finalizando lote...
   ✓ Lote marcado como 'concluido'

✅ Processo concluído!

📊 RESUMO:
   • Clínica: RLJ COMERCIAL EXPORTADORA (09110380000191)
   • Empresa: [Nome da Empresa] (65406011000111)
   • Lote: 001-310126 (Ordem: 1)
   • Status do Lote: concluido ✅
   • Funcionários avaliados: 50
   • Avaliações criadas: 50
   • Respostas criadas: 1850
   • Resultados calculados: 500
   • Vínculos lote-funcionário: 50

🎯 Próximos passos:
   1. Acessar o sistema com RH (CPF: 04703084945)
   2. Ir até a empresa "[Nome da Empresa]"
   3. Localizar o lote "001-310126"
   4. Solicitar emissão do laudo
   5. Emissor irá gerar o laudo PDF

✨ O lote está pronto para emissão de laudo!
```

## ✅ Verificação

### Verificar Lote Criado

```sql
SELECT
  la.id,
  
  la.titulo,
  la.status,
  la.numero_ordem,
  la.liberado_em,
  la.finalizado_em,
  COUNT(a.id) as total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.empresa_id = (
  SELECT id FROM empresas_clientes WHERE cnpj = '65406011000111'
)
AND la.codigo LIKE '%-310126'  -- Data de hoje
GROUP BY la.id
ORDER BY la.criado_em DESC
LIMIT 1;
```

### Verificar Avaliações do Lote

```sql
SELECT
  f.nome,
  f.cpf,
  f.nivel_cargo,
  a.id as avaliacao_id,
  a.status,
  a.inicio,
  a.envio,
  COUNT(r.id) as total_respostas
FROM funcionarios f
JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
LEFT JOIN respostas r ON a.id = r.avaliacao_id
WHERE a.lote_id = (
  SELECT id FROM lotes_avaliacao
  WHERE codigo LIKE '%-310126'
  ORDER BY criado_em DESC LIMIT 1
)
GROUP BY f.nome, f.cpf, f.nivel_cargo, a.id
ORDER BY f.nome;
```

### Verificar Respostas

```sql
SELECT
  a.id as avaliacao_id,
  COUNT(r.id) as total_respostas,
  COUNT(DISTINCT r.grupo) as grupos_respondidos
FROM avaliacoes a
LEFT JOIN respostas r ON a.id = r.avaliacao_id
WHERE a.lote_id = (
  SELECT id FROM lotes_avaliacao
  WHERE codigo LIKE 'LOTE-TESTE-%'
  ORDER BY id DESC
  LIMIT 1
)
GROUP BY a.id
ORDER BY a.id;
```

### Verificar Resultados

```sql
SELECT
  r.grupo,
  r.dominio,
  COUNT(*) as total_avaliacoes,
  ROUND(AVG(r.score), 2) as score_medio,
  COUNT(CASE WHEN r.categoria = 'baixo' THEN 1 END) as baixo,
  COUNT(CASE WHEN r.categoria = 'medio' THEN 1 END) as medio,
  COUNT(CASE WHEN r.categoria = 'alto' THEN 1 END) as alto
FROM resultados r
WHERE r.avaliacao_id IN (
  SELECT id FROM avaliacoes
  WHERE lote_id = (
    SELECT id FROM lotes_avaliacao
    WHERE codigo LIKE 'LOTE-TESTE-%'
    ORDER BY id DESC
    LIMIT 1
  )
)
GROUP BY r.grupo, r.dominio
ORDER BY r.grupo;
```

## 🎨 Próximos Passos

### 1. Executar o Script

```bash
node scripts/injetar-avaliacoes-aleatorias.mjs
```

### 2. Verificar Dados no Banco

- Executar queries de verificação acima
- Confirmar que lote está com status='concluido'
- Verificar vínculos na tabela `lotes_avaliacao_funcionarios`

### 3. Acessar o Sistema como RH

- **Login**: CPF 04703084945
- **Senha**: [senha do RH]
- Navegar até: Dashboard RH → Empresas → [Nome da Empresa]

### 4. Localizar o Lote

- Procurar pelo código do lote (ex: 001-310126)
- Verificar que status é **"Concluído"**
- Conferir quantidade de avaliações concluídas

### 5. Solicitar Emissão do Laudo

- Clicar no botão **"Solicitar Emissão do Laudo"**
- O sistema criará uma solicitação para o emissor
- O lote entrará na fila de emissão

### 6. Emissão pelo Emissor

- Emissor acessa o dashboard
- Localiza o lote na fila
- Gera o laudo PDF
- Laudo fica disponível para download

### 7. Validar Qualidade do Laudo

- Verificar se o laudo contém análises robustas
- Conferir gráficos e estatísticas
- Validar cálculos de scores
- Verificar recomendações geradas

## ⚠️ Observações Importantes

### Sobre Funcionários

- **NÃO cria** funcionários novos, usa os existentes
- Respeita o `nivel_cargo` de cada funcionário
- Máximo de 50 funcionários por execução
- Apenas funcionários ativos e com perfil 'funcionario'

### Sobre o Lote

- Lote é marcado como **'concluido'** automaticamente
- Código segue padrão XXX-DDMMAA
- `numero_ordem` é sequencial por empresa
- Status permite solicitação imediata de emissão

### Sobre Avaliações

- 1 avaliação por funcionário (não histórico)
- Status 'concluida' com data atual
- 37 respostas por avaliação (todos os 10 grupos)
- Distribuição de respostas é ponderada para realismo

### Sobre o Banco

- Conecta no **Neon** (PostgreSQL na nuvem)
- **NÃO é banco local**
- Credenciais estão no script
- Cuidado ao executar múltiplas vezes

## 🔒 Segurança

- Script usa conexão local (localhost)
- Senha hardcoded (apenas para desenvolvimento/teste)
- **NÃO executar em produção sem ajustes**
- Considere usar variáveis de ambiente para credenciais

## 📝 Customização

Para ajustar os parâmetros, edite o objeto `CONFIG` no script:

```javascript
const CONFIG = {
  cnpjClinica: '09110380000191',
  cpfRh: '04703084945',
  cnpjEmpresa: '65406011000111',
  quantidadeMaximaFuncionarios: 50, // ← Máximo de funcionários a avaliar
};
```

### Outras Customizações Possíveis

```javascript
// Alterar distribuição de respostas (linha ~100)
function gerarRespostaAleatoria(tipoGrupo) {
  // Ajustar probabilidades aqui
}

// Alterar grupos de questões (linha ~25)
const grupos = [
  // Adicionar/remover grupos
];
```

---

**Criado em**: 31/01/2026  
**Versão**: 1.0  
**Autor**: Sistema QWork
