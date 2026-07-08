"""Flujo común de recibos: fetch fila (tenant explícito) + labels + render + upload."""
from fastapi import HTTPException

from gotenberg import render_pdf
from storage import admin, fetch_branding, fetch_row, upload_pdf


def cat_label(cat_id: str | None) -> str:
    if not cat_id:
        return ""
    d = admin().table("categories").select("label").eq("id", cat_id).limit(1).execute().data
    return d[0]["label"] if d else ""


def user_name(user_id: str | None) -> str:
    if not user_id:
        return ""
    d = admin().table("profiles").select("*").eq("id", user_id).limit(1).execute().data
    if not d:
        return ""
    for key in ("full_name", "display_name", "name", "email"):
        if d[0].get(key):
            return str(d[0][key])
    return ""


async def receipt_pdf(table: str, row_id: str, tenant_id: str, template: str, doc_type: str, extra: dict | None = None) -> dict:
    row = fetch_row(table, row_id, tenant_id)
    if not row:
        raise HTTPException(status_code=404, detail="No encontrado")
    ctx = {
        "r": row,
        "category": cat_label(row.get("category_id")),
        "method": cat_label(row.get("payment_method_id")),
        **(extra or {}),
    }
    brand = fetch_branding(tenant_id)
    pdf = await render_pdf(template, {**ctx, "brand": brand})
    _, url = upload_pdf(tenant_id, doc_type, row_id, str(row.get("updated_at") or row.get("created_at")), pdf)
    return {"url": url, "cached": False}
