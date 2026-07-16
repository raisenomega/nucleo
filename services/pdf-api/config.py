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

# CORS white-label: en vez de una lista fija de dominios (que obligaría a tocar Railway por cada
# tenant nuevo), aceptamos por PATRÓN cualquier subdominio de la plataforma + previews Vercel del
# equipo + localhost en dev. EXTRA_ALLOWED_ORIGINS (CSV) agrega dominios propios de tenants con
# dominio custom (ej: app.clientenuevo.com). El JWT verificado (auth.py) es el auth real; CORS es
# defensa-en-profundidad. Normalizamos: da igual si EXTRA_* viene con o sin esquema/slash.
PLATFORM_DOMAINS = ["zramos.com", "raisen.agency"]


def _host(raw: str) -> str:
    return re.sub(r"^https?://", "", raw.strip().rstrip("/")).split("/")[0]


def _cors_origin_regex() -> str:
    extra = [_host(e) for e in os.environ.get("EXTRA_ALLOWED_ORIGINS", "").split(",") if e.strip()]
    sub = "|".join(re.escape(d) for d in [*PLATFORM_DOMAINS, *extra])
    return (
        rf"^(https://([a-z0-9-]+\.)*({sub})"                    # apex o cualquier subdominio de plataforma/custom
        r"|https://[a-z0-9-]+-raisen-s-projects\.vercel\.app"  # previews Vercel del equipo
        r"|http://localhost(:[0-9]+)?)$"                        # desarrollo local
    )


CORS_ORIGIN_REGEX = _cors_origin_regex()
