-- Migration 1222: seed da wallet institucional do QWork na configuração da Sociedade

INSERT INTO public.beneficiarios_sociedade (
  codigo,
  nome,
  nome_empresarial,
  percentual_participacao,
  ativo,
  observacoes
)
VALUES (
  'qwork',
  'QWork',
  'QWork Plataforma',
  0,
  TRUE,
  'Wallet institucional da plataforma para recolhimento de impostos e operação do split.'
)
ON CONFLICT (codigo) DO NOTHING;
