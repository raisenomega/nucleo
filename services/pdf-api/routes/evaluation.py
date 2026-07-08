"""POST /pdf/evaluation/{id} — evaluación de desempeño → PDF (sin caché: siempre al vuelo)."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import admin, fetch_branding, fetch_row, upload_pdf

router = APIRouter()


def _employee_name(profile: dict | None) -> str:
    if not profile:
        return "Empleado"
    for key in ("full_name", "display_name", "name", "email"):
        if profile.get(key):
            return str(profile[key])
    return "Empleado"


@router.post("/pdf/evaluation/{evaluation_id}")
async def evaluation_pdf(evaluation_id: str, actor: Actor = Depends(current_actor)) -> dict:
    ev = fetch_row("evaluations", evaluation_id, actor.tenant_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    sb = admin()
    scores = sb.table("evaluation_scores").select("score,criterion_id").eq("evaluation_id", evaluation_id).eq("tenant_id", actor.tenant_id).execute().data or []
    criteria = sb.table("evaluation_criteria").select("id,label,weight").eq("tenant_id", actor.tenant_id).execute().data or []
    labels = {c["id"]: c for c in criteria}
    rows = [
        {"label": labels.get(s["criterion_id"], {}).get("label", "—"),
         "weight": float(labels.get(s["criterion_id"], {}).get("weight") or 0),
         "score": float(s["score"])}
        for s in scores
    ]
    profile = sb.table("profiles").select("*").eq("id", ev["employee_id"]).limit(1).execute().data
    ctx = {
        "employee_name": _employee_name(profile[0] if profile else None),
        "period": ev.get("period") or "",
        "composite": float(ev.get("composite_score") or 0),
        "classification": ev.get("classification") or "",
        "requires_legal": bool(ev.get("requires_legal_validation")),
        "in_probation": bool(ev.get("in_probation")),
        "notes": ev.get("notes") or "",
        "created_at": str(ev.get("created_at") or ""),
        "scores": rows,
    }
    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("evaluation.html", {"e": ctx, "brand": brand})
    _, url = upload_pdf(actor.tenant_id, "evaluation", evaluation_id, str(ev.get("updated_at")), pdf)
    return {"url": url, "cached": False}
