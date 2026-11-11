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

// % de descuento entero; 0 si no hay oferta (sin precio anterior o no mayor al actual).
export function discountPercent(price: string, compareAtPrice: string | null): number {
  if (!compareAtPrice) return 0;
  const p = Number(price);
  const c = Number(compareAtPrice);
  return c > p ? Math.round((1 - p / c) * 100) : 0;
}

// Línea "$ 1.800 tachado + 17% OFF". Sin oferta reserva la altura (si `reserve`) para que
// los precios de una grilla queden alineados.
export function OldPrice({
  price,
  compareAtPrice,
  reserve = false,
  className = "",
}: {
  price: string;
  compareAtPrice: string | null;
  reserve?: boolean;
  className?: string;
}) {
  const percent = discountPercent(price, compareAtPrice);
  if (!percent) return reserve ? <p aria-hidden className={`h-5 ${className}`} /> : null;
  const old = formatPrice(compareAtPrice!);
  return (
    <p className={`flex items-center gap-2 text-sm ${className}`}>
      <s className="text-muted">
        <span className="sr-only">Precio anterior </span>
        {old.slice(0, old.lastIndexOf(","))}
      </s>
      <span className="font-bold text-ok">{percent}% OFF</span>
    </p>
  );
}
