import type { OrderStatus } from "@orders/domain/order.types";

export interface OrderHistoryEvent {
  id: string; fromStatus: OrderStatus | null; toStatus: OrderStatus;
  note: string | null; changedByName: string | null; createdAt: string;
}

export interface IOrderHistoryRepository {
  list(orderId: string): Promise<OrderHistoryEvent[]>;
}
