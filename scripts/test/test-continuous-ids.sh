#!/bin/bash
# Script para testar sequência contínua de IDs entre entidades e clínicas

echo "🔍 Testando Sequência Contínua de IDs..."
echo ""

# Configurar banco de dados
DB_USER="postgres"
DB_NAME="nr-bps_db"
DB_HOST="localhost"
DB_PASSWORD="123456"

# Função para executar query
run_query() {
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h $DB_HOST -c "$1"
}

# Resetar banco
echo "1️⃣ Limpando banco de dados..."
run_query "DELETE FROM clinicas; DELETE FROM entidades;"
run_query "ALTER SEQUENCE seq_contratantes_id RESTART WITH 1;"

echo "✅ Banco preparado"
echo ""

# Teste 1: Inserir primeira entidade (ID=1)
echo "2️⃣ Inserindo primeira entidade..."
ENTIDADE_1=$(run_query "INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular) VALUES ('Entidade 1', '12345678901234', 'ent1@test.com', '1111111111', 'Rua 1', 'SP', 'SP', '01000000', 'Resp 1', '12345678901', 'resp1@test.com', '11999999999') RETURNING id;" | tail -2 | head -1 | xargs)

if [ "$ENTIDADE_1" = "1" ]; then
    echo "✅ Entidade 1 criada com ID=1"
else
    echo "❌ Erro: Esperado ID=1, obtido ID=$ENTIDADE_1"
    exit 1
fi

# Teste 2: Inserir primeira clínica (ID=2)
echo "3️⃣ Inserindo primeira clínica..."
CLINICA_1=$(run_query "INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular) VALUES ('Clínica 1', '98765432101234', 'cli1@test.com', '2222222222', 'Av 1', 'RJ', 'RJ', '20000000', 'Resp CLI 1', '98765432101', 'respCli1@test.com', '21999999999') RETURNING id;" | tail -2 | head -1 | xargs)

if [ "$CLINICA_1" = "2" ]; then
    echo "✅ Clínica 1 criada com ID=2"
else
    echo "❌ Erro: Esperado ID=2, obtido ID=$CLINICA_1"
    exit 1
fi

# Teste 3: Inserir segunda entidade (ID=3)
echo "4️⃣ Inserindo segunda entidade..."
ENTIDADE_2=$(run_query "INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular) VALUES ('Entidade 2', '11111111111111', 'ent2@test.com', '3333333333', 'Rua 2', 'MG', 'MG', '30000000', 'Resp 2', '11111111111', 'resp2@test.com', '31999999999') RETURNING id;" | tail -2 | head -1 | xargs)

if [ "$ENTIDADE_2" = "3" ]; then
    echo "✅ Entidade 2 criada com ID=3"
else
    echo "❌ Erro: Esperado ID=3, obtido ID=$ENTIDADE_2"
    exit 1
fi

# Teste 4: Inserir segunda clínica (ID=4)
echo "5️⃣ Inserindo segunda clínica..."
CLINICA_2=$(run_query "INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular) VALUES ('Clínica 2', '22222222222222', 'cli2@test.com', '4444444444', 'Av 2', 'DF', 'DF', '70000000', 'Resp CLI 2', '22222222222', 'respCli2@test.com', '61999999999') RETURNING id;" | tail -2 | head -1 | xargs)

if [ "$CLINICA_2" = "4" ]; then
    echo "✅ Clínica 2 criada com ID=4"
else
    echo "❌ Erro: Esperado ID=4, obtido ID=$CLINICA_2"
    exit 1
fi

echo ""
echo "📊 Verificando sequência contínua..."
run_query "SELECT 'entidade' as tipo, id FROM entidades UNION ALL SELECT 'clinica', id FROM clinicas ORDER BY id;"

echo ""
echo "🎉 TODOS OS TESTES PASSARAM!"
echo "✅ Os IDs são contínuos entre entidades e clínicas"
