import { NextResponse } from "next/server";
import { getSiteStore } from "@/lib/blob-store";
import { SITE_IMAGES, SiteImageKey } from "@/lib/site-images";

export const dynamic = "force-dynamic";

// Serve as imagens do site enviadas pelo /admin (guardadas no Netlify Blobs).
// Pública de propósito: são as mesmas imagens exibidas no site.
export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  const key = params.key;
  if (!(key in SITE_IMAGES)) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }
  const config = SITE_IMAGES[key as SiteImageKey];
  const store = getSiteStore();
  const entry = store
    ? await store.getWithMetadata(config.pathname, { type: "arrayBuffer" }).catch(() => null)
    : null;
  if (!entry) {
    return NextResponse.redirect(new URL(config.fallback, _request.url));
  }
  return new NextResponse(entry.data, {
    headers: {
      "Content-Type": String(entry.metadata?.contentType ?? "application/octet-stream"),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
