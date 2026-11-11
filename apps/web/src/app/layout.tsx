import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { HeaderNav } from "@/components/HeaderNav";
import { getCategories } from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cartazo",
  description: "Tienda online — catálogo, carrito y checkout.",
  // Es una demo con datos de prueba: que los buscadores no la indexen.
  robots: { index: false, follow: false },
};

const isDemo = process.env.NEXT_PUBLIC_DEMO === "true";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La barra de categorías no debe tumbar el sitio si la API no responde.
  const categories = await getCategories().catch(() => []);
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-fg"
        >
          Saltar al contenido
        </a>
        {isDemo && (
          <p className="bg-accent px-4 py-1.5 text-center text-xs font-bold text-accent-fg">
            DEMO · datos de prueba · pagos en modo test de MercadoPago (no se cobra nada)
          </p>
        )}
        <header className="sticky top-0 z-20 bg-header text-header-fg shadow-sm">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
            <Link href="/" className="text-xl font-black italic tracking-tight">
              Cartazo
            </Link>
            <form action="/" method="get" role="search" className="order-last flex min-w-0 basis-full overflow-hidden rounded-full bg-white focus-within:ring-2 focus-within:ring-accent md:order-none md:basis-auto md:flex-1">
              <input
                name="q"
                aria-label="Buscar productos"
                placeholder="Buscá tu producto…"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[#1c1c1c] outline-none placeholder:text-[#5f5f5f]"
              />
              <button aria-label="Buscar" className="px-4 text-brand hover:bg-brand-soft">
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m20 20-4.2-4.2" />
                </svg>
              </button>
            </form>
            <div className="ml-auto md:ml-0">
              <HeaderNav />
            </div>
          </div>
          <nav aria-label="Categorías" className="bg-brand-hover text-header-fg">
            <div className="mx-auto flex w-full max-w-5xl overflow-x-auto px-4 text-xs sm:text-sm">
              <Link href="/" className="whitespace-nowrap bg-black/20 px-3 py-2 font-bold hover:bg-black/30">
                Todas
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}#catalogo`}
                  className="whitespace-nowrap px-3 py-2 font-semibold hover:bg-black/20"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="mt-6 bg-brand-hover text-white">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-xs text-white/85">
            <p>
              <b className="font-black italic text-white">Cartazo</b> · Tu mercado de barrio, ahora online
            </p>
            <p>{isDemo ? "Proyecto de portfolio · " : ""}Pagos con MercadoPago (modo prueba) · © {new Date().getFullYear()}</p>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
