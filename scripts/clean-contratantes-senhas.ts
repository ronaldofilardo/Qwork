import { query } from '../lib/db';

async function cleanContratantesSenhas() {
  try {
    // Desabilitar triggers temporariamente para limpeza em teste
    await query('ALTER TABLE contratantes_senhas DISABLE TRIGGER ALL');
    await query('DELETE FROM contratantes_senhas');
    await query('ALTER TABLE contratantes_senhas ENABLE TRIGGER ALL');
    console.log('✅ Tabela contratantes_senhas limpa');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

cleanContratantesSenhas();
