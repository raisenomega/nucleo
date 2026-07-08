"""POST /pdf/payroll/{id} — recibo de pago → PDF.

F2: mapea la fila de payroll al context del template. payroll no tiene columnas
pdf_url (sin caché en v1) — se genera al vuelo en cada request.
"""
from fastapi import APIRouter, Depends, HTTPException

from auth import Actor, current_actor
from gotenberg import render_pdf
from storage import fetch_branding, fetch_row, upload_pdf

router = APIRouter()


@router.post("/pdf/payroll/{payroll_id}")
async def payroll_pdf(payroll_id: str, actor: Actor = Depends(current_actor)) -> dict:
    row = fetch_row("payroll", payroll_id, actor.tenant_id)
    if not row:
        raise HTTPException(status_code=404, detail="Nómina no encontrada")

    deductions = [
        {"label": lbl, "amount": float(row.get(col) or 0)}
        for col, lbl in (
            ("ss_employee", "Seguro Social"), ("medicare_employee", "Medicare"),
            ("sinot", "SINOT"), ("income_tax", "Retención contribución"),
        )
        if float(row.get(col) or 0) > 0
    ]
    gross = float(row.get("gross_salary") or 0)
    net = float(row.get("net_salary") or 0)
    ctx = {
        "employee_name": row.get("employee_name") or "Empleado",
        "position": row.get("position") or "",
        "employee_number": row.get("employee_number") or "",
        "period": row.get("period") or "",
        "created_at": str(row.get("created_at") or ""),
        "gross_salary": gross,
        "deductions": deductions,
        "total_deductions": max(gross - net, 0),
        "net_salary": net,
        "employer_contributions": [],
    }
    brand = fetch_branding(actor.tenant_id)
    pdf = await render_pdf("payslip.html", {"p": ctx, "brand": brand})
    _, url = upload_pdf(actor.tenant_id, "payslip", payroll_id, str(row.get("updated_at")), pdf)
    return {"url": url, "cached": False}
