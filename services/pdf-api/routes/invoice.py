"""POST /pdf/invoice/{id} — factura → PDF (con caché por updated_at)."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import cached_url, fetch_branding, fetch_row, save_cache, upload_pdf

router = APIRouter()


@router.post("/pdf/invoice/{invoice_id}")
async def invoice_pdf(invoice_id: str, actor: Actor = Depends(current_actor)) -> dict:
    inv = fetch_row("invoices", invoice_id, actor.tenant_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if (url := cached_url(inv)) is not None:
        return {"url": url, "cached": True}

    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("invoice.html", {"inv": inv, "brand": brand})
    path, url = upload_pdf(actor.tenant_id, "invoice", invoice_id, str(inv.get("updated_at")), pdf)
    save_cache("invoices", invoice_id, actor.tenant_id, path)
    return {"url": url, "cached": False}
