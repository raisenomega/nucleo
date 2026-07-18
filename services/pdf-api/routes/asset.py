"""PDF de activos: ficha completa (/pdf/asset/{id}) y recibo de custodia (/pdf/asset_custody/{log_id})."""
from fastapi import APIRouter, Depends, HTTPException

from asset_pdf_helpers import custody_rows, gps_metrics
from auth import Actor, current_actor
from gotenberg import render_pdf
from receipts import user_name
from storage import admin, fetch_branding, fetch_row, upload_pdf

router = APIRouter()


@router.post("/pdf/asset/{asset_id}")
async def asset_pdf(asset_id: str, actor: Actor = Depends(current_actor)) -> dict:
    asset = fetch_row("tenant_assets", asset_id, actor.tenant_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    custody = custody_rows(asset_id, actor.tenant_id)
    maint = admin().table("asset_maintenance_log").select("*").eq("asset_id", asset_id).eq("tenant_id", actor.tenant_id).order("performed_at", desc=True).execute().data or []
    routes = admin().table("service_routes").select("route_date, status, assigned_to, route_stops(count)").eq("asset_id", asset_id).eq("tenant_id", actor.tenant_id).is_("deleted_at", "null").order("route_date", desc=True).execute().data or []
    for r in routes:
        r["emp"] = user_name(r.get("assigned_to"))
        r["stops"] = (r.get("route_stops") or [{}])[0].get("count", 0)
    ctx = {
        "asset": asset, "custody": list(reversed(custody)), "maint": maint, "routes": routes,
        "assignee": user_name(asset.get("assigned_to")),
        "total_miles": sum(l.get("miles", 0) or 0 for l in custody),
        "uses": sum(1 for l in custody if l["custody_type"] == "checkout"),
    }
    pdf = await render_pdf("asset_detail.html", {**ctx, "brand": fetch_branding(actor.tenant_id)})
    _, url = upload_pdf(actor.tenant_id, "asset", asset_id, str(asset.get("updated_at")), pdf)
    return {"url": url, "cached": False}


@router.post("/pdf/asset_custody/{log_id}")
async def custody_receipt_pdf(log_id: str, actor: Actor = Depends(current_actor)) -> dict:
    log = fetch_row("asset_custody_log", log_id, actor.tenant_id)
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    asset = fetch_row("tenant_assets", log["asset_id"], actor.tenant_id)
    rows = custody_rows(log["asset_id"], actor.tenant_id)
    if log["custody_type"] == "checkout":
        checkout = next((l for l in rows if l["id"] == log_id), log)
        checkin = next((l for l in rows if l["custody_type"] == "checkin" and l["custody_at"] > log["custody_at"]), None)
    else:
        checkin = next((l for l in rows if l["id"] == log_id), log)
        checkout = next((l for l in reversed(rows) if l["custody_type"] == "checkout" and l["custody_at"] < log["custody_at"]), None)
    miles = checkin.get("miles") if checkin else None
    gps = gps_metrics((checkout or {}).get("id"), actor.tenant_id)
    ctx = {"asset": asset, "checkout": checkout, "checkin": checkin, "miles": miles, "gps": gps, "employee": user_name((checkout or checkin or {}).get("employee_id"))}
    pdf = await render_pdf("asset_custody_receipt.html", {**ctx, "brand": fetch_branding(actor.tenant_id)})
    _, url = upload_pdf(actor.tenant_id, "asset_custody", log_id, str(log.get("created_at")), pdf)
    return {"url": url, "cached": False}
