import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Charts genéricos (dumb): reciben data ya calculada. Reutilizados por dashboard y detalle.
type Row = Record<string, number | string>;
const box = "rounded-lg border border-border bg-card p-3";
const G = "hsl(142 71% 45%)", R = "hsl(0 84% 60%)", B = "hsl(217 91% 60%)";
export const COLORS = { G, R, B };

export function ChartBars({ data, bars }: { data: Row[]; bars: { key: string; name: string; color: string }[] }) {
  return (<div className={box}><ResponsiveContainer width="100%" height={200}><BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
    {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} />)}
  </BarChart></ResponsiveContainer></div>);
}
export function ChartArea({ data, name }: { data: Row[]; name: string }) {
  return (<div className={box}><ResponsiveContainer width="100%" height={200}><AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
    <Area dataKey="value" name={name} stroke={B} fill={B} fillOpacity={0.2} />
  </AreaChart></ResponsiveContainer></div>);
}
export function ChartLine({ data, lines }: { data: Row[]; lines: { key: string; name: string; color: string }[] }) {
  return (<div className={box}><ResponsiveContainer width="100%" height={200}><LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
    {lines.map((l) => <Line key={l.key} dataKey={l.key} name={l.name} stroke={l.color} dot={false} />)}
  </LineChart></ResponsiveContainer></div>);
}
export function ChartHBars({ data, name }: { data: Row[]; name: string }) {
  return (<div className={box}><ResponsiveContainer width="100%" height={200}><BarChart data={data} layout="vertical">
    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} /><Tooltip />
    <Bar dataKey="qty" name={name} fill={B} />
  </BarChart></ResponsiveContainer></div>);
}
