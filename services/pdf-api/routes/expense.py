"""POST /pdf/expense/{id} — comprobante de gasto."""
from fastapi import APIRouter, Depends

from auth import Actor, current_actor
from receipts import receipt_pdf, user_name
from storage import fetch_row

router = APIRouter()


@router.post("/pdf/expense/{expense_id}")
async def expense_pdf(expense_id: str, actor: Actor = Depends(current_actor)) -> dict:
    row = fetch_row("expenses", expense_id, actor.tenant_id)
    paid_by = user_name(row.get("paid_by")) if row else ""
    return await receipt_pdf("expenses", expense_id, actor.tenant_id, "expense_receipt.html", "expense", {"paid_by": paid_by})
