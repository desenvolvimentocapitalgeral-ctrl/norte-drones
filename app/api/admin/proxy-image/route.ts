import { NextRequest, NextResponse } from "next/server";

/**
 * Repassa uma imagem hospedada no Vercel Blob pelo mesmo domínio do site.
 *
 * O gerador de posts/vídeo desenha as imagens num <canvas> e depois lê os
 * pixels de volta (toDataURL / toBlob / captureStream). Se a imagem vier de
 * outro domínio sem cabeçalhos CORS liberados, o navegador marca o canvas
 * como "tainted" e essas leituras falham silenciosamente com um erro de
 * segurança — quebrando tanto o "salvar imagem" quanto a gravação de vídeo,
 * em qualquer navegador. Buscando a imagem aqui no servidor e devolvendo
 * pelo nosso próprio domínio, ela deixa de ser "cross-origin" pro navegador.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Parâmetro 'src' ausente." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  if (!/(^|\.)vercel-storage\.com$/.test(url.hostname)) {
    return NextResponse.json({ error: "Domínio não permitido." }, { status: 400 });
  }

  const upstream = await fetch(url.toString(), { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Não foi possível buscar a imagem." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=60",
    },
  });
}
