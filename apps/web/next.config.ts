import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @cartazo/shared se consume como fuente .ts (sin build): Next tiene que compilarlo.
  transpilePackages: ["@cartazo/shared"],
  // shared importa sus archivos como "./schemas/x.js" (requisito de NodeNext en apps/api)
  // pero en disco son .ts: Webpack necesita este alias para resolverlos. Turbopack aún no.
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
  // El navegador le habla a "/api/*" del mismo origen y Next reenvía a la API (Render en producción).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://localhost:4000"}/api/:path*` }];
  },
  images: {
    // next/image solo optimiza hosts declarados acá (evita que el optimizador
    // se use como proxy abierto). Sumar el host real cuando haya imágenes reales.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
