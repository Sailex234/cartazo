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
