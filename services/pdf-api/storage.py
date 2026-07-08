"""Supabase: fetch de datos (secret key + filtro tenant EXPLÍCITO), branding,
upload del PDF a tenant-pdfs y caché pdf_url/pdf_generated_at en la fila.

La secret key bypasea RLS → TODA query filtra por tenant_id del JWT verificado.
"""
import hashlib
from datetime import datetime, timezone
from functools import lru_cache

from supabase import Client, create_client

from config import BRAND_BUCKET, PDF_BUCKET, SIGNED_URL_TTL, SUPABASE_SECRET_KEY, SUPABASE_URL


@lru_cache(maxsize=1)
def admin() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def fetch_row(table: str, row_id: str, tenant_id: str) -> dict | None:
    res = admin().table(table).select("*").eq("id", row_id).eq("tenant_id", tenant_id).limit(1).execute()
    return res.data[0] if res.data else None


def fetch_branding(tenant_id: str) -> dict:
    """legal_name de tenants + colores de settings + logo (signed) del bucket brand."""
    sb = admin()
    tenant = sb.table("tenants").select("legal_name").eq("id", tenant_id).limit(1).execute()
    rows = sb.table("settings").select("key,value").eq("tenant_id", tenant_id).in_("key", ["primary_color", "accent_color"]).execute()
    settings = {r["key"]: r["value"] for r in (rows.data or [])}
    logo_url = ""
    try:
        signed = sb.storage.from_(BRAND_BUCKET).create_signed_url(f"{tenant_id}/logo.png", SIGNED_URL_TTL)
        logo_url = signed.get("signedURL") or signed.get("signedUrl") or ""
    except Exception:
        pass  # sin logo → el template muestra solo el nombre
    pick = lambda k, fb: settings[k] if isinstance(settings.get(k), str) and settings.get(k) else fb  # noqa: E731
    return {
        "legal_name": tenant.data[0]["legal_name"] if tenant.data else "NÚCLEO",
        "primary_color": pick("primary_color", "#1a1a2e"),
        "accent_color": pick("accent_color", "#4a4a6a"),
        "logo_url": logo_url,
    }


def upload_pdf(tenant_id: str, doc_type: str, row_id: str, updated_at: str, pdf: bytes) -> tuple[str, str]:
    """Sube el PDF (path con hash de updated_at para caché) y devuelve (path, signed_url)."""
    digest = hashlib.sha256(f"{row_id}:{updated_at}".encode()).hexdigest()[:16]
    path = f"{tenant_id}/{doc_type}/{row_id}/{digest}.pdf"
    sb = admin()
    sb.storage.from_(PDF_BUCKET).upload(path, pdf, {"content-type": "application/pdf", "upsert": "true"})
    signed = sb.storage.from_(PDF_BUCKET).create_signed_url(path, SIGNED_URL_TTL)
    return path, signed.get("signedURL") or signed.get("signedUrl") or ""


def cached_url(row: dict) -> str | None:
    """Si el PDF cacheado sigue vigente (fila no cambió desde que se generó), firma y devuelve."""
    pdf_url, generated = row.get("pdf_url"), row.get("pdf_generated_at")
    updated = row.get("updated_at") or row.get("created_at")
    if not pdf_url or not generated or not updated or str(updated) > str(generated):
        return None
    try:
        signed = admin().storage.from_(PDF_BUCKET).create_signed_url(pdf_url, SIGNED_URL_TTL)
        return signed.get("signedURL") or signed.get("signedUrl") or None
    except Exception:
        return None


def save_cache(table: str, row_id: str, tenant_id: str, path: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    admin().table(table).update({"pdf_url": path, "pdf_generated_at": now}).eq("id", row_id).eq("tenant_id", tenant_id).execute()
