// Grid sutil de fondo: líneas violet 3% cada 80px.
export function GridBackground() {
  const grid =
    "linear-gradient(rgba(var(--rm-violet),0.03) 1px, transparent 1px)," +
    "linear-gradient(90deg, rgba(var(--rm-violet),0.03) 1px, transparent 1px)";
  return <div className="absolute inset-0" style={{ backgroundImage: grid, backgroundSize: "80px 80px" }} />;
}
