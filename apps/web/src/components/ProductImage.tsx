import Image from "next/image";

// Sin imagen: un degradé estable derivado del nombre (mismo producto = mismo color)
// con la inicial grande, en vez de un recuadro gris vacío.
function placeholderStyle(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return { background: `linear-gradient(135deg, hsl(${hue} 60% 78%), hsl(${(hue + 40) % 360} 55% 62%))` };
}

export function ProductImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (sin imagen)`}
          style={placeholderStyle(alt)}
          className="flex h-full items-center justify-center"
        >
          <span aria-hidden className="select-none text-6xl font-bold text-white/80 drop-shadow-sm">
            {alt.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
