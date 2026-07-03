#!/usr/bin/env bash
# NÚCLEO by raisen — verificación de invariantes.
# Se llama desde el hook PreToolUse y desde CI. Falla si el archivo cambió sin re-registrar.
set -euo pipefail

FILE="apps/web/src/modules/tenant/domain/invariants.nucleo.ts"
EXPECTED_SHA1="77b5c6bf3f157c4e57650fd7ceb7142478306f61"

if [ ! -f "$FILE" ]; then
  echo "ERROR: no existe $FILE"
  exit 1
fi

ACTUAL_SHA1="$(sha1sum "$FILE" | cut -d' ' -f1)"

if [ "$EXPECTED_SHA1" != "$ACTUAL_SHA1" ]; then
  echo "ERROR: invariantes modificados sin autorizacion."
  echo "  esperado: $EXPECTED_SHA1"
  echo "  actual:   $ACTUAL_SHA1"
  echo "  Protocolo: test rojo -> cambio aprobado -> actualizar EXPECTED_SHA1 -> test verde."
  exit 1
fi

echo "OK: invariantes intactos ($ACTUAL_SHA1)"
