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
import { PhotoPicker, resolvePhotoSrc, type PhotoSource } from "./PhotoPicker";

export function PostGenerator({
  siteImages,
}: {
  siteImages: Record<SiteImageKey, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<TemplateKey>("servico");
  const [format, setFormat] = useState<FormatKey>("quadrado");
  const [photoChoice, setPhotoChoice] = useState<PhotoSource>("about");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [aiPhoto, setAiPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("Aplicação agrícola de precisão");
  const [subtitle, setSubtitle] = useState("Fale com a Norte Drones");
  const [price, setPrice] = useState("Peça seu orçamento");
  const [kicker, setKicker] = useState("Tecnologia que impulsiona");
  const [highlight, setHighlight] = useState("O seu campo");
  const [body, setBody] = useState(
    "Com planejamento e tecnologia, a Norte Drones leva precisão à sua lavoura."
  );
  const [badge1, setBadge1] = useState("Aplicação com precisão");
  const [badge2, setBadge2] = useState("Mais produtividade");
  const [badge3, setBadge3] = useState("Segurança em todas as etapas");
  const [location, setLocation] = useState("Porto Nacional, Palmas/TO e Região");
  const [signature, setSignature] = useState("Juntos por mais resultado!");
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
          const src = resolvePhotoSrc(photoChoice, siteImages, uploadedPhoto, aiPhoto);
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
          kicker,
          highlight,
          body,
          badges: [badge1, badge2, badge3],
          location,
          signature,
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
    aiPhoto,
    title,
    subtitle,
    price,
    kicker,
    highlight,
    body,
    badge1,
    badge2,
    badge3,
    location,
    signature,
    siteImages,
    activeTemplate.needsPhoto,
  ]);

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
          <PhotoPicker
            source={photoChoice}
            setSource={setPhotoChoice}
            uploadedPhoto={uploadedPhoto}
            setUploadedPhoto={setUploadedPhoto}
            aiPhoto={aiPhoto}
            setAiPhoto={setAiPhoto}
            canvasHeight={activeFormat.height}
          />
        )}

        {template === "campanha" ||
        template === "campanha-direita" ||
        template === "moderno" ||
        template === "neblina" ? (
          <>
            <Field label="Linha pequena (acima do título)" value={kicker} onChange={setKicker} />
            <Field label="Título" value={title} onChange={setTitle} />
            <Field label="Destaque (linha em verde-limão)" value={highlight} onChange={setHighlight} />
            <Field label="Texto de apoio" value={body} onChange={setBody} textarea />
            <Field label="Selo 1" value={badge1} onChange={setBadge1} />
            <Field label="Selo 2" value={badge2} onChange={setBadge2} />
            <Field label="Selo 3" value={badge3} onChange={setBadge3} />
            <Field label="Localização" value={location} onChange={setLocation} />
            <Field label="Assinatura (estilo manuscrito)" value={signature} onChange={setSignature} />
          </>
        ) : (
          <>
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
          </>
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
