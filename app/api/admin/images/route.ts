import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { SITE_IMAGES, SiteImageKey } from "@/lib/site-images";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob não está configurado (falta BLOB_READ_WRITE_TOKEN). Crie um Blob Store no dashboard da Vercel e conecte ao projeto.",
      },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
  }

  const key = formData.get("key");
  const file = formData.get("file");

  if (typeof key !== "string" || !(key in SITE_IMAGES)) {
    return NextResponse.json({ error: "Imagem não reconhecida." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máximo 8MB)." },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "O arquivo precisa ser uma imagem." },
      { status: 400 }
    );
  }

  const config = SITE_IMAGES[key as SiteImageKey];

  try {
    const blob = await put(config.pathname, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: file.type,
      cacheControlMaxAge: 60,
    });
    return NextResponse.json({ ok: true, key, url: blob.url });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem. " + (err as Error).message },
      { status: 500 }
    );
  }
}
