#!/usr/bin/env bash
# NÚCLEO by raisen — guardián de documentos confidenciales y secretos.
#
# POR QUÉ EXISTE: .gitignore solo evita que un archivo NUEVO se agregue por accidente. No protege nada que
# ya esté rastreado, y no cubre docs confidenciales cuyo nombre no encaje con los patrones del ignore. Una vez
# que un secreto entra al historial, quitarlo exige reescribir historia (y si ya se pusheó, rotar el secreto).
# Por eso este chequeo corre ANTES del commit: es el único momento en que el daño todavía es gratis.
#
# Uso:  check-confidential.sh staged   (hook pre-commit · revisa lo que está por entrar)
#       check-confidential.sh tracked  (validador/CI · revisa todo lo rastreado)
set -u
MODE="${1:-staged}"
ERRORS=0

# Nombres de documentos confidenciales. Deliberadamente MÁS AMPLIO que .gitignore: aquí caen también los que
# no siguen la convención de sufijo (-NUCLEO). Se evalúa sobre la ruta completa, sin distinguir mayúsculas.
# `nucleo.*\.md$` cubre NUCLEO en cualquier posicion del nombre: ERP-NUCLEO-COMPLETO.md se colaba por las
# reglas de sufijo. Los README rastreados no llevan "nucleo" en el nombre, asi que no hay falsos positivos.
CONFIDENTIAL='(^|/)(docs-nucleo|\.claude)/|nucleo[^/]*\.md$|(^|/)claude\.md$|source_of_truth|estado[-_]nucleo|main-protector|metodo-nucleo|prd[-_]nucleo|trilogy|landing-comercial|(^|/)(package|tema|protocolo|seguridad|esquema|agent-teams|ddd|auditoria|sonda)-[^/]*\.md$'

# Secretos por forma del valor, no por nombre de variable: así se detectan aunque estén pegados en un .md.
SECRETS='eyJhbGciOi[A-Za-z0-9_-]{20,}|sbp_[a-f0-9]{40}|re_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|BEGIN [A-Z ]*PRIVATE KEY'

if [ "$MODE" = "staged" ]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACMR)
else
  FILES=$(git ls-files)
fi

# 1 · Documentos confidenciales entrando al repo.
HITS=$(printf '%s\n' "$FILES" | grep -viE '^package-lock\.json$' | grep -iE "$CONFIDENTIAL" || true)
if [ -n "$HITS" ]; then
  echo "BLOQUEADO · documento(s) confidencial(es):"
  printf '%s\n' "$HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 2 · Rastreado pese a estar ignorado (el caso que .gitignore NO arregla solo).
TRACKED_IGNORED=$(git ls-files -i -c --exclude-standard 2>/dev/null || true)
if [ -n "$TRACKED_IGNORED" ]; then
  echo "BLOQUEADO · rastreado(s) pese a estar en .gitignore (usar: git rm --cached <archivo>):"
  printf '%s\n' "$TRACKED_IGNORED" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 3 · Secretos por contenido. Solo en archivos de texto y saltando el propio guardián y .env.example.
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  case "$f" in *.env.example|scripts/check-confidential.sh|package-lock.json) continue ;; esac
  file "$f" 2>/dev/null | grep -q "text" || continue
  FOUND=$(grep -nEo "$SECRETS" "$f" 2>/dev/null | head -3 || true)
  if [ -n "$FOUND" ]; then
    echo "BLOQUEADO · posible secreto en $f:"
    printf '%s\n' "$FOUND" | cut -c1-90 | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
  fi
done < <(printf '%s\n' "$FILES")

if [ $ERRORS -ne 0 ]; then
  echo ""
  echo "Si es un falso positivo: git commit --no-verify"
  echo "OJO: si el archivo YA se pusheo, ignorarlo despues no lo saca del historial."
  exit 1
fi
exit 0
