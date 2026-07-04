#!/usr/bin/env bash
# NÚCLEO by raisen — oráculo pre-push.
# Ejecutar antes de cada push. CI también lo ejecuta.
# Exit 0 = PASS. Exit 1 = FAIL con lista de violaciones.
set -u
ERRORS=0
LIMIT=75
SRC_DIR="apps/web/src"
SVC_DIR="services"
MIG_DIR="supabase/migrations"
INVARIANTS_FILE="$SRC_DIR/modules/tenant/domain/invariants.nucleo.ts"

echo "======================================="
echo " VALIDATE BEFORE PUSH — NUCLEO by raisen"
echo " $(date '+%Y-%m-%d %H:%M')"
echo "======================================="

section() { echo ""; echo "$1"; }
fail_block() { echo "$1" | sed 's/^/   FAIL /'; ERRORS=$((ERRORS + 1)); }
ok_line() { echo "   OK"; }

# 1. LONGITUD DE ARCHIVOS
section "1. Archivos > $LIMIT lineas:"
LONG=$(find "$SRC_DIR" "$SVC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) 2>/dev/null \
  | grep -vE '(^|/)routeTree\.gen\.ts$' \
  | xargs wc -l 2>/dev/null \
  | awk -v lim="$LIMIT" '$1 > lim && $2 != "total" {print $2 " (" $1 " lineas)"}')
if [ -n "$LONG" ]; then fail_block "$LONG"; else ok_line; fi

# 2. TYPESCRIPT PROHIBIDO
section "2. any / ts-ignore:"
ANY=$(grep -rn ": any\|as any\|@ts-ignore\|@ts-expect-error" \
  "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -vE "node_modules|routeTree\.gen\.ts" | head -20)
if [ -n "$ANY" ]; then fail_block "$ANY"; else ok_line; fi

# 3. IMPORTS CRUZADOS DE CAPA
section "3. Imports cruzados (domain->infra, application->infra):"
CROSS_D=$(grep -rn "from.*infrastructure\|require.*infrastructure" \
  "$SRC_DIR"/modules/*/domain/ --include="*.ts" 2>/dev/null)
CROSS_A=$(grep -rn "from.*infrastructure\|require.*infrastructure" \
  "$SRC_DIR"/modules/*/application/ --include="*.ts" 2>/dev/null)
if [ -n "$CROSS_D" ] || [ -n "$CROSS_A" ]; then
  [ -n "$CROSS_D" ] && fail_block "$CROSS_D (domain->infra)"
  [ -n "$CROSS_A" ] && fail_block "$CROSS_A (app->infra)"
else ok_line; fi

# 4. THROW EN DOMINIO
section "4. throw en domain/:"
# Excluye invariants.nucleo.ts: sus guards usan throw por diseno y el archivo esta protegido por SHA1.
THROWS=$(grep -rn "throw " "$SRC_DIR"/modules/*/domain/ --include="*.ts" 2>/dev/null \
  | grep -v "invariants.nucleo.ts")
if [ -n "$THROWS" ]; then fail_block "$THROWS"; else ok_line; fi

# 5. SIDE EFFECTS EN DOMINIO
section "5. Side effects en domain/:"
SE=$(grep -rn "new Date()\|Math.random()\|fetch(\|console\.\|process\." \
  "$SRC_DIR"/modules/*/domain/ --include="*.ts" 2>/dev/null)
if [ -n "$SE" ]; then fail_block "$SE"; else ok_line; fi

# 6. SECRETS EN CODIGO
section "6. Secrets en codigo fuente:"
SECRETS=$(grep -rn \
  "sk_live_\|sk_test_\|service_role\|PRIVATE_KEY\|SUPABASE_SERVICE\|password\s*=\s*['\"]" \
  "$SRC_DIR" "$SVC_DIR" --include="*.ts" --include="*.tsx" --include="*.py" 2>/dev/null \
  | grep -v "\.env\|example\|placeholder" | head -10)
if [ -n "$SECRETS" ]; then fail_block "$SECRETS"; else ok_line; fi

# 7. AUTH DESHABILITADA / TEMP
section "7. Auth deshabilitada / TEMP:"
AUTH=$(grep -rn "TEMP.*auth\|auth.*disabled\|skip.*auth\|bypass.*auth" \
  "$SRC_DIR" --include="*.ts" 2>/dev/null | head -10)
if [ -n "$AUTH" ]; then fail_block "$AUTH"; else ok_line; fi

# 8. TABLAS SIN tenant_id (multitenant obligatorio) — especifico NUCLEO
section "8. Migraciones con tabla sin tenant_id:"
NO_TENANT=""
if [ -d "$MIG_DIR" ]; then
  while IFS= read -r f; do
    if grep -qiE "create table[[:space:]]+(if not exists[[:space:]]+)?(public\.)?(tenants|categories|settings|tenant_order_counters)" "$f"; then
      continue
    fi
    if grep -qiE "create table" "$f" && ! grep -qE "tenant_id[[:space:]]+uuid" "$f"; then
      NO_TENANT="${NO_TENANT}${f}\n"
    fi
  done < <(find "$MIG_DIR" -type f -name "*.sql" 2>/dev/null)
fi
if [ -n "$NO_TENANT" ]; then fail_block "$(printf "$NO_TENANT")"; else ok_line; fi

# 9. LITERALES DE MARCA en src/ (nucleo sin marca) — especifico NUCLEO
section "9. Literales de marca en src/:"
BRAND=$(grep -rniE "#[0-9a-f]{6}([^0-9a-f]|$)|787[- ]?[0-9]{3}[- ]?[0-9]{4}|zafacones|@zramos" \
  "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | head -10)
if [ -n "$BRAND" ]; then fail_block "$BRAND"; else ok_line; fi

# 10. SHA1 de invariants.nucleo.ts intacto — especifico NUCLEO
section "10. SHA1 de invariants.nucleo.ts:"
if [ -f "scripts/verify-guardrails.sh" ]; then
  bash scripts/verify-guardrails.sh 2>&1 | sed 's/^/   /'
  bash scripts/verify-guardrails.sh > /dev/null 2>&1 || ERRORS=$((ERRORS + 1))
else
  echo "   FAIL scripts/verify-guardrails.sh no existe"
  ERRORS=$((ERRORS + 1))
fi

# 11. IDENTIDAD DEL AUTOR DEL ULTIMO COMMIT — protocolo git-identidad
section "11. Identidad del ultimo commit:"
EXPECTED_EMAIL="${NUCLEO_EXPECTED_AUTHOR_EMAIL:-283876472+raisenomega@users.noreply.github.com}"
LAST_EMAIL="$(git log -1 --format='%ae' 2>/dev/null || echo '')"
if [ -z "$LAST_EMAIL" ]; then
  echo "   OK (repo sin commits todavia)"
elif [ "$LAST_EMAIL" != "$EXPECTED_EMAIL" ]; then
  fail_block "autor: $LAST_EMAIL (esperado: $EXPECTED_EMAIL). Revisar PROTOCOLO-IDENTIDAD-GIT-NUCLEO.md"
else
  ok_line
fi

# 12. DOCUMENTOS PROTEGIDOS NO DEBEN ESTAR EN EL REPO
section "12. Documentos protegidos fuera del ignore:"
PROTECTED_REGEX='(^|/)(.*-NUCLEO|.*_NUCLEO|metodo-nucleo|PRD[_-]?nucleo|SOURCE_OF_TRUTH|Estado[_-]?Nucleo|CLAUDE|MAIN-PROTECTOR|TEMA-.*|PROTOCOLO-.*|SEGURIDAD-.*|ESQUEMA-.*|AGENT-TEAMS-.*|DDD-.*)\.md$|(^|/)\.claude/|(^|/)\.gitconfig-|(^|/)docs-nucleo/'
LEAKS="$(git ls-files 2>/dev/null | grep -iE "$PROTECTED_REGEX" || true)"
if [ -n "$LEAKS" ]; then
  fail_block "$LEAKS"
  echo "   -> Estos archivos deben estar en .gitignore (ver MAIN-PROTECTOR.md)."
else
  ok_line
fi

# RESULTADO
echo ""
echo "======================================="
if [ $ERRORS -eq 0 ]; then
  echo " RESULTADO: PASS"
  echo " Listo para PR."
  echo "======================================="
  exit 0
else
  echo " RESULTADO: FAIL ($ERRORS categorias con violaciones)"
  echo " Corregir antes de push. No se mergea con errores."
  echo "======================================="
  exit 1
fi
