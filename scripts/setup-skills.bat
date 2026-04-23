@echo off
:: QWork Skills Setup (Windows) — Instala/atualiza todas as AI skills de design
:: Uso: scripts\setup-skills.bat

setlocal EnableDelayedExpansion
cd /d "%~dp0.."

echo.
echo [skills] QWork Skills Setup (Windows)
echo.

:: ── 1. Impeccable (18 comandos de design) ─────────────────────────────────
echo [skills] Instalando Impeccable...
if exist ".tmp-impeccable" rmdir /s /q ".tmp-impeccable"
git clone --depth 1 https://github.com/pbakaus/impeccable.git .tmp-impeccable --quiet 2>&1
if errorlevel 1 (
    echo [erro] Falha ao clonar Impeccable. Verifique conexao git.
    exit /b 1
)
if not exist ".agents\skills" mkdir ".agents\skills"
xcopy ".tmp-impeccable\.agents\skills\*" ".agents\skills\" /E /I /Y /Q >nul 2>&1
rmdir /s /q ".tmp-impeccable"
echo [ok] Impeccable instalado (18 skills em .agents\skills\)

:: ── 2. Taste Skill (design anti-slop) ─────────────────────────────────────
echo [skills] Instalando Taste Skill...
if exist ".tmp-taste-skill" rmdir /s /q ".tmp-taste-skill"
git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git .tmp-taste-skill --quiet 2>&1
if errorlevel 1 (
    echo [erro] Falha ao clonar Taste Skill. Verifique conexao git.
    exit /b 1
)
if not exist ".agents\skills\design-taste-frontend" mkdir ".agents\skills\design-taste-frontend"
if not exist ".agents\skills\redesign-existing-projects" mkdir ".agents\skills\redesign-existing-projects"
if not exist ".agents\skills\output-skill" mkdir ".agents\skills\output-skill"
copy /Y ".tmp-taste-skill\skills\taste-skill\SKILL.md" ".agents\skills\design-taste-frontend\SKILL.md" >nul
copy /Y ".tmp-taste-skill\skills\redesign-skill\SKILL.md" ".agents\skills\redesign-existing-projects\SKILL.md" >nul
copy /Y ".tmp-taste-skill\skills\output-skill\SKILL.md" ".agents\skills\output-skill\SKILL.md" >nul
rmdir /s /q ".tmp-taste-skill"
echo [ok] Taste Skill instalado

:: ── 3. Resumo ──────────────────────────────────────────────────────────────
echo.
echo [ok] Setup concluido!
echo.
echo   Skills instaladas em .agents\skills\:
for /d %%D in (.agents\skills\*) do echo     - %%~nD
echo.
echo   Para usar no chat Copilot (VS Code):
echo     "@Copilot /audit app/rh"              -- detectar issues UX
echo     "@Copilot /polish components/Modal"   -- preparar para deploy
echo     "@Copilot cria componente com Taste Skill"  -- design anti-slop
echo.
echo   Para usar CLI (sem agent):
echo     npx impeccable detect app/
echo     npx impeccable detect app/rh --json
echo.
echo   Code Review (GitHub PRs):
echo     Comentar @claude review         -- review + subscribe pushes futuras
echo     Comentar @claude review once    -- review unica
echo     Admin setup: claude.ai/admin-settings/claude-code
echo.
pause
