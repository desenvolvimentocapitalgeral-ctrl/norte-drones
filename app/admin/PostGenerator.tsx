"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteImageKey } from "@/lib/site-image-fields";
import {
  W,
  FORMATS,
  TEMPLATES,
  loadImage,
  loadFonts,
  draw,
  type TemplateKey,
  type FormatKey,
} from "./postCanvas";

export function PostGenerator({
  siteImages,
}: {
  siteImages: Record<SiteImageKey, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<TemplateKey>("servico");
  const [format, setFormat] = useState<FormatKey>("quadrado");
  const [photoChoice, setPhotoChoice] = useState<"hero" | "about" | "upload">(
    "about"
  );
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("Aplicação agrícola de precisão");
  const [subtitle, setSubtitle] = useState("Fale com a Norte Drones");
  const [price, setPrice] = useState("Peça seu orçamento");
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTemplate = TEMPLATES.find((t) => t.key === template)!;
  const activeFormat = FORMATS.find((f) => f.key === format)!;

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setRendering(true);
      setError(null);
      try {
        await loadFonts();

        const logo = await loadImage(siteImages.logoDark);

        let photo: HTMLImageElement | null = null;
        if (activeTemplate.needsPhoto) {
          const src =
            photoChoice === "upload"
              ? uploadedPhoto
              : photoChoice === "about"
              ? siteImages.about
              : siteImages.hero;
          if (src) photo = await loadImage(src);
        }

        if (cancelled) return;
        draw(ctx, {
          template,
          h: activeFormat.height,
          photo,
          logo,
          title,
          subtitle,
          price,
        });
      } catch {
        if (!cancelled) {
          setError(
            "Não foi possível carregar alguma imagem para o post. Tente enviar a foto pelo seu dispositivo."
          );
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [
    template,
    format,
    activeFormat.height,
    photoChoice,
    uploadedPhoto,
    title,
    subtitle,
    price,
    siteImages,
    activeTemplate.needsPhoto,
  ]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhoto(reader.result as string);
      setPhotoChoice("upload");
    };
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `norte-drones-${template}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
        <canvas
          ref={canvasRef}
          width={W}
          height={activeFormat.height}
          className={`h-auto rounded-xl ring-1 ring-black/10 ${
            format === "story" ? "w-full max-w-[260px]" : "w-full max-w-[420px]"
          }`}
        />
        {rendering && (
          <p className="mt-3 text-xs text-nd-graphite/50">Gerando prévia…</p>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}
        <button
          onClick={handleDownload}
          disabled={rendering}
          className="mt-6 rounded-full bg-nd-green-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nd-green disabled:opacity-60"
        >
          Baixar imagem ({W}×{activeFormat.height})
        </button>
      </div>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
        <div>
          <p className="mb-2 text-sm font-medium text-nd-graphite">Formato</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFormat(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  format === f.key
                    ? "bg-nd-green-dark text-white"
                    : "bg-black/5 text-nd-graphite hover:bg-black/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-nd-graphite">Modelo</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  template === t.key
                    ? "bg-nd-green-dark text-white"
                    : "bg-black/5 text-nd-graphite hover:bg-black/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTemplate.needsPhoto && (
          <div>
            <p className="mb-2 text-sm font-medium text-nd-graphite">Foto</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPhotoChoice("about")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  photoChoice === "about"
                    ? "bg-nd-green-dark text-white"
                    : "bg-black/5 text-nd-graphite hover:bg-black/10"
                }`}
              >
                Imagem da "Sobre"
              </button>
              <button
                type="button"
                onClick={() => setPhotoChoice("hero")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  photoChoice === "hero"
                    ? "bg-nd-green-dark text-white"
                    : "bg-black/5 text-nd-graphite hover:bg-black/10"
                }`}
              >
                Imagem do topo
              </button>
              <label
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                  photoChoice === "upload"
                    ? "bg-nd-green-dark text-white"
                    : "bg-black/5 text-nd-graphite hover:bg-black/10"
                }`}
              >
                Enviar do dispositivo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        <Field
          label={template === "frase" ? "Frase" : "Título"}
          value={title}
          onChange={setTitle}
          textarea={template === "frase"}
        />
        <Field
          label={template === "frase" ? "Assinatura (opcional)" : "Texto de apoio"}
          value={subtitle}
          onChange={setSubtitle}
        />
        {(template === "promocao" || template === "contato") && (
          <Field
            label={template === "contato" ? "Texto do botão" : "Selo de destaque"}
            value={price}
            onChange={setPrice}
          />
        )}

        <p className="text-xs leading-relaxed text-nd-graphite/50">
          A imagem é gerada no seu navegador — nada é enviado nem salvo. Baixe
          e poste onde quiser.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-nd-graphite">
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green"
        />
      )}
    </label>
  );
}
