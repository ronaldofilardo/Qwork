#!/bin/bash
# QWork Skills Setup — Instala/atualiza todas as AI skills de design
# Uso: bash scripts/setup-skills.sh
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[skills]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }

cd "$(dirname "$0")/.."
ROOT=$(pwd)

log "QWork Skills Setup"
echo ""

# ── 1. Impeccable (18 comandos de design) ────────────────────────────────────
log "Instalando Impeccable..."
if [ -d ".tmp-impeccable" ]; then rm -rf .tmp-impeccable; fi
git clone --depth 1 https://github.com/pbakaus/impeccable.git .tmp-impeccable --quiet
mkdir -p .agents/skills
cp -r .tmp-impeccable/.agents/skills/. .agents/skills/
rm -rf .tmp-impeccable
ok "Impeccable instalado (18 skills em .agents/skills/)"

# ── 2. Taste Skill (design anti-slop) ────────────────────────────────────────
log "Instalando Taste Skill..."
if [ -d ".tmp-taste-skill" ]; then rm -rf .tmp-taste-skill; fi
git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git .tmp-taste-skill --quiet
mkdir -p .agents/skills/design-taste-frontend
mkdir -p .agents/skills/redesign-existing-projects
mkdir -p .agents/skills/output-skill
cp .tmp-taste-skill/skills/taste-skill/SKILL.md .agents/skills/design-taste-frontend/SKILL.md
cp .tmp-taste-skill/skills/redesign-skill/SKILL.md .agents/skills/redesign-existing-projects/SKILL.md
cp .tmp-taste-skill/skills/output-skill/SKILL.md .agents/skills/output-skill/SKILL.md
rm -rf .tmp-taste-skill
ok "Taste Skill instalado (design-taste-frontend, redesign-existing-projects, output-skill)"

# ── 3. Validar ────────────────────────────────────────────────────────────────
SKILL_COUNT=$(find .agents/skills -name "SKILL.md" | wc -l | tr -d ' ')
ok "Total de skills instaladas: ${SKILL_COUNT}"

echo ""
log "Skills disponíveis em .agents/skills/:"
ls .agents/skills/ | sed 's/^/  - /'

echo ""
ok "Setup concluído!"
echo ""
echo "  Para usar no chat Copilot (VS Code):"
echo "    \"@Copilot /audit app/rh\"       — detectar issues UX"
echo "    \"@Copilot /polish components/Modal\" — preparar para deploy"
echo "    \"@Copilot cria componente com Taste Skill\" — design anti-slop"
echo ""
echo "  Para usar CLI (sem agent):"
echo "    npx impeccable detect app/"
echo "    npx impeccable detect app/rh --json"
echo ""
echo "  Code Review (GitHub PRs):"
echo "    Comentar @claude review        — review + subscribe pushes futuras"
echo "    Comentar @claude review once   — review única"
echo "    Admin setup: claude.ai/admin-settings/claude-code"
echo ""
