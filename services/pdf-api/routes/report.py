"""POST /pdf/report — reporte → PDF.

F3: el frontend manda el context ya armado (KPIs + tablas + SVG charts pre-renderizados);
el servicio solo valida, renderiza y firma. Sin caché (los reportes son por rango).
"""
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import fetch_branding, upload_pdf

router = APIRouter()


class ReportBody(BaseModel):
    title: str = Field(max_length=120)
    date_from: str = ""
    date_to: str = ""
    kpis: list[dict] = []
    tables: list[dict] = []
    charts: list[dict] = []  # [{title, svg}] — SVG generado por el front (recharts → svg)


@router.post("/pdf/report")
async def report_pdf(body: ReportBody, actor: Actor = Depends(current_actor)) -> dict:
    brand = fetch_branding(actor.tenant_id)
    ctx = body.model_dump()
    pdf = await render_pdf("report.html", {"r": ctx, "brand": brand})
    key = f"{body.title}:{body.date_from}:{body.date_to}"
    _, url = upload_pdf(actor.tenant_id, "report", "adhoc", key, pdf)
    return {"url": url, "cached": False}
