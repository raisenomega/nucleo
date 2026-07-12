import { useEffect, useState } from "react";
import type { IOrdersRepository, PaymentMethod } from "@orders/domain/order.types";

// Métodos de pago del tenant (categorías kind=payment_method) para el modal de cobro.
export function usePaymentMethods(repo: IOrdersRepository) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  useEffect(() => { void repo.listPaymentMethods().then(setMethods); }, [repo]);
  return methods;
}
