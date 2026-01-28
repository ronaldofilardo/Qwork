@echo off
REM Script para iniciar servidor em modo teste no Windows
set NODE_ENV=test
set TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
pnpm dev