-- Migration 1028: Corrige RLS em leads_representante para permitir acesso de vendedores
--
-- Problema: migration 1024 adicionou coluna vendedor_id em leads_representante
-- mas NÃO atualizou a policy leads_rep_own criada na migration 1022.
-- Resultado: vendedores recebem 0 rows mesmo com query correta no app.
--
-- Solução: Recriar a policy incluindo a clausula de acesso por vendedor_id.

-- Remover policy existente
DROP POLICY IF EXISTS leads_rep_own ON public.leads_representante;

-- Recriar com suporte a vendedores
CREATE POLICY leads_rep_own ON public.leads_representante
  FOR ALL
  USING (
    -- Representante vê todos os leads da sua carteira
    representante_id = public.current_representante_id()
    -- Admin e comercial veem tudo
    OR public.current_user_perfil() IN ('admin', 'comercial')
    -- Suporte pode visualizar (somente leitura controlada no app)
    OR public.current_user_perfil() = 'suporte'
    -- Vendedor vê apenas seus próprios leads
    OR (
      public.current_user_perfil() = 'vendedor'
      AND vendedor_id = (
        SELECT id FROM public.usuarios
        WHERE cpf = public.current_user_cpf()
        LIMIT 1
      )
    )
  )
  WITH CHECK (
    -- Representante pode inserir/editar na sua carteira
    representante_id = public.current_representante_id()
    -- Admin e comercial podem escrever
    OR public.current_user_perfil() IN ('admin', 'comercial')
    -- Vendedor pode apenas editar seus próprios leads (sem criar)
    OR (
      public.current_user_perfil() = 'vendedor'
      AND vendedor_id = (
        SELECT id FROM public.usuarios
        WHERE cpf = public.current_user_cpf()
        LIMIT 1
      )
    )
  );
