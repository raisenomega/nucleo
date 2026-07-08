"""POST /pdf/lead/{id} — ficha del lead con items y total."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import admin, fetch_branding, fetch_row, upload_pdf

router = APIRouter()


@router.post("/pdf/lead/{lead_id}")
async def lead_pdf(lead_id: str, actor: Actor = Depends(current_actor)) -> dict:
    lead = fetch_row("leads", lead_id, actor.tenant_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    items = (
        admin().table("lead_items").select("description,quantity,unit_price,tax_pct,discount_pct,line_total,sort")
        .eq("lead_id", lead_id).eq("tenant_id", actor.tenant_id).order("sort").execute().data or []
    )
    total = sum(float(i.get("line_total") or 0) for i in items) or float(lead.get("quoted_price") or 0)
    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("lead.html", {"lead": lead, "items": items, "total": total, "brand": brand})
    _, url = upload_pdf(actor.tenant_id, "lead", lead_id, str(lead.get("updated_at")), pdf)
    return {"url": url, "cached": False}
