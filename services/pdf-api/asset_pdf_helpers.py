"""Helpers de PDF de activos: custodia (millas por checkin) y métricas GPS (Haversine)."""
import math
from datetime import datetime

from receipts import user_name
from storage import admin


def haversine(a, b):
    r, p = 6371000.0, math.pi / 180
    la1, la2 = a["latitude"] * p, b["latitude"] * p
    dla = (b["latitude"] - a["latitude"]) * p
    dlo = (b["longitude"] - a["longitude"]) * p
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(h)))


def gps_metrics(custody_log_id, tenant_id):
    if not custody_log_id:
        return None
    pts = admin().table("asset_gps_logs").select("latitude, longitude, recorded_at").eq("custody_log_id", custody_log_id).eq("tenant_id", tenant_id).order("recorded_at").execute().data or []
    if len(pts) < 2:
        return None
    meters = sum(haversine(a, b) for a, b in zip(pts, pts[1:]))
    t0 = datetime.fromisoformat(pts[0]["recorded_at"].replace("Z", "+00:00"))
    t1 = datetime.fromisoformat(pts[-1]["recorded_at"].replace("Z", "+00:00"))
    minutes = max(0.0, (t1 - t0).total_seconds() / 60)
    miles = meters / 1609.344
    return {"miles": miles, "minutes": minutes, "speed": (miles / (minutes / 60) if minutes else 0), "points": len(pts)}


def custody_rows(asset_id, tenant_id):
    rows = admin().table("asset_custody_log").select("*").eq("asset_id", asset_id).eq("tenant_id", tenant_id).order("custody_at").execute().data or []
    last_out = None
    for l in rows:
        if l["custody_type"] == "checkin" and l.get("odometer_reading") is not None and last_out is not None:
            l["miles"] = float(l["odometer_reading"]) - last_out
        if l["custody_type"] == "checkout":
            last_out = float(l["odometer_reading"] or 0)
        l["emp"] = user_name(l.get("employee_id"))
    return rows
