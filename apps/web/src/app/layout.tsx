import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { HeaderNav } from "@/components/HeaderNav";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-black focus:px-3 focus:py-2 focus:text-white dark:focus:bg-white dark:focus:text-black"
        >
          Saltar al contenido
        </a>
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">Cartazo</Link>
            <HeaderNav />
          </div>
        </header>
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
