import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Donut reusable (gastos por categoría, valor por almacén, leads por temperatura). Colores CSS con nombre.
const COLORS = ["royalblue", "seagreen", "orange", "crimson", "mediumpurple", "teal", "goldenrod", "gray"];

export function DashPie({ title, data }: { title: string; data: readonly { name: string; value: number }[] }) {
  const rows = data.filter((d) => d.value > 0);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={rows.slice()} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
