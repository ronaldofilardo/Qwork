// Script Node.js: Aplicar correção da função prevent_mutation_during_emission (SIMPLIFICADO)
// Data: 10/02/2026
// Uso: node scripts/aplicar-correcao-prevent-mutation-simples.cjs

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.production.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) {
      DATABASE_URL = match[1].trim().replace(/["']/g, '');
    }
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!');
  process.exit(1);
}

const correcaoSQL = `
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 130
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante emissão
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informações do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo já foi emitido, prevenir mudanças críticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se está tentando mudar campos críticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_mutation_during_emission IS 
'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. 
Atualizada em migration 1009 (emergência) para remover referência ao campo processamento_em removido.';
`;

async function aplicar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('=============================================');
    console.log('  APLICANDO CORREÇÃO EM PROD');
    console.log('=============================================\n');

    await client.connect();
    console.log('✓ Conectado ao banco\n');

    // Verificar estado atual
    console.log('1. Verificando função atual...');
    const antes = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    if (antes.rows[0]) {
      const temErro = antes.rows[0].def.includes(
        'SELECT status, emitido_em, processamento_em'
      );
      if (temErro) {
        console.log('   ❌ Função referencia processamento_em no SELECT\n');
      } else {
        console.log('   ✅ Função JÁ está corrigida!\n');
        await client.end();
        return;
      }
    }

    // Aplicar correção
    console.log('2. Aplicando CREATE OR REPLACE FUNCTION...');
    await client.query(correcaoSQL);
    console.log('   ✅ Comando executado\n');

    // Verificar se foi corrigido
    console.log('3. Validando correção...');
    const depois = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    if (depois.rows[0]) {
      // Buscar especificamente pela parte problemática: SELECT com processamento_em
      const aindaTemErro = depois.rows[0].def.includes(
        'SELECT status, emitido_em, processamento_em'
      );
      if (aindaTemErro) {
        console.log(
          '   ❌ ERRO: Função ainda referencia processamento_em no SELECT!'
        );
        console.log('\n   Definição atual:');
        console.log(depois.rows[0].def);
        process.exit(1);
      } else {
        console.log('   ✅ Função corrigida com sucesso!');
        console.log(
          '   ✅ Query agora usa: SELECT status, emitido_em (SEM processamento_em)\n'
        );
      }
    }

    // Registrar auditoria
    console.log('4. Registrando auditoria...');
    await client.query(`
      INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, details)
      VALUES ('migration_1009', 'system', 'MIGRATION_APPLIED', 'prevent_mutation_during_emission',
              'Correção urgente: Removida referência a processamento_em da função');
    `);
    console.log('   ✅ Auditoria registrada\n');

    console.log('=============================================');
    console.log('  ✅ CORREÇÃO APLICADA COM SUCESSO!');
    console.log('=============================================\n');

    console.log('Próximos passos:');
    console.log(
      '  1. Testar /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar'
    );
    console.log(
      '  2. Testar /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar'
    );
    console.log('  3. Monitorar logs de produção\n');
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('\nStack:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

aplicar();
