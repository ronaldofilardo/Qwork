import { query } from '../lib/db';

async function cleanContratantesSenhas() {
  try {
    // Desabilitar triggers temporariamente para limpeza em teste
    await query('ALTER TABLE entidades_senhas DISABLE TRIGGER ALL');
    await query('DELETE FROM entidades_senhas');
    await query('ALTER TABLE entidades_senhas ENABLE TRIGGER ALL');
    console.log('✅ Tabela entidades_senhas limpa');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

cleanContratantesSenhas();
