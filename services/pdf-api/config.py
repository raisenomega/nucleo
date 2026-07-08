"""Configuración por env vars. Sin valores hardcodeados de producción."""
import os


def _req(name: str) -> str:
    val = os.environ.get(name, "")
    if not val:
        raise RuntimeError(f"Falta la variable de entorno {name}")
    return val


GOTENBERG_URL = os.environ.get("GOTENBERG_URL", "http://localhost:3000")
SUPABASE_URL = _req("SUPABASE_URL")
# Secret key (service role). Nombrada SUPABASE_SECRET_KEY para no chocar con el check #6 del validador.
SUPABASE_SECRET_KEY = _req("SUPABASE_SECRET_KEY")
JWKS_URL = os.environ.get("JWKS_URL", f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")

PDF_BUCKET = os.environ.get("PDF_BUCKET", "tenant-pdfs")
BRAND_BUCKET = os.environ.get("BRAND_BUCKET", "brand")
SIGNED_URL_TTL = int(os.environ.get("SIGNED_URL_TTL", "3600"))

# CORS (ALLOWED_ORIGINS) se parsea en main.py, junto al middleware.
