"""POST /pdf/reconciliation — reporte fiscal mensual COMPLETO (template dedicado).

El frontend manda el snapshot entero (bank/tax/retention/summary en camelCase, tal como
lo devuelve el RPC): el RPC del snapshot resuelve current_tenant() desde los claims del
JWT del usuario, que la secret key no tiene — por eso no se puede re-fetchear aquí.
"""
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import fetch_branding, upload_pdf

router = APIRouter()


class ReconBody(BaseModel):
    month: str = Field(max_length=7)  # YYYY-MM
    bank: dict = {}
    tax: dict = {}
    retention: dict = {}
    summary: dict = {}


@router.post("/pdf/reconciliation")
async def reconciliation_pdf(body: ReconBody, actor: Actor = Depends(current_actor)) -> dict:
    brand = fetch_branding(actor.tenant_id)
    ctx = {"month": body.month, "bank": body.bank, "tax": body.tax, "retention": body.retention,
           "summary": body.summary, "health": (body.summary or {}).get("health") or {}, "brand": brand}
    pdf = await render_pdf("reconciliation.html", ctx)
    _, url = upload_pdf(actor.tenant_id, "reconciliation", body.month, body.month, pdf)
    return {"url": url, "cached": False}
