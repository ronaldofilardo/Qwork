import { NovosCadastrosActionSchema } from '@/app/api/admin/novos-cadastros/schemas';

describe('NovosCadastrosActionSchema', () => {
  test('accepts aprovar_personalizado with contratante_id alias', () => {
    const payload = {
      acao: 'aprovar_personalizado',
      contratante_id: 32,
      valor_por_funcionario: 10.5,
      numero_funcionarios: 1000,
    } as const;

    expect(() => NovosCadastrosActionSchema.parse(payload)).not.toThrow();
  });

  test('accepts aprovar_personalizado with entidade_id', () => {
    const payload = {
      acao: 'aprovar_personalizado',
      entidade_id: 32,
      valor_por_funcionario: 10.5,
      numero_funcionarios: 1000,
    } as const;

    expect(() => NovosCadastrosActionSchema.parse(payload)).not.toThrow();
  });

  test('rejects aprovar_personalizado with zero valor_por_funcionario', () => {
    const payload = {
      acao: 'aprovar_personalizado',
      contratante_id: 32,
      valor_por_funcionario: 0,
      numero_funcionarios: 1000,
    } as const;

    expect(() => NovosCadastrosActionSchema.parse(payload)).toThrow();
  });
});
