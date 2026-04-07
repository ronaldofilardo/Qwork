SELECT table_name, count(*) AS col_count FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name ORDER BY table_name;
