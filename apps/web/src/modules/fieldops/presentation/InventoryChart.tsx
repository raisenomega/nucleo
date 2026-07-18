import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@shared/i18n";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import type { InventoryMovement } from "@fieldops/domain/inventory.types";

// FIX4 sec3 — barras por mes (últimos 6): entradas/devoluciones (verde) vs salidas/venta/merma (rojo).
const IN = new Set(["entrada", "devolucion"]);
export function InventoryChart({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<InventoryMovement[]>([]);
  useEffect(() => { void supabaseInventoryRepository.listMovements(itemId).then(setRows); }, [itemId]);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, k) => new Date(now.getFullYear(), now.getMonth() - (5 - k), 1).toISOString().slice(0, 7));
  const data = months.map((m) => ({
    month: m.slice(5),
    ins: rows.filter((r) => r.date.slice(0, 7) === m && IN.has(r.type)).reduce((s, r) => s + r.quantity, 0),
    outs: rows.filter((r) => r.date.slice(0, 7) === m && !IN.has(r.type)).reduce((s, r) => s + r.quantity, 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
        <Tooltip /><Legend />
        <Bar dataKey="ins" name={t("movIns")} fill="hsl(142 71% 45%)" />
        <Bar dataKey="outs" name={t("movOuts")} fill="hsl(0 84% 60%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
