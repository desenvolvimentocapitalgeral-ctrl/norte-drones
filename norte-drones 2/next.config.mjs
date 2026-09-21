/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Evita que o Next tente baixar/otimizar o CSS do Google Fonts em tempo de
  // build (isso falha em ambientes de build com egress restrito). A fonte é
  // carregada normalmente pelo navegador via <link> no <head> em app/layout.tsx.
  optimizeFonts: false,
};

export default nextConfig;
