"""POST /pdf/income/{id} — recibo de ingreso."""
from fastapi import APIRouter, Depends

from auth import Actor, current_actor
from receipts import receipt_pdf

router = APIRouter()


@router.post("/pdf/income/{income_id}")
async def income_pdf(income_id: str, actor: Actor = Depends(current_actor)) -> dict:
    return await receipt_pdf("income", income_id, actor.tenant_id, "income_receipt.html", "income")
