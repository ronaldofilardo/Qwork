-- Migration 076: Criar tabelas auditoria_laudos e notificacoes_admin se ausentes
BEGIN;

-- auditoria_laudos
CREATE TABLE IF NOT EXISTS public.auditoria_laudos (
    id bigint PRIMARY KEY,
    lote_id integer NOT NULL,
    laudo_id integer,
    emissor_cpf character varying(11),
    emissor_nome character varying(200),
    acao character varying(64) NOT NULL,
    status character varying(32) NOT NULL,
    ip_address inet,
    observacoes text,
    criado_em timestamp without time zone DEFAULT now() NOT NULL
);

-- sequence
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'auditoria_laudos_id_seq') THEN
        CREATE SEQUENCE public.auditoria_laudos_id_seq START WITH 1 INCREMENT BY 1 CACHE 1;
        ALTER SEQUENCE public.auditoria_laudos_id_seq OWNER TO CURRENT_USER;
        ALTER SEQUENCE public.auditoria_laudos_id_seq OWNED BY public.auditoria_laudos.id;
        ALTER TABLE public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);
    END IF;
END $$;

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';
COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';
COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';

-- notificacoes_admin
CREATE TABLE IF NOT EXISTS public.notificacoes_admin (
    id integer PRIMARY KEY,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    lote_id integer,
    visualizada boolean DEFAULT false,
    criado_em timestamp with time zone DEFAULT now(),
    visualizado_em timestamp with time zone
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'notificacoes_admin_id_seq') THEN
        CREATE SEQUENCE public.notificacoes_admin_id_seq AS integer START WITH 1 INCREMENT BY 1 CACHE 1;
        ALTER SEQUENCE public.notificacoes_admin_id_seq OWNER TO CURRENT_USER;
        ALTER SEQUENCE public.notificacoes_admin_id_seq OWNED BY public.notificacoes_admin.id;
        ALTER TABLE public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);
    END IF;
END $$;

COMMENT ON TABLE public.notificacoes_admin IS 'Notificações críticas para administradores do sistema';
COMMENT ON COLUMN public.notificacoes_admin.tipo IS 'Tipo da notificação (sem_emissor, erro_critico, etc)';
COMMENT ON COLUMN public.notificacoes_admin.mensagem IS 'Mensagem descritiva da notificação';
COMMENT ON COLUMN public.notificacoes_admin.lote_id IS 'Referência ao lote relacionado (opcional)';

-- índices básicos
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_criado ON public.auditoria_laudos (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_lote ON public.auditoria_laudos (lote_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_admin_criado_em ON public.notificacoes_admin (criado_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_admin_tipo ON public.notificacoes_admin (tipo, criado_em DESC);

COMMIT;
