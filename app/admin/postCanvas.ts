export const W = 1080;

export type TemplateKey =
  | "servico"
  | "frase"
  | "promocao"
  | "diferencial"
  | "contato";
export type FormatKey = "quadrado" | "story";

export const FORMATS: { key: FormatKey; label: string; height: number }[] = [
  { key: "quadrado", label: "Quadrado (1080×1080)", height: 1080 },
  { key: "story", label: "Story (1080×1920)", height: 1920 },
];

export const TEMPLATES: {
  key: TemplateKey;
  label: string;
  needsPhoto: boolean;
}[] = [
  { key: "servico", label: "Post de serviço", needsPhoto: true },
  { key: "frase", label: "Frase", needsPhoto: false },
  { key: "promocao", label: "Promoção", needsPhoto: true },
  { key: "diferencial", label: "Diferencial", needsPhoto: false },
  { key: "contato", label: "Contato", needsPhoto: false },
];

export const COLORS = {
  greenDark: "#0B3D2E",
  green: "#2E7D32",
  lime: "#A8D83B",
  amber: "#F39A22",
  graphite: "#253339",
};

export function loadImage(src: string): Promise<HTMLImageElement> {
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
  h: number,
  zoom = 1
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
  if (zoom > 1) {
    const zw = sw / zoom;
    const zh = sh / zoom;
    sx += (sw - zw) / 2;
    sy += (sh - zh) / 2;
    sw = zw;
    sh = zh;
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

export type DrawOpts = {
  template: TemplateKey;
  h: number;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  title: string;
  subtitle: string;
  price: string;
  /** 1 = photo at rest (no zoom). >1 slowly "zooms in" — used for video. */
  zoom?: number;
  /** 0..1, how revealed the foreground (text/logo/badges) is. 1 = fully shown. */
  reveal?: number;
};

export function draw(ctx: CanvasRenderingContext2D, opts: DrawOpts) {
  const {
    template,
    h: H,
    photo,
    logo,
    title,
    subtitle,
    price,
    zoom = 1,
    reveal = 1,
  } = opts;
  ctx.clearRect(0, 0, W, H);

  if (
    template === "frase" ||
    template === "diferencial" ||
    template === "contato"
  ) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, COLORS.green);
    grad.addColorStop(1, COLORS.greenDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.translate(0, (1 - reveal) * 26);

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
    ctx.restore();
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
    ctx.restore();
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
    ctx.restore();
    return;
  }

  ctx.restore();

  // servico / promocao: photo (or solid) background + bottom gradient + text
  if (photo) {
    drawCover(ctx, photo, 0, 0, W, H, zoom);
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

  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.translate(0, (1 - reveal) * 26);

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
    (subtitleLines.length
      ? subtitleLines.length * subtitleLineHeight + 20
      : 0);
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
  ctx.restore();
}

export async function loadFonts() {
  await document.fonts.load("800 66px Montserrat");
  await document.fonts.load("500 36px Montserrat");
  await document.fonts.ready;
}
