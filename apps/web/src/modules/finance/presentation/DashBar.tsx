import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Barra simple reusable (embudo, cotizaciones por estado…). data = [{name, v}].
export function DashBar({ title, data }: { title: string; data: readonly { name: string; v: number }[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.slice()}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} width={30} /><Tooltip />
          <Bar dataKey="v" fill="royalblue" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
