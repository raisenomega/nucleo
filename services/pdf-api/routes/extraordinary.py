"""POST /pdf/extraordinary/{id} — comprobante de pago extraordinario."""
from fastapi import APIRouter, Depends

from auth import Actor, current_actor
from receipts import receipt_pdf

router = APIRouter()


@router.post("/pdf/extraordinary/{payment_id}")
async def extraordinary_pdf(payment_id: str, actor: Actor = Depends(current_actor)) -> dict:
    return await receipt_pdf("extraordinary_payments", payment_id, actor.tenant_id, "extraordinary_receipt.html", "extraordinary")
