import "server-only";
import { getSiteStore } from "@/lib/blob-store";
import { SITE_IMAGE_FIELDS, SiteImageKey } from "@/lib/site-image-fields";

export type { SiteImageKey };

// Chave fixa no Netlify Blobs para cada imagem editável pelo /admin.
// Upload sempre sobrescreve a mesma chave, então não precisamos guardar a
// URL atual em nenhum lugar — o próprio Blob é a fonte da verdade. Fora do
// Netlify (ou antes do primeiro upload), cai no arquivo estático em /public.
// As imagens enviadas são servidas por /api/site-image/[key].
export const SITE_IMAGES: Record<
  SiteImageKey,
  { pathname: string; fallback: string }
> = {
  hero: { pathname: "site/hero.jpg", fallback: "/images/hero-drone-v2.jpg" },
  about: { pathname: "site/about.jpg", fallback: "/images/about-operador.jpg" },
  logoLight: {
    pathname: "site/logo-light.png",
    fallback: "/brand/logo-horizontal-light.png",
  },
  logoDark: {
    pathname: "site/logo-dark.png",
    fallback: "/brand/logo-horizontal-dark.png",
  },
};

export async function getSiteImageUrl(key: SiteImageKey): Promise<string> {
  const store = getSiteStore();
  if (!store) return SITE_IMAGES[key].fallback;
  try {
    const meta = await store.getMetadata(SITE_IMAGES[key].pathname);
    if (!meta) return SITE_IMAGES[key].fallback;
    return `/api/site-image/${key}?v=${encodeURIComponent((meta.etag ?? "").replace(/\W/g, ""))}`;
  } catch {
    return SITE_IMAGES[key].fallback;
  }
}

export async function getSiteImages(): Promise<Record<SiteImageKey, string>> {
  const keys = SITE_IMAGE_FIELDS.map((f) => f.key);
  const urls = await Promise.all(keys.map(getSiteImageUrl));
  return Object.fromEntries(keys.map((key, i) => [key, urls[i]])) as Record<
    SiteImageKey,
    string
  >;
}
