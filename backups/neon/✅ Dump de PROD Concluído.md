**✅ Dump de PROD Concluído**

**Criei um export completo do banco de dados de produção (Neon).**



**📁 Arquivos gerados em neon:**

**Arquivo	Tamanho	Tipo**

**neon\_full\_2026-03-12\_1773314854086.sql	1.41 MB	Schema + Dados (Completo)**

**neon\_schema\_2026-03-12\_1773314854086.sql	0.52 MB	Schema Only**

**neon\_data\_2026-03-12\_1773314854086.sql	0.89 MB	Dados Only**

**Total: 2.82 MB**



**📌 Como usar:**

**Restaurar tudo: psql -U postgres -d seu\_banco -f neon\_full\_2026-03-12\_1773314854086.sql**

**Restaurar schema apenas: psql -U postgres -d seu\_banco -f neon\_schema\_2026-03-12\_1773314854086.sql**

**Restaurar dados apenas: psql -U postgres -d seu\_banco -f neon\_data\_2026-03-12\_1773314854086.sql**

**✋ Atenção: Os arquivos contêm dados de produção — guardar em local seguro.**





