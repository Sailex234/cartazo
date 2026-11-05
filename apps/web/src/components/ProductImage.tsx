import Image from "next/image";

export function ProductImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Sin imagen</div>
      )}
    </div>
  );
}
