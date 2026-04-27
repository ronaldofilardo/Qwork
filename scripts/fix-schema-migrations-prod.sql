INSERT INTO schema_migrations (version, dirty) VALUES
(1200, false),
(1201, false),
(1202, false),
(1203, false),
(1204, false),
(1205, false),
(1206, false),
(1207, false),
(1208, false),
(1209, false)
ON CONFLICT DO NOTHING;

SELECT version, dirty FROM schema_migrations WHERE version BETWEEN 1200 AND 1209 ORDER BY version;
