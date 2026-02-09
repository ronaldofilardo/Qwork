import { query } from '../../lib/db';

async function checkAndDelete() {
  try {
    console.log('🔍 Verificando empresa com CNPJ 41877277000184...');
    const tomador = await query(
      'SELECT id, tipo, nome, cnpj, responsavel_cpf, status FROM tomadors WHERE cnpj = $1',
      ['41877277000184']
    );

    if (tomador.rows.length > 0) {
      const empresa = tomador.rows[0];
      console.log('✅ Empresa encontrada:', empresa);

      console.log('🔍 Verificando responsável com CPF 87545772920...');
      const responsavel = await query(
        'SELECT id, nome, cpf, perfil FROM funcionarios WHERE cpf = $1',
        ['87545772920']
      );

      if (responsavel.rows.length > 0) {
        console.log('✅ Responsável encontrado:', responsavel.rows[0]);
      } else {
        console.log('❌ Responsável não encontrado na tabela funcionarios');
      }

      // Verificar dependências antes de deletar
      console.log('🔍 Verificando contratos relacionados...');
      const contratos = await query(
        'SELECT id, aceito FROM contratos WHERE tomador_id = $1',
        [empresa.id]
      );
      console.log(`📄 Contratos encontrados: ${contratos.rows.length}`);

      console.log('🔍 Verificando pagamentos relacionados...');
      const pagamentos = await query(
        'SELECT id, status FROM pagamentos WHERE tomador_id = $1',
        [empresa.id]
      );
      console.log(`💳 Pagamentos encontrados: ${pagamentos.rows.length}`);

      // Verificar se há outras dependências
      console.log('🔍 Verificando outras dependências...');
      // Nota: tabela "empresas" pode não existir no schema atual
      let empresasCount = 0;
      try {
        const empresas = await query(
          'SELECT id FROM empresas WHERE tomador_id = $1',
          [empresa.id]
        );
        empresasCount = empresas.rows.length;
      } catch (error) {
        console.log(
          'ℹ️  Tabela empresas não encontrada (pode não existir no schema atual)'
        );
      }
      console.log(`🏢 Empresas relacionadas: ${empresasCount}`);

      // Se não há dependências críticas, proceder com a exclusão
      if (
        contratos.rows.length === 0 &&
        pagamentos.rows.length === 0 &&
        empresasCount === 0
      ) {
        console.log('🗑️  Iniciando exclusão...');

        // Deletar responsável se existir
        if (responsavel.rows.length > 0) {
          await query('DELETE FROM funcionarios WHERE cpf = $1', [
            '87545772920',
          ]);
          console.log('✅ Responsável deletado');
        }

        // Deletar empresa
        await query('DELETE FROM tomadors WHERE cnpj = $1', [
          '41877277000184',
        ]);
        console.log('✅ Empresa deletada');

        console.log('🎉 Exclusão concluída com sucesso!');
      } else {
        console.log(
          '⚠️  Não é possível deletar automaticamente - há dependências:'
        );
        if (contratos.rows.length > 0)
          console.log(`  - ${contratos.rows.length} contrato(s)`);
        if (pagamentos.rows.length > 0)
          console.log(`  - ${pagamentos.rows.length} pagamento(s)`);
        if (empresasCount > 0)
          console.log(`  - ${empresasCount} empresa(s) relacionada(s)`);

        console.log('🔧 Execute as exclusões manualmente na ordem correta:');
        console.log(
          '  1. DELETE FROM contratos WHERE tomador_id =',
          empresa.id
        );
        console.log(
          '  2. DELETE FROM pagamentos WHERE tomador_id =',
          empresa.id
        );
        if (empresasCount > 0)
          console.log(
            '  3. DELETE FROM empresas WHERE tomador_id =',
            empresa.id
          );
        console.log('  4. DELETE FROM tomadors WHERE id =', empresa.id);
      }
    } else {
      console.log('❌ Empresa não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkAndDelete();
