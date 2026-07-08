"""POST /pdf/route/{id} — resumen de ruta: paradas, estados y total cobrado."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from receipts import user_name
from storage import admin, fetch_branding, fetch_row, upload_pdf

router = APIRouter()


@router.post("/pdf/route/{route_id}")
async def route_pdf(route_id: str, actor: Actor = Depends(current_actor)) -> dict:
    route = fetch_row("service_routes", route_id, actor.tenant_id)
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    stops = (
        admin().table("route_stops").select("*")
        .eq("route_id", route_id).eq("tenant_id", actor.tenant_id).order("stop_order").execute().data or []
    )
    ctx = {
        "route": route,
        "employee": user_name(route.get("assigned_to")),
        "stops": stops,
        "completed": sum(1 for s in stops if s.get("status") == "Completada"),
        "not_attended": sum(1 for s in stops if s.get("status") == "No atendida"),
        "collected": sum(float(s.get("actual_amount") or 0) for s in stops),
    }
    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("route_summary.html", {**ctx, "brand": brand})
    _, url = upload_pdf(actor.tenant_id, "route", route_id, str(route.get("updated_at")), pdf)
    return {"url": url, "cached": False}
