export const W = 1080;

export type TemplateKey =
  | "servico"
  | "frase"
  | "promocao"
  | "diferencial"
  | "contato"
  | "campanha"
  | "campanha-direita"
  | "moderno"
  | "neblina"
  | "circulo"
  | "diagonal"
  | "moldura"
  | "cartao"
  | "ondas"
  | "etiqueta"
  | "hexagonos"
  | "numerado"
  | "estatistica"
  | "citacao"
  | "linhas"
  | "impacto";
export type FormatKey = "quadrado" | "story";

export const FORMATS: { key: FormatKey; label: string; height: number }[] = [
  { key: "quadrado", label: "Quadrado (1080×1080)", height: 1080 },
  { key: "story", label: "Story / Reels (1080×1920)", height: 1920 },
];

export const TEMPLATES: {
  key: TemplateKey;
  label: string;
  needsPhoto: boolean;
}[] = [
  { key: "campanha", label: "Campanha", needsPhoto: true },
  { key: "campanha-direita", label: "Campanha (painel à direita)", needsPhoto: true },
  { key: "moderno", label: "Moderno (com rodapé)", needsPhoto: true },
  { key: "neblina", label: "Névoa (foto bem visível)", needsPhoto: true },
  { key: "circulo", label: "Círculo", needsPhoto: true },
  { key: "diagonal", label: "Diagonal", needsPhoto: true },
  { key: "moldura", label: "Moldura", needsPhoto: true },
  { key: "cartao", label: "Cartão", needsPhoto: true },
  { key: "ondas", label: "Ondas", needsPhoto: true },
  { key: "etiqueta", label: "Etiqueta", needsPhoto: true },
  { key: "hexagonos", label: "Hexágonos", needsPhoto: true },
  { key: "numerado", label: "Numerado (etapas)", needsPhoto: false },
  { key: "estatistica", label: "Estatística", needsPhoto: false },
  { key: "citacao", label: "Citação", needsPhoto: false },
  { key: "linhas", label: "Linhas (claro)", needsPhoto: false },
  { key: "impacto", label: "Impacto", needsPhoto: false },
  { key: "servico", label: "Post de serviço", needsPhoto: true },
  { key: "frase", label: "Frase", needsPhoto: false },
  { key: "promocao", label: "Promoção", needsPhoto: true },
  { key: "diferencial", label: "Diferencial", needsPhoto: false },
  { key: "contato", label: "Contato", needsPhoto: false },
];

/** Modelos que usam o conjunto de campos "estilo Campanha" (linha pequena,
 * título, destaque, texto de apoio, selos, localização, assinatura) em vez
 * dos campos simples (título/subtítulo/preço). */
export const RICH_FIELD_TEMPLATES: TemplateKey[] = [
  "campanha",
  "campanha-direita",
  "moderno",
  "neblina",
  "circulo",
  "diagonal",
  "moldura",
  "cartao",
  "ondas",
  "etiqueta",
  "hexagonos",
  "numerado",
  "estatistica",
  "citacao",
  "linhas",
  "impacto",
];

export const COLORS = {
  greenDark: "#0B3D2E",
  green: "#2E7D32",
  lime: "#A8D83B",
  amber: "#F39A22",
  graphite: "#253339",
};

/**
 * Se `src` vier de outro domínio (ex.: Vercel Blob), passa pelo nosso
 * proxy same-origin antes de carregar — senão o canvas fica "tainted" e
 * toDataURL/toBlob/captureStream falham (silenciosamente) em qualquer
 * navegador, quebrando salvar imagem e gravar vídeo. data:/blob: URLs
 * (foto enviada, IA, vídeo enviado) já são sempre same-origin/seguras.
 */
export function toCanvasSafeSrc(src: string): string {
  if (typeof window === "undefined") return src;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  try {
    const resolved = new URL(src, window.location.origin);
    if (resolved.origin === window.location.origin) return src;
    return `/api/admin/proxy-image?src=${encodeURIComponent(resolved.toString())}`;
  } catch {
    return src;
  }
}

export function loadImage(src: string, timeoutMs = 15000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => {
      reject(new Error(`Tempo esgotado carregando imagem: ${src.slice(0, 80)}`));
    }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Não foi possível carregar a imagem: ${src.slice(0, 80)}`));
    };
    img.src = toCanvasSafeSrc(src);
  });
}

/** Imagem estática ou frame ao vivo de um <video> — ambos podem ser
 * desenhados no canvas do mesmo jeito. */
export type MediaSource = HTMLImageElement | HTMLVideoElement;

function mediaSize(el: MediaSource): { width: number; height: number } {
  if (el instanceof HTMLVideoElement) {
    return { width: el.videoWidth, height: el.videoHeight };
  }
  return { width: el.width, height: el.height };
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
  img: MediaSource,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1
) {
  const { width: iw, height: ih } = mediaSize(img);
  if (!iw || !ih) return;
  const imgRatio = iw / ih;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = ih;
    sw = sh * boxRatio;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    sw = iw;
    sh = sw / boxRatio;
    sx = 0;
    sy = (ih - sh) / 2;
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
  const w = 760;
  const h = (logo.height / logo.width) * w;
  ctx.drawImage(logo, margin, margin, w, h);
}

function drawLogoTopRight(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  margin: number
) {
  if (!logo) return;
  const w = 760;
  const h = (logo.height / logo.width) * w;
  ctx.drawImage(logo, W - margin - w, margin, w, h);
}

type BadgeIcon = "precisao" | "produtividade" | "seguranca";

function drawBadgeIcon(
  ctx: CanvasRenderingContext2D,
  kind: BadgeIcon,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  if (kind === "precisao") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    [0, 90, 180, 270].forEach((deg) => {
      const a = (deg * Math.PI) / 180;
      const x1 = cx + Math.cos(a) * r * 0.78;
      const y1 = cy + Math.sin(a) * r * 0.78;
      const x2 = cx + Math.cos(a) * r * 1.02;
      const y2 = cy + Math.sin(a) * r * 1.02;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  } else if (kind === "produtividade") {
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.55);
    ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.1, cx, cy - r * 0.55);
    ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.1, cx, cy + r * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.5);
    ctx.lineTo(cx, cy - r * 0.35);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.15);
    ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.55, cx, cy + r * 0.7);
    ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.55, cx - r * 0.5, cy + r * 0.15);
    ctx.lineTo(cx - r * 0.5, cy - r * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.22, cy);
    ctx.lineTo(cx - r * 0.05, cy + r * 0.2);
    ctx.lineTo(cx + r * 0.28, cy - r * 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.28, y + size * 0.1);
  ctx.lineTo(x + size * 0.28, y + size * 0.1);
  ctx.lineTo(x, y + size * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.greenDark;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHexOutline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

/** Empilha kicker/título/destaque/corpo alinhados à esquerda, um embaixo do
 * outro, reaproveitado por vários modelos. Retorna o Y final (útil pra
 * posicionar selos/localização logo abaixo). */
function drawTextStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  startY: number,
  maxW: number,
  opts: {
    kicker?: string;
    title?: string;
    highlight?: string;
    body?: string;
    kickerColor?: string;
    titleColor?: string;
    highlightColor?: string;
    bodyColor?: string;
    titleSize?: number;
    highlightSize?: number;
    align?: "left" | "center";
  }
): number {
  let cursorY = startY;
  const {
    kicker,
    title,
    highlight,
    body,
    kickerColor = "#ffffff",
    titleColor = "#ffffff",
    highlightColor = COLORS.lime,
    bodyColor = "rgba(255,255,255,0.9)",
    titleSize = 62,
    highlightSize = 74,
    align = "left",
  } = opts;
  ctx.textAlign = align;
  const tx = align === "center" ? x + maxW / 2 : x;

  if (kicker) {
    ctx.font = "700 27px Montserrat, sans-serif";
    ctx.fillStyle = kickerColor;
    wrapText(ctx, kicker.toUpperCase(), maxW).forEach((line) => {
      ctx.fillText(line, tx, cursorY);
      cursorY += 36;
    });
    cursorY += 18;
  }
  if (title) {
    ctx.font = `800 ${titleSize}px Montserrat, sans-serif`;
    ctx.fillStyle = titleColor;
    wrapText(ctx, title.toUpperCase(), maxW).forEach((line) => {
      ctx.fillText(line, tx, cursorY);
      cursorY += titleSize * 0.96;
    });
  }
  if (highlight) {
    ctx.font = `800 ${highlightSize}px Montserrat, sans-serif`;
    ctx.fillStyle = highlightColor;
    wrapText(ctx, highlight.toUpperCase(), maxW).forEach((line) => {
      ctx.fillText(line, tx, cursorY);
      cursorY += highlightSize * 0.92;
    });
  }
  if (body) {
    cursorY += 14;
    ctx.font = "500 27px Montserrat, sans-serif";
    ctx.fillStyle = bodyColor;
    wrapText(ctx, body, maxW).forEach((line) => {
      ctx.fillText(line, tx, cursorY);
      cursorY += 37;
    });
  }
  ctx.textAlign = "left";
  return cursorY;
}

/** Linha de até 3 selos com ícone (usada por vários modelos). Retorna o Y
 * de baixo da linha. */
function drawBadgeRow(
  ctx: CanvasRenderingContext2D,
  badges: string[],
  x: number,
  y: number,
  totalW: number,
  opts?: { iconColor?: string; textColor?: string; radius?: number }
): number {
  const active = badges.filter(Boolean).slice(0, 3);
  if (!active.length) return y;
  const icons: BadgeIcon[] = ["precisao", "produtividade", "seguranca"];
  const r = opts?.radius ?? 26;
  const colW = totalW / active.length;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  active.forEach((label, i) => {
    const colX = x + i * colW;
    drawBadgeIcon(ctx, icons[i % icons.length], colX + r, y, r);
    ctx.font = "700 20px Montserrat, sans-serif";
    ctx.fillStyle = opts?.textColor ?? "#ffffff";
    wrapText(ctx, label, colW - 16)
      .slice(0, 2)
      .forEach((line, li) => {
        ctx.fillText(line, colX + r * 2 + 14, y - 4 + li * 24);
      });
  });
  ctx.textAlign = prevAlign;
  return y + r * 2 + 30;
}

export type DrawOpts = {
  template: TemplateKey;
  h: number;
  photo: MediaSource | null;
  logo: HTMLImageElement | null;
  title: string;
  subtitle: string;
  price: string;
  /** 1 = photo at rest (no zoom). >1 slowly "zooms in" — used for video. */
  zoom?: number;
  /** 0..1, how revealed the foreground (text/logo/badges) is. 1 = fully shown. */
  reveal?: number;
  /** Campanha: pequena linha acima do título (ex.: "ESTÁ CHEGANDO A"). */
  kicker?: string;
  /** Campanha: segunda linha do título, em destaque (ex.: "SAFRA 26/27"). */
  highlight?: string;
  /** Campanha: parágrafo curto de apoio. */
  body?: string;
  /** Campanha: até 3 selos com ícone (texto curto cada). */
  badges?: string[];
  /** Campanha: linha de localização (ex.: "Porto Nacional, Palmas/TO e Região"). */
  location?: string;
  /** Campanha: assinatura em fonte manuscrita (ex.: "Juntos por uma safra melhor!"). */
  signature?: string;
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
    kicker = "",
    highlight = "",
    body = "",
    badges = [],
    location = "",
    signature = "",
  } = opts;
  ctx.clearRect(0, 0, W, H);

  if (template === "campanha") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    // painel diagonal escuro do lado esquerdo, pra dar legibilidade ao texto
    // sem cobrir a foto inteira (como nos exemplos de campanha).
    const splitX = W * 0.62;
    const grad = ctx.createLinearGradient(0, 0, splitX + 140, 0);
    grad.addColorStop(0, "rgba(11,61,46,0.97)");
    grad.addColorStop(0.72, "rgba(11,61,46,0.9)");
    grad.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(splitX + 140, 0);
    ctx.lineTo(splitX - 60, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxTextW = splitX - leftMargin - 40;
    const footerH = location ? 60 : 0;
    let cursorY = H * 0.24;

    if (kicker) {
      ctx.font = "700 30px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, kicker.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 38;
      });
      cursorY += 44;
    }

    if (title) {
      ctx.font = "800 76px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, title.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 72;
      });
    }

    if (highlight) {
      ctx.font = "800 88px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.lime;
      wrapText(ctx, highlight.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 82;
      });
    }

    cursorY += 14;
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftMargin, cursorY);
    ctx.lineTo(leftMargin + 110, cursorY);
    ctx.stroke();
    cursorY += 44;

    if (body) {
      ctx.font = "500 30px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      wrapText(ctx, body, maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 40;
      });
    }

    const activeBadges = badges.filter(Boolean).slice(0, 3);
    if (activeBadges.length) {
      const icons: BadgeIcon[] = ["precisao", "produtividade", "seguranca"];
      const maxBadgeY = H - footerH - 90;
      const badgeY = Math.min(cursorY + 46, maxBadgeY);
      const colW = maxTextW / activeBadges.length;
      const badgeR = 32;
      activeBadges.forEach((label, i) => {
        const colX = leftMargin + i * colW;
        drawBadgeIcon(ctx, icons[i % icons.length], colX + badgeR, badgeY, badgeR);
        ctx.font = "700 22px Montserrat, sans-serif";
        ctx.fillStyle = "#ffffff";
        const lines = wrapText(ctx, label, colW - 16);
        let ly = badgeY + badgeR + 34;
        lines.slice(0, 2).forEach((line) => {
          ctx.fillText(line, colX, ly);
          ly += 28;
        });
      });
      cursorY = badgeY + badgeR * 2 + 30;
    }

    if (location) {
      const locY = Math.min(cursorY + 34, H - 40);
      drawPin(ctx, leftMargin + 12, locY - 8, 26);
      ctx.font = "600 26px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 34, locY);
    }

    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 46px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      const lines = wrapText(ctx, signature, W - splitX - 40);
      let sy = H - 70 - (lines.length - 1) * 40;
      lines.forEach((line) => {
        ctx.fillText(line, W - 60, sy);
        sy += 40;
      });
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "campanha-direita") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    // mesmo painel diagonal da campanha, espelhado pro lado direito.
    const panelStart = W * 0.38;
    const grad = ctx.createLinearGradient(W, 0, panelStart - 140, 0);
    grad.addColorStop(0, "rgba(11,61,46,0.97)");
    grad.addColorStop(0.72, "rgba(11,61,46,0.9)");
    grad.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(panelStart - 140, 0);
    ctx.lineTo(panelStart + 60, H);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "right";
    drawLogoTopRight(ctx, logo, 60);

    const rightMargin = 60;
    const textX = W - rightMargin;
    const maxTextW = W - panelStart - rightMargin - 40;
    const footerH = location ? 60 : 0;
    let cursorY = H * 0.24;

    if (kicker) {
      ctx.font = "700 30px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, kicker.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += 38;
      });
      cursorY += 44;
    }

    if (title) {
      ctx.font = "800 76px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, title.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += 72;
      });
    }

    if (highlight) {
      ctx.font = "800 88px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.lime;
      wrapText(ctx, highlight.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += 82;
      });
    }

    cursorY += 14;
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(textX, cursorY);
    ctx.lineTo(textX - 110, cursorY);
    ctx.stroke();
    cursorY += 44;

    if (body) {
      ctx.font = "500 30px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      wrapText(ctx, body, maxTextW).forEach((line) => {
        ctx.fillText(line, textX, cursorY);
        cursorY += 40;
      });
    }

    const activeBadges = badges.filter(Boolean).slice(0, 3);
    const badgeAreaLeft = textX - maxTextW;
    if (activeBadges.length) {
      const icons: BadgeIcon[] = ["precisao", "produtividade", "seguranca"];
      const maxBadgeY = H - footerH - 90;
      const badgeY = Math.min(cursorY + 46, maxBadgeY);
      const colW = maxTextW / activeBadges.length;
      const badgeR = 32;
      ctx.textAlign = "left";
      activeBadges.forEach((label, i) => {
        const colX = badgeAreaLeft + i * colW;
        drawBadgeIcon(ctx, icons[i % icons.length], colX + badgeR, badgeY, badgeR);
        ctx.font = "700 22px Montserrat, sans-serif";
        ctx.fillStyle = "#ffffff";
        const lines = wrapText(ctx, label, colW - 16);
        let ly = badgeY + badgeR + 34;
        lines.slice(0, 2).forEach((line) => {
          ctx.fillText(line, colX, ly);
          ly += 28;
        });
      });
      cursorY = badgeY + badgeR * 2 + 30;
      ctx.textAlign = "right";
    }

    if (location) {
      const locY = Math.min(cursorY + 34, H - 40);
      ctx.textAlign = "left";
      drawPin(ctx, badgeAreaLeft + 12, locY - 8, 26);
      ctx.font = "600 26px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, badgeAreaLeft + 34, locY);
      ctx.textAlign = "right";
    }

    if (signature) {
      ctx.textAlign = "left";
      ctx.font = "700 46px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      const lines = wrapText(ctx, signature, panelStart - 40);
      let sy = H - 70 - (lines.length - 1) * 40;
      lines.forEach((line) => {
        ctx.fillText(line, 60, sy);
        sy += 40;
      });
    }

    ctx.restore();
    return;
  }

  if (template === "moderno") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    // gradiente esfumaçado no topo — só o suficiente pra dar legibilidade,
    // sem esconder a foto/vídeo de fundo.
    const topOverlay = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    topOverlay.addColorStop(0, "rgba(11,61,46,0.55)");
    topOverlay.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = topOverlay;
    ctx.fillRect(0, 0, W, H * 0.5);

    // formas decorativas: círculos concêntricos no canto e um ponto de destaque
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(W - 30, 30, 280, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W - 30, 30, 170, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = COLORS.amber;
    ctx.beginPath();
    ctx.arc(W - 130, H * 0.62, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - 90, H * 0.66, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxTextW = W - leftMargin * 2 - 40;
    let cursorY = H * 0.38;

    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18;

    if (kicker) {
      ctx.font = "700 26px Montserrat, sans-serif";
      const label = kicker.toUpperCase();
      const textW = ctx.measureText(label).width;
      const padX = 22;
      const boxH = 48;
      const boxY = cursorY - boxH + 14;
      ctx.fillStyle = COLORS.lime;
      roundRect(ctx, leftMargin, boxY, textW + padX * 2, boxH, boxH / 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = COLORS.greenDark;
      ctx.textBaseline = "middle";
      ctx.fillText(label, leftMargin + padX, boxY + boxH / 2 + 1);
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      cursorY += 50;
    }

    if (title) {
      ctx.font = "800 74px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, title.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 74;
      });
    }

    if (highlight) {
      ctx.font = "800 86px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.lime;
      wrapText(ctx, highlight.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 80;
      });
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // rodapé fino e esfumaçado — só uma faixa translúcida, a foto/vídeo
    // continua visível por trás.
    const footerH = 150;
    const footerGrad = ctx.createLinearGradient(0, H - footerH, 0, H);
    footerGrad.addColorStop(0, "rgba(11,61,46,0)");
    footerGrad.addColorStop(0.4, "rgba(11,61,46,0.55)");
    footerGrad.addColorStop(1, "rgba(11,61,46,0.8)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, H - footerH, W, footerH);
    ctx.fillStyle = COLORS.lime;
    ctx.fillRect(0, H - footerH, W, 3);

    const activeBadges = badges.filter(Boolean).slice(0, 3);
    if (activeBadges.length) {
      const icons: BadgeIcon[] = ["precisao", "produtividade", "seguranca"];
      const badgeY = H - footerH + 44;
      const colW = maxTextW / activeBadges.length;
      const badgeR = 20;
      activeBadges.forEach((label, i) => {
        const colX = leftMargin + i * colW;
        drawBadgeIcon(ctx, icons[i % icons.length], colX + badgeR, badgeY, badgeR);
        ctx.font = "700 18px Montserrat, sans-serif";
        ctx.fillStyle = "#ffffff";
        wrapText(ctx, label, colW - 16)
          .slice(0, 1)
          .forEach((line) => {
            ctx.fillText(line, colX + badgeR * 2 + 12, badgeY + 5);
          });
      });
    }

    const footerBottomY = H - 34;

    if (location) {
      drawPin(ctx, leftMargin + 10, footerBottomY - 7, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 32, footerBottomY);
    }

    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 34px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, footerBottomY);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "neblina") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    // quase sem véu: só uma leve névoa nas bordas pra caber o texto, a
    // foto/vídeo continua praticamente inteira à mostra.
    const topFog = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    topFog.addColorStop(0, "rgba(11,61,46,0.4)");
    topFog.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = topFog;
    ctx.fillRect(0, 0, W, H * 0.32);

    const bottomFog = ctx.createLinearGradient(0, H * 0.62, 0, H);
    bottomFog.addColorStop(0, "rgba(11,61,46,0)");
    bottomFog.addColorStop(1, "rgba(11,61,46,0.7)");
    ctx.fillStyle = bottomFog;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxTextW = W - leftMargin * 2 - 40;
    const footerH = 110;
    let cursorY = H * 0.4;

    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 20;

    if (kicker) {
      ctx.font = "700 28px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, kicker.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 36;
      });
      cursorY += 20;
    }

    if (title) {
      ctx.font = "800 56px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, title.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 58;
      });
    }

    if (highlight) {
      ctx.font = "800 90px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.lime;
      wrapText(ctx, highlight.toUpperCase(), maxTextW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 82;
      });
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const activeBadges = badges.filter(Boolean).slice(0, 3);
    if (activeBadges.length) {
      const icons: BadgeIcon[] = ["precisao", "produtividade", "seguranca"];
      const maxBadgeY = H - footerH - 40;
      const badgeY = Math.min(cursorY + 40, maxBadgeY);
      const colW = maxTextW / activeBadges.length;
      const badgeR = 20;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      activeBadges.forEach((label, i) => {
        const colX = leftMargin + i * colW;
        drawBadgeIcon(ctx, icons[i % icons.length], colX + badgeR, badgeY, badgeR);
        ctx.font = "700 18px Montserrat, sans-serif";
        ctx.fillStyle = "#ffffff";
        wrapText(ctx, label, colW - 16)
          .slice(0, 1)
          .forEach((line) => {
            ctx.fillText(line, colX + badgeR * 2 + 12, badgeY + 5);
          });
      });
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    // faixa bem fina e translúcida no rodapé, só pra localização/assinatura
    const footerGrad = ctx.createLinearGradient(0, H - footerH, 0, H);
    footerGrad.addColorStop(0, "rgba(11,61,46,0)");
    footerGrad.addColorStop(1, "rgba(11,61,46,0.55)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, H - footerH, W, footerH);

    const footerBottomY = H - 34;

    if (location) {
      drawPin(ctx, leftMargin + 10, footerBottomY - 7, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText(location, leftMargin + 32, footerBottomY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 34px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText(signature, W - leftMargin, footerBottomY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "circulo") {
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cr = W * 0.21;
    const cy = H * 0.05 + cr;

    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.clip();
      drawCover(ctx, photo, cx - cr, cy - cr, cr * 2, cr * 2, zoom);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, cr + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.amber;
    ctx.beginPath();
    ctx.arc(cx + cr * 0.85, cy - cr * 0.85, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    drawLogoTopLeft(ctx, logo, 50);

    const leftMargin = 70;
    const maxW = W - leftMargin * 2;
    let cursorY = drawTextStack(ctx, leftMargin, cy + cr + 70, maxW, {
      kicker,
      title,
      highlight,
      align: "center",
      titleSize: 56,
      highlightSize: 66,
    });

    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 32, maxW, { radius: 22 });

    let footY = cursorY + 26;
    if (location) {
      ctx.textAlign = "center";
      ctx.font = "600 26px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, W / 2, footY);
      ctx.textAlign = "left";
      footY += 48;
    }
    if (signature) {
      ctx.textAlign = "center";
      ctx.font = "700 40px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W / 2, footY);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "diagonal") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    const splitY = H * 0.58;
    const grad = ctx.createLinearGradient(0, H, 0, splitY - 160);
    grad.addColorStop(0, "rgba(11,61,46,0.97)");
    grad.addColorStop(0.75, "rgba(11,61,46,0.92)");
    grad.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, splitY - 160);
    ctx.lineTo(W, splitY + 60);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxW = W - leftMargin * 2 - 40;
    let cursorY = drawTextStack(ctx, leftMargin, splitY + 60, maxW, { kicker, title, highlight });

    const footerH = location ? 60 : 0;
    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 40, maxW);

    if (location) {
      const locY = cursorY + 34;
      drawPin(ctx, leftMargin + 12, locY - 8, 26);
      ctx.font = "600 26px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 34, locY);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 42px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - 60, H - 50);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "moldura") {
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillRect(0, 0, W, H);

    const frameM = 46;
    const photoH = H * 0.5;
    if (photo) {
      ctx.save();
      roundRect(ctx, frameM, frameM, W - frameM * 2, photoH, 18);
      ctx.clip();
      drawCover(ctx, photo, frameM, frameM, W - frameM * 2, photoH, zoom);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 6;
    roundRect(ctx, frameM, frameM, W - frameM * 2, photoH, 18);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    drawLogoTopLeft(ctx, logo, frameM + 14);

    const leftMargin = frameM + 20;
    const maxW = W - leftMargin * 2;
    let cursorY = drawTextStack(ctx, leftMargin, frameM + photoH + 70, maxW, {
      kicker,
      title,
      highlight,
      body,
    });

    const footerH = 90;
    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 36, maxW);

    if (location) {
      const locY = cursorY + 30;
      drawPin(ctx, leftMargin + 12, locY - 8, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 32, locY);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, H - 46);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "cartao") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, COLORS.green);
    grad.addColorStop(1, COLORS.greenDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const cardM = 70;
    const cardY = H * 0.19;
    const cardH = H * 0.28;

    if (photo) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#000";
      roundRect(ctx, cardM, cardY, W - cardM * 2, cardH, 28);
      ctx.fill();
      ctx.restore();

      ctx.save();
      roundRect(ctx, cardM, cardY, W - cardM * 2, cardH, 28);
      ctx.clip();
      drawCover(ctx, photo, cardM, cardY, W - cardM * 2, cardH, zoom);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 50);

    if (kicker) {
      ctx.font = "700 22px Montserrat, sans-serif";
      const label = kicker.toUpperCase();
      const tw = ctx.measureText(label).width;
      const padX = 18;
      const boxH = 40;
      ctx.fillStyle = COLORS.amber;
      roundRect(ctx, cardM + 18, cardY + 18, tw + padX * 2, boxH, boxH / 2);
      ctx.fill();
      ctx.fillStyle = COLORS.greenDark;
      ctx.textBaseline = "middle";
      ctx.fillText(label, cardM + 18 + padX, cardY + 18 + boxH / 2 + 1);
      ctx.textBaseline = "alphabetic";
    }

    const leftMargin = cardM;
    const maxW = W - leftMargin * 2;
    let cursorY = drawTextStack(ctx, leftMargin, cardY + cardH + 50, maxW, {
      title,
      highlight,
      align: "center",
      titleSize: 54,
      highlightSize: 62,
    });

    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 30, maxW, { radius: 22 });

    // localização e assinatura empilhadas, uma embaixo da outra — nunca
    // colidem, seja qual for o tamanho do conteúdo acima.
    let footY = cursorY + 26;
    if (location) {
      ctx.textAlign = "center";
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, W / 2, footY);
      ctx.textAlign = "left";
      footY += 46;
    }
    if (signature) {
      ctx.textAlign = "center";
      ctx.font = "700 36px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W / 2, footY);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "ondas") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    const waveY = H * 0.43;
    ctx.save();
    ctx.fillStyle = COLORS.greenDark;
    ctx.beginPath();
    ctx.moveTo(0, waveY + 40);
    ctx.bezierCurveTo(W * 0.25, waveY - 60, W * 0.75, waveY + 100, W, waveY - 20);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxW = W - leftMargin * 2 - 40;
    let cursorY = drawTextStack(ctx, leftMargin, waveY + 80, maxW, {
      kicker,
      title,
      highlight,
      body,
    });

    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 30, maxW, { radius: 22 });

    if (location) {
      const locY = cursorY + 30;
      drawPin(ctx, leftMargin + 12, locY - 8, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 32, locY);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, H - 40);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "etiqueta") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    const bottomFog = ctx.createLinearGradient(0, H * 0.5, 0, H);
    bottomFog.addColorStop(0, "rgba(11,61,46,0)");
    bottomFog.addColorStop(1, "rgba(11,61,46,0.85)");
    ctx.fillStyle = bottomFog;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    if (highlight) {
      const tagW = 300;
      const tagH = 96;
      const tx = W - tagW - 20;
      const ty = 60;
      ctx.save();
      ctx.fillStyle = COLORS.amber;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + tagW, ty);
      ctx.lineTo(tx + tagW, ty + tagH);
      ctx.lineTo(tx + 24, ty + tagH);
      ctx.lineTo(tx, ty + tagH - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.greenDark;
      ctx.font = "800 30px Montserrat, sans-serif";
      ctx.textAlign = "center";
      wrapText(ctx, highlight.toUpperCase(), tagW - 40)
        .slice(0, 2)
        .forEach((line, i) => {
          ctx.fillText(line, tx + tagW / 2, ty + 42 + i * 34);
        });
      ctx.textAlign = "left";
      ctx.restore();
    }

    const leftMargin = 60;
    const maxW = W - leftMargin * 2 - 40;
    let cursorY = drawTextStack(ctx, leftMargin, H * 0.66, maxW, { kicker, title });

    const footerH = 90;
    cursorY = drawBadgeRow(ctx, badges, leftMargin, cursorY + 34, maxW);

    if (location) {
      const locY = cursorY + 30;
      drawPin(ctx, leftMargin + 12, locY - 8, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 32, locY);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 36px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, H - 44);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "hexagonos") {
    if (photo) {
      drawCover(ctx, photo, 0, 0, W, H, zoom);
    } else {
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillRect(0, 0, W, H);
    }

    const splitX = W * 0.62;
    const grad = ctx.createLinearGradient(0, 0, splitX + 140, 0);
    grad.addColorStop(0, "rgba(11,61,46,0.95)");
    grad.addColorStop(0.72, "rgba(11,61,46,0.88)");
    grad.addColorStop(1, "rgba(11,61,46,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(splitX + 140, 0);
    ctx.lineTo(splitX - 60, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 6;
    drawHexOutline(ctx, splitX - 40, H * 0.15, 70);
    drawHexOutline(ctx, splitX + 10, H * 0.28, 40);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 60;
    const maxW = splitX - leftMargin - 40;
    let cursorY = drawTextStack(ctx, leftMargin, H * 0.36, maxW, {
      kicker,
      title,
      highlight,
      body,
    });

    const footerH = 90;
    const activeBadges = badges.filter(Boolean).slice(0, 3);
    const badgeY = cursorY + 40;
    if (activeBadges.length) {
      const hexR = 30;
      const colW = maxW / activeBadges.length;
      activeBadges.forEach((label, i) => {
        const colX = leftMargin + i * colW + hexR;
        ctx.save();
        ctx.strokeStyle = COLORS.lime;
        ctx.lineWidth = 3;
        drawHexOutline(ctx, colX, badgeY, hexR);
        ctx.restore();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 22px Montserrat, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), colX, badgeY + 8);
        ctx.textAlign = "left";
        ctx.font = "700 19px Montserrat, sans-serif";
        wrapText(ctx, label, colW - 16)
          .slice(0, 2)
          .forEach((line, li) => {
            ctx.fillText(line, leftMargin + i * colW, badgeY + hexR + 26 + li * 24);
          });
      });
      cursorY = badgeY + hexR * 2 + 26;
    }

    if (location) {
      const locY = cursorY + 30;
      drawPin(ctx, leftMargin + 12, locY - 8, 24);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(location, leftMargin + 32, locY);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - 60, H - 40);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "numerado") {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, COLORS.greenDark);
    grad.addColorStop(1, COLORS.green);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W - 60, 60, 220, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 70;
    const maxW = W - leftMargin * 2;
    const cursorY = drawTextStack(ctx, leftMargin, H * 0.28, maxW, { kicker, title, highlight });

    const steps = badges.filter(Boolean).slice(0, 3);
    let stepY = cursorY + 60;
    steps.forEach((label, i) => {
      const r = 34;
      ctx.fillStyle = COLORS.lime;
      ctx.beginPath();
      ctx.arc(leftMargin + r, stepY + r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.greenDark;
      ctx.font = "800 30px Montserrat, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), leftMargin + r, stepY + r + 11);
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px Montserrat, sans-serif";
      wrapText(ctx, label, maxW - r * 2 - 30)
        .slice(0, 2)
        .forEach((line, li) => {
          ctx.fillText(line, leftMargin + r * 2 + 24, stepY + r - 4 + li * 32);
        });
      if (i < steps.length - 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftMargin + r, stepY + r * 2 + 6);
        ctx.lineTo(leftMargin + r, stepY + 130 - 6);
        ctx.stroke();
      }
      stepY += 130;
    });

    if (location) {
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(location, leftMargin, H - 60);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, H - 60);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "estatistica") {
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = COLORS.lime;
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H * 0.3);
    ctx.lineTo(W * 0.65, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    const leftMargin = 70;
    const maxW = W - leftMargin * 2;
    const cursorY = drawTextStack(ctx, leftMargin, H * 0.32, maxW, {
      kicker,
      title,
      highlight,
      highlightSize: 96,
    });

    const stats = badges.filter(Boolean).slice(0, 3);
    const chipY = cursorY + 60;
    const chipH = 130;
    const gap = 20;
    const chipW = (maxW - gap * (stats.length - 1)) / Math.max(stats.length, 1);
    stats.forEach((label, i) => {
      const chipX = leftMargin + i * (chipW + gap);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, chipX, chipY, chipW, chipH, 16);
      ctx.fill();
      ctx.strokeStyle = COLORS.lime;
      ctx.lineWidth = 2;
      roundRect(ctx, chipX, chipY, chipW, chipH, 16);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px Montserrat, sans-serif";
      ctx.textAlign = "center";
      wrapText(ctx, label, chipW - 24)
        .slice(0, 3)
        .forEach((line, li) => {
          ctx.fillText(line, chipX + chipW / 2, chipY + chipH / 2 - 8 + li * 24);
        });
      ctx.textAlign = "left";
    });

    if (location) {
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(location, leftMargin, H - 50);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, W - leftMargin, H - 50);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "citacao") {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, COLORS.greenDark);
    grad.addColorStop(1, COLORS.green);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    drawLogoTopLeft(ctx, logo, 60);

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.font = "800 220px Georgia, serif";
    ctx.fillText("“", 50, H * 0.42);

    const leftMargin = 70;
    const maxW = W - leftMargin * 2;
    let cursorY = H * 0.4;
    if (kicker) {
      ctx.font = "700 26px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.lime;
      wrapText(ctx, kicker.toUpperCase(), maxW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 34;
      });
      cursorY += 20;
    }
    if (body) {
      ctx.font = "600 40px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, body, maxW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 52;
      });
    }
    cursorY += 20;
    ctx.strokeStyle = COLORS.lime;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftMargin, cursorY);
    ctx.lineTo(leftMargin + 90, cursorY);
    ctx.stroke();
    cursorY += 40;
    if (signature) {
      ctx.font = "700 36px Caveat, cursive";
      ctx.fillStyle = COLORS.lime;
      ctx.fillText(signature, leftMargin, cursorY);
    }

    if (location) {
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(location, leftMargin, H - 50);
    }

    ctx.restore();
    return;
  }

  if (template === "linhas") {
    ctx.fillStyle = "#F7F5EF";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.strokeStyle = "rgba(37,51,57,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 170);
    ctx.lineTo(W - 60, 170);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "800 26px Montserrat, sans-serif";
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillText("NORTE DRONES", 60, 110);

    const leftMargin = 60;
    const maxW = W - leftMargin * 2;
    const cursorY = drawTextStack(ctx, leftMargin, 250, maxW, {
      kicker,
      title,
      highlight,
      body,
      kickerColor: COLORS.green,
      titleColor: COLORS.graphite,
      highlightColor: COLORS.green,
      bodyColor: "rgba(37,51,57,0.75)",
    });

    const activeBadges = badges.filter(Boolean).slice(0, 3);
    const badgeY = cursorY + 50;
    activeBadges.forEach((label, i) => {
      const rowY = badgeY + i * 44;
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(leftMargin, rowY - 14, 14, 14);
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.graphite;
      ctx.fillText(label, leftMargin + 30, rowY);
    });

    ctx.strokeStyle = "rgba(37,51,57,0.15)";
    ctx.beginPath();
    ctx.moveTo(60, H - 90);
    ctx.lineTo(W - 60, H - 90);
    ctx.stroke();

    if (location) {
      ctx.font = "600 22px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.graphite;
      ctx.fillText(location, leftMargin, H - 50);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 34px Caveat, cursive";
      ctx.fillStyle = COLORS.green;
      ctx.fillText(signature, W - leftMargin, H - 50);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

  if (template === "impacto") {
    ctx.fillStyle = COLORS.amber;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = COLORS.greenDark;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.7);
    ctx.lineTo(W * 0.4, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W, H * 0.35);
    ctx.lineTo(W * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.translate(0, (1 - reveal) * 26);

    ctx.textAlign = "left";
    const leftMargin = 60;
    const maxW = W - leftMargin * 2;
    let cursorY = H * 0.32;
    if (kicker) {
      ctx.font = "700 28px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.greenDark;
      wrapText(ctx, kicker.toUpperCase(), maxW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 36;
      });
      cursorY += 60;
    }
    if (title) {
      ctx.font = "800 96px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.greenDark;
      wrapText(ctx, title.toUpperCase(), maxW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 90;
      });
    }
    if (highlight) {
      ctx.font = "800 96px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, highlight.toUpperCase(), maxW).forEach((line) => {
        ctx.fillText(line, leftMargin, cursorY);
        cursorY += 90;
      });
    }

    if (location) {
      ctx.font = "600 24px Montserrat, sans-serif";
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillText(location, leftMargin, H - 50);
    }
    if (signature) {
      ctx.textAlign = "right";
      ctx.font = "700 38px Caveat, cursive";
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillText(signature, W - leftMargin, H - 50);
      ctx.textAlign = "left";
    }

    ctx.restore();
    return;
  }

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
      const w = 680;
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
      const w = 760;
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
  // Se a Font Loading API travar por algum motivo (já vimos isso
  // acontecer com outras esperas assíncronas em navegadores móveis),
  // preferimos desenhar com uma fonte de reserva a travar pra sempre
  // numa tela em branco.
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
  const fonts = (async () => {
    try {
      await document.fonts.load("800 66px Montserrat");
      await document.fonts.load("500 36px Montserrat");
      await document.fonts.load("700 46px Caveat");
      await document.fonts.ready;
    } catch {
      // segue com a fonte de reserva do navegador
    }
  })();
  await Promise.race([fonts, timeout]);
}
