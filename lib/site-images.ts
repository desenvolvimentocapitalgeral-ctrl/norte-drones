import "server-only";
import { head } from "@vercel/blob";
import { SITE_IMAGE_FIELDS, SiteImageKey } from "@/lib/site-image-fields";

export type { SiteImageKey };

// Caminho fixo no Vercel Blob para cada imagem editável pelo /admin.
// Upload sempre sobrescreve o mesmo pathname (addRandomSuffix: false), então
// não precisamos guardar a URL atual em nenhum lugar — o próprio Blob é a
// fonte da verdade. Sem Blob configurado (ou antes do primeiro upload),
// cai no arquivo estático original em /public.
export const SITE_IMAGES: Record<
  SiteImageKey,
  { pathname: string; fallback: string }
> = {
  hero: { pathname: "site/hero.jpg", fallback: "/images/hero-drone-v2.jpg" },
  about: { pathname: "site/about.jpg", fallback: "/images/drone-action-v2.jpg" },
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) return SITE_IMAGES[key].fallback;
  try {
    const blob = await head(SITE_IMAGES[key].pathname);
    return blob.url;
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
