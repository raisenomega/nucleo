"""POST /pdf/training/{enrollment_id} — certificado de curso completado."""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from receipts import user_name
from storage import admin, fetch_branding, fetch_row, upload_pdf

router = APIRouter()


@router.post("/pdf/training/{enrollment_id}")
async def training_pdf(enrollment_id: str, actor: Actor = Depends(current_actor)) -> dict:
    enr = fetch_row("training_enrollments", enrollment_id, actor.tenant_id)
    if not enr:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if enr.get("status") != "completed":
        raise HTTPException(status_code=400, detail="El curso no está completado")
    course = (
        admin().table("training_courses").select("title,hours,category")
        .eq("id", enr["course_id"]).limit(1).execute().data or [{}]
    )[0]
    ctx = {
        "employee": user_name(enr.get("employee_id")),
        "course": course.get("title") or "Curso",
        "hours": course.get("hours"),
        "score": enr.get("score"),
        "date": str(enr.get("completed_at") or "")[:10],
    }
    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("certificate.html", {**ctx, "brand": brand})
    _, url = upload_pdf(actor.tenant_id, "certificate", enrollment_id, str(enr.get("updated_at")), pdf)
    return {"url": url, "cached": False}
