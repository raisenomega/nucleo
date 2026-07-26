import { useEffect, useRef, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { getFleetPositions, type FleetPosition } from "@assets/infrastructure/fleet.repository";

// Realtime de flota (GPS-2): foto inicial + canal gps:{tenant} escuchando INSERTs de asset_gps_logs.
// El polling de 30s queda como fallback si Realtime no conecta. RLS ya filtra por tenant (+ filtro cliente).
export function useGpsRealtime(tenantId: string, enabled: boolean): { positions: FleetPosition[]; isConnected: boolean } {
  const [positions, setPositions] = useState<FleetPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const byId = useRef<Map<string, FleetPosition>>(new Map());
  useEffect(() => {
    if (!enabled || !tenantId) return;
    let alive = true;
    const flush = () => { if (alive) setPositions([...byId.current.values()]); };
    const load = () => void getFleetPositions().then((rows) => {
      if (!alive) return;
      byId.current = new Map(rows.map((r) => [r.assetId, r]));
      flush();
    });
    load();
    const poll = setInterval(load, 30000);
    const channel = supabase.channel(`gps:${tenantId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "asset_gps_logs", filter: `tenant_id=eq.${tenantId}` }, (payload) => {
        const n = payload.new as Record<string, unknown>;
        const id = n.asset_id as string; const prev = byId.current.get(id);
        byId.current.set(id, { assetId: id, assetName: prev?.assetName ?? "", assignedToName: prev?.assignedToName ?? null,
          lat: Number(n.latitude), lng: Number(n.longitude), speed: n.speed == null ? null : Number(n.speed),
          heading: n.heading == null ? null : Number(n.heading), accuracy: n.accuracy == null ? null : Number(n.accuracy),
          recordedAt: (n.recorded_at as string) ?? null, status: prev?.status ?? "in_use", hasActiveCustody: prev?.hasActiveCustody ?? true });
        flush();
      })
      .subscribe((status) => { if (alive) setIsConnected(status === "SUBSCRIBED"); });
    return () => { alive = false; clearInterval(poll); void supabase.removeChannel(channel); };
  }, [tenantId, enabled]);
  return { positions, isConnected };
}
