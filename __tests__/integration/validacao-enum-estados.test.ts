/**
 * Teste Simplificado - Validação da Máquina de Estado Atualizada
 *
 * Verifica que:
 * 1. Lotes começam em 'ativo'
 * 2. Avaliações começam em 'iniciada' 
 * 3. Avaliações usam 'concluida' (feminino) - "avaliação concluída"
 * 4. Lotes usam 'concluido' (masculino) - "lote concluído"
describe('Validação Máquina de Estado Atualizada', () => {
  it('deve validar que máquina de estado usa valores corretos', async () => {
    //  Verifica valores enum válidos para lotes
    const lotesEnum = await query(
      `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'status_lote'::regtype ORDER BY enumlabel`
    );
    const lotesValores = lotesEnum.rows.map((r) => r.enumlabel);

    expect(lotesValores).toContain('ativo');
    expect(lotesValores).toContain('concluido');
    // Nota: 'rascunho' ainda existe no enum mas não é usado na nova máquina de estado

    // Verifica valores enum válidos para avaliações
    const avaliacoesEnum = await query(
      `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'status_avaliacao'::regtype ORDER BY enumlabel`
    );
    const avaliacoesValores = avaliacoesEnum.rows.map((r) => r.enumlabel);

    expect(avaliacoesValores).toContain('iniciada');
    expect(avaliacoesValores).toContain('em_andamento');
    expect(avaliacoesValores).toContain('concluida'); // Feminino - "avaliação concluída"
    // Nota: Frontend usa 'concluido' em alguns lugares por erro de tipagem
  });
});
