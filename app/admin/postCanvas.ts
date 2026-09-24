export const W = 1080;

export type TemplateKey =
  | "servico"
  | "frase"
  | "promocao"
  | "diferencial"
  | "contato"
  | "campanha"
  | "campanha-direita";
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
  { key: "campanha", label: "Campanha", needsPhoto: true },
  { key: "campanha-direita", label: "Campanha (painel à direita)", needsPhoto: true },
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
  const w = 460;
  const h = (logo.height / logo.width) * w;
  ctx.drawImage(logo, margin, margin, w, h);
}

function drawLogoTopRight(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  margin: number
) {
  if (!logo) return;
  const w = 460;
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
    let cursorY = H * 0.18;

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
    let cursorY = H * 0.18;

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
      const w = 400;
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
      const w = 460;
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
  await document.fonts.load("700 46px Caveat");
  await document.fonts.ready;
}
