import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
