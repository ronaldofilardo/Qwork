@echo off
REM Script de Execução Rápida de Testes com Auto-Correção
REM Uso: run-tests-loop.bat [iteracoes]

echo ====================================
echo   Auto-Fix de Testes - QWork
echo ====================================
echo.

REM Define variável de ambiente
set TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test

REM Número de iterações (padrão: 3)
set ITERATIONS=%1
if "%ITERATIONS%"=="" set ITERATIONS=3

echo Rodando ate %ITERATIONS% iteracoes...
echo.

powershell -ExecutionPolicy Bypass -File ".\scripts\auto-fix-tests.ps1" -MaxIterations %ITERATIONS%

echo.
echo ====================================
echo   Execucao Finalizada
echo ====================================
echo.
echo Para ver erros detalhados:
echo   pnpm test 2^>^&1 ^| Out-File test-errors.log
echo.

pause
