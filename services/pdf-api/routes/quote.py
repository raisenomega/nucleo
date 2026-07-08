"""POST /pdf/quote/{id} — cotización → PDF (con caché por updated_at)."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import cached_url, fetch_branding, fetch_row, save_cache, upload_pdf

router = APIRouter()


@router.post("/pdf/quote/{quote_id}")
async def quote_pdf(quote_id: str, actor: Actor = Depends(current_actor)) -> dict:
    q = fetch_row("quotes", quote_id, actor.tenant_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if (url := cached_url(q)) is not None:
        return {"url": url, "cached": True}

    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("quote.html", {"q": q, "brand": brand})
    path, url = upload_pdf(actor.tenant_id, "quote", quote_id, str(q.get("updated_at")), pdf)
    save_cache("quotes", quote_id, actor.tenant_id, path)
    return {"url": url, "cached": False}
