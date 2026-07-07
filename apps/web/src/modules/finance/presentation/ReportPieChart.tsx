import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = ["hsl(38 85% 55%)", "hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)", "hsl(30 90% 55%)"];
const color = (i: number) => PALETTE[i % PALETTE.length] ?? "hsl(38 85% 55%)";

type Row = { name: string; value: number };

// PieChart genérico. Colores en HSL (no hex).
export function ReportPieChart({ data }: { data: Row[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
          {data.map((_, i) => <Cell key={i} fill={color(i)} />)}
        </Pie>
        <Tooltip /><Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
