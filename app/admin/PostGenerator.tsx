"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteImageKey } from "@/lib/site-image-fields";

const W = 1080;

type TemplateKey = "servico" | "frase" | "promocao" | "diferencial" | "contato";
type FormatKey = "quadrado" | "story";

const FORMATS: { key: FormatKey; label: string; height: number }[] = [
  { key: "quadrado", label: "Quadrado (1080×1080)", height: 1080 },
  { key: "story", label: "Story (1080×1920)", height: 1920 },
];

const TEMPLATES: { key: TemplateKey; label: string; needsPhoto: boolean }[] = [
  { key: "servico", label: "Post de serviço", needsPhoto: true },
  { key: "frase", label: "Frase", needsPhoto: false },
  { key: "promocao", label: "Promoção", needsPhoto: true },
  { key: "diferencial", label: "Diferencial", needsPhoto: false },
  { key: "contato", label: "Contato", needsPhoto: false },
];

const COLORS = {
  greenDark: "#0B3D2E",
  green: "#2E7D32",
  lime: "#A8D83B",
  amber: "#F39A22",
  graphite: "#253339",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLogoTopLeft(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  margin: number
) {
  if (!logo) return;
  const w = 340;
  const h = (logo.height / logo.width) * w;
  ctx.drawImage(logo, margin, margin, w, h);
}

async function draw(
  ctx: CanvasRenderingContext2D,
  opts: {
    template: TemplateKey;
    h: number;
    photo: HTMLImageElement | null;
    logo: HTMLImageElement | null;
    title: string;
    subtitle: string;
    price: string;
  }
) {
  const { template, h: H, photo, logo, title, subtitle, price } = opts;
  ctx.clearRect(0, 0, W, H);

  if (template === "frase" || template === "diferencial" || template === "contato") {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, COLORS.green);
    grad.addColorStop(1, COLORS.greenDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (template === "frase") {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "700 260px Montserrat, sans-serif";
    ctx.fillText("“", W / 2, H * 0.32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 64px Montserrat, sans-serif";
    const lines = wrapText(ctx, title || "Sua frase aqui", W - 200);
    const lineHeight = 78;
    const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, startY + i * lineHeight);
    });

    if (subtitle) {
      ctx.fillStyle = COLORS.lime;
      ctx.font = "700 34px Montserrat, sans-serif";
      ctx.fillText(subtitle, W / 2, startY + lines.length * lineHeight + 50);
    }

    if (logo) {
      const w = 320;
      const h = (logo.height / logo.width) * w;
      ctx.drawImage(logo, (W - w) / 2, H - h - 80, w, h);
    }
    return;
  }

  if (template === "diferencial") {
    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 70);

    ctx.fillStyle = COLORS.lime;
    ctx.font = "800 34px Montserrat, sans-serif";
    ctx.fillText("DIFERENCIAL", 70, H * 0.46);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 72px Montserrat, sans-serif";
    const maxW = W - 70 * 2;
    const titleLines = wrapText(ctx, title || "Diferencial", maxW);
    let cursorY = H * 0.46 + 72;
    titleLines.forEach((line) => {
      ctx.fillText(line, 70, cursorY);
      cursorY += 84;
    });

    if (subtitle) {
      cursorY += 16;
      ctx.font = "500 38px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      wrapText(ctx, subtitle, maxW).forEach((line) => {
        ctx.fillText(line, 70, cursorY);
        cursorY += 52;
      });
    }
    return;
  }

  if (template === "contato") {
    ctx.textAlign = "center";

    if (logo) {
      const w = 360;
      const h = (logo.height / logo.width) * w;
      ctx.drawImage(logo, (W - w) / 2, H * 0.22, w, h);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 68px Montserrat, sans-serif";
    const lines = wrapText(ctx, title || "Fale com a gente", W - 160);
    let cursorY = H * 0.56;
    lines.forEach((line) => {
      ctx.fillText(line, W / 2, cursorY);
      cursorY += 80;
    });

    if (subtitle) {
      ctx.font = "500 40px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      cursorY += 16;
      wrapText(ctx, subtitle, W - 200).forEach((line) => {
        ctx.fillText(line, W / 2, cursorY);
        cursorY += 52;
      });
    }

    const label = price || "Chame no WhatsApp";
    ctx.font = "800 44px Montserrat, sans-serif";
    const padX = 44;
    const textW = ctx.measureText(label).width;
    const boxW = textW + padX * 2;
    const boxH = 100;
    const boxX = (W - boxW) / 2;
    const boxY = H - boxH - 110;
    ctx.fillStyle = COLORS.amber;
    roundRect(ctx, boxX, boxY, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.fillStyle = COLORS.greenDark;
    ctx.textBaseline = "middle";
    ctx.fillText(label, W / 2, boxY + boxH / 2 + 2);
    ctx.textBaseline = "alphabetic";
    return;
  }

  // servico / promocao: photo (or solid) background + bottom gradient + text
  if (photo) {
    drawCover(ctx, photo, 0, 0, W, H);
  } else {
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillRect(0, 0, W, H);
  }

  const overlay = ctx.createLinearGradient(0, H * 0.35, 0, H);
  overlay.addColorStop(0, "rgba(11,61,46,0)");
  overlay.addColorStop(1, "rgba(11,61,46,0.95)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const topWash = ctx.createLinearGradient(0, 0, 0, 300);
  topWash.addColorStop(0, "rgba(0,0,0,0.4)");
  topWash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topWash;
  ctx.fillRect(0, 0, W, 300);

  ctx.textAlign = "left";
  drawLogoTopLeft(ctx, logo, 70);

  if (template === "promocao" && price) {
    ctx.font = "800 46px Montserrat, sans-serif";
    const padX = 36;
    const textW = ctx.measureText(price).width;
    const boxW = textW + padX * 2;
    const boxH = 96;
    const boxX = W - boxW - 70;
    const boxY = 70;
    ctx.fillStyle = COLORS.amber;
    roundRect(ctx, boxX, boxY, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.fillStyle = COLORS.greenDark;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(price, boxX + boxW / 2, boxY + boxH / 2 + 2);
    ctx.textBaseline = "alphabetic";
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 66px Montserrat, sans-serif";
  const maxTextWidth = W - 70 * 2;
  const titleLines = wrapText(ctx, title || "Título do post", maxTextWidth);
  const titleLineHeight = 76;

  ctx.font = "500 36px Montserrat, sans-serif";
  const subtitleLines = subtitle ? wrapText(ctx, subtitle, maxTextWidth) : [];
  const subtitleLineHeight = 48;

  const blockHeight =
    titleLines.length * titleLineHeight +
    (subtitleLines.length ? subtitleLines.length * subtitleLineHeight + 20 : 0);
  let cursorY = H - 80 - blockHeight + titleLineHeight - 20;

  ctx.font = "800 66px Montserrat, sans-serif";
  ctx.fillStyle = "#ffffff";
  titleLines.forEach((line) => {
    ctx.fillText(line, 70, cursorY);
    cursorY += titleLineHeight;
  });

  if (subtitleLines.length) {
    cursorY += 12;
    ctx.font = "500 36px Montserrat, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    subtitleLines.forEach((line) => {
      ctx.fillText(line, 70, cursorY);
      cursorY += subtitleLineHeight;
    });
  }
}

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
        await document.fonts.load("800 66px Montserrat");
        await document.fonts.load("500 36px Montserrat");
        await document.fonts.ready;

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
        await draw(ctx, {
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
