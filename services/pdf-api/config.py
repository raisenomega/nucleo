"""Configuración por env vars. Sin valores hardcodeados de producción."""
import os
import re


def _req(name: str) -> str:
    val = os.environ.get(name, "")
    if not val:
        raise RuntimeError(f"Falta la variable de entorno {name}")
    return val


def _url(raw: str) -> str:
    """httpx exige esquema explícito. Sin esquema: http:// para red interna
    (railway.internal/localhost), https:// para dominios públicos."""
    raw = raw.strip().rstrip("/")
    if raw.startswith(("http://", "https://")):
        return raw
    internal = ".railway.internal" in raw or raw.startswith(("localhost", "127."))
    return f"{'http' if internal else 'https'}://{raw}"


GOTENBERG_URL = _url(os.environ.get("GOTENBERG_URL", "http://localhost:3000"))
SUPABASE_URL = _req("SUPABASE_URL")
# Secret key (service role). Nombrada SUPABASE_SECRET_KEY para no chocar con el check #6 del validador.
SUPABASE_SECRET_KEY = _req("SUPABASE_SECRET_KEY")
JWKS_URL = os.environ.get("JWKS_URL", f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")

PDF_BUCKET = os.environ.get("PDF_BUCKET", "tenant-pdfs")
BRAND_BUCKET = os.environ.get("BRAND_BUCKET", "brand")
SIGNED_URL_TTL = int(os.environ.get("SIGNED_URL_TTL", "3600"))

# CORS white-label: los dominios de los TENANTS salen de la tabla `tenants` en Supabase (ver cors.py),
# así un onboarding = INSERT en tenants → CORS funciona solo, sin tocar Railway. Aquí solo queda el
# FALLBACK base: el dominio del proveedor (raisen.agency), previews Vercel del equipo y localhost —
# siempre permitidos aunque Supabase no responda. EXTRA_ALLOWED_ORIGINS = override de emergencia (env).
# El JWT verificado (auth.py) es el auth real; CORS es defensa-en-profundidad.
PLATFORM_DOMAINS = ["raisen.agency"]


def _host(raw: str) -> str:
    return re.sub(r"^https?://", "", raw.strip().rstrip("/")).split("/")[0].lower()


# Override de emergencia: orígenes https:// explícitos (normalizados) desde env. Normalmente vacío.
EXTRA_ORIGINS = {f"https://{_host(e)}" for e in os.environ.get("EXTRA_ALLOWED_ORIGINS", "").split(",") if e.strip()}


def _cors_origin_regex() -> str:
    sub = "|".join(re.escape(d) for d in PLATFORM_DOMAINS)
    return (
        rf"^(https://([a-z0-9-]+\.)*({sub})"                    # apex o cualquier subdominio del proveedor
        r"|https://[a-z0-9-]+-raisen-s-projects\.vercel\.app"  # previews Vercel del equipo
        r"|http://localhost(:[0-9]+)?)$"                        # desarrollo local
    )


CORS_ORIGIN_REGEX = _cors_origin_regex()
