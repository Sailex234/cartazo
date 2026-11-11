import { formatPrice } from "@/lib/api";

// Precio al estilo supermercado: entero grande, centavos chicos y pegados arriba.
export function Price({ value, className = "" }: { value: string; className?: string }) {
  const text = formatPrice(value);
  const i = text.lastIndexOf(",");
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      {text.slice(0, i)}
      <span className="align-top text-[0.55em] font-bold">{text.slice(i)}</span>
    </span>
  );
}
