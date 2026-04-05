import { query } from '../lib/db';

async function fixAllocator() {
  try {
    console.log('=== CORRIGINDO LOTE_ID_ALLOCATOR ===\n');

    // 1. Ver valor atual do allocator
    console.log('[1] Valor atual do allocator:');
    const allocator = await query('SELECT last_id FROM lote_id_allocator');
    console.log('  last_id:', allocator.rows[0]?.last_id || 'NENHUM');

    // 2. Ver MAX(id) real
    console.log('\n[2] MAX(id) na tabela:');
    const maxId = await query('SELECT MAX(id) as max_id FROM lotes_avaliacao');
    console.log('  max_id:', maxId.rows[0].max_id);

    // 3. Atualizar o allocator
    console.log('\n[3] Atualizando allocator...');
    await query('UPDATE lote_id_allocator SET last_id = $1', [
      maxId.rows[0].max_id,
    ]);

    // 4. Verificar
    const allocatorAfter = await query('SELECT last_id FROM lote_id_allocator');
    console.log('  Novo valor:', allocatorAfter.rows[0].last_id);

    // 5. Testar próximo ID
    console.log('\n[4] Testando próximo ID:');
    const testNext = await query('SELECT fn_next_lote_id() as next_id');
    console.log('  Próximo ID que será gerado:', testNext.rows[0].next_id);

    // Voltar o allocator (pois consumimos um ID no teste)
    await query('UPDATE lote_id_allocator SET last_id = last_id - 1');

    console.log('\n✅ ALLOCATOR CORRIGIDO!');
    console.log(
      `Próximo lote criado terá ID: ${parseInt(maxId.rows[0].max_id) + 1}`
    );
  } catch (error) {
    console.error('\n❌ ERRO:', error);
  } finally {
    process.exit(0);
  }
}

fixAllocator();
