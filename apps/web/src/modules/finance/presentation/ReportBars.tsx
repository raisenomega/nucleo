import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = Record<string, string | number>;

// BarChart genérico (vertical u horizontal). Colores en HSL (no hex).
export function ReportBars({ data, xKey, bars, horizontal }: {
  data: Row[]; xKey: string; bars: { key: string; name: string; color: string }[]; horizontal?: boolean;
}) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"}>
        <CartesianGrid strokeDasharray="3 3" />
        {horizontal
          ? <><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey={xKey} width={90} tick={{ fontSize: 11 }} /></>
          : <><XAxis dataKey={xKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /></>}
        <Tooltip />
        {bars.length > 1 && <Legend />}
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[3, 3, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
