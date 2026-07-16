"""CORS 100% dinámico: los orígenes permitidos salen de la tabla `tenants` en Supabase.

Onboarding de un tenant = INSERT en tenants (primary_domain / allowed_origins) → CORS funciona solo,
sin tocar Railway nunca. Cache en memoria (TTL 5 min) para no consultar Supabase en cada request; si
Supabase no responde, conservamos el último set y caemos al regex base (raisen.agency/Vercel/localhost).
El JWT verificado (auth.py) sigue siendo el auth real; CORS es defensa-en-profundidad.
"""
import re
import time

from config import CORS_ORIGIN_REGEX, EXTRA_ORIGINS
from storage import admin

_TTL = 300  # 5 min
_cache: dict = {"origins": set(), "at": 0.0}
_fallback = re.compile(CORS_ORIGIN_REGEX)


def _origins_from_host(host: str) -> set[str]:
    """De un host (con o sin esquema) deriva la familia de orígenes https del tenant: el host tal cual,
    su dominio base y los subdominios típicos del panel (app./staging./www.)."""
    h = re.sub(r"^https?://", "", host.strip().rstrip("/")).split("/")[0].lower()
    if not h or h == "localhost":
        return set()
    labels = h.split(".")
    base = ".".join(labels[-2:]) if len(labels) > 2 else h
    return {f"https://{x}" for x in (h, base, f"app.{base}", f"staging.{base}", f"www.{base}")}


def load_tenant_origins() -> set[str]:
    rows = admin().table("tenants").select("primary_domain,allowed_origins").execute().data or []
    out: set[str] = set()
    for r in rows:
        for host in [r.get("primary_domain") or "", *(r.get("allowed_origins") or [])]:
            if host:
                out |= _origins_from_host(str(host))
    return out


def _tenant_set() -> set[str]:
    now = time.time()
    if now - _cache["at"] > _TTL or not _cache["origins"]:
        try:
            _cache["origins"] = load_tenant_origins()
            _cache["at"] = now
        except Exception:
            pass  # Supabase caído → conservamos el último set; el fallback regex cubre al proveedor
    return _cache["origins"]


def is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    if _fallback.match(origin):      # raisen.agency + previews Vercel + localhost (safety net)
        return True
    if origin in EXTRA_ORIGINS:      # override de emergencia (env)
        return True
    return origin in _tenant_set()   # dinámico desde Supabase (tenants)
