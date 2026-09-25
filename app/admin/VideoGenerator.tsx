"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteImageKey } from "@/lib/site-image-fields";
import {
  W,
  FORMATS,
  TEMPLATES,
  RICH_FIELD_TEMPLATES,
  loadImage,
  loadFonts,
  draw,
  type TemplateKey,
  type FormatKey,
  type MediaSource,
} from "./postCanvas";
import { PhotoPicker, resolvePhotoSrc, type PhotoSource } from "./PhotoPicker";
import { shareOrDownloadFile } from "./shareFile";

const DURATION_S = 5.5;
// Limite de segurança bem alto (não é um limite "prático") — só pra
// evitar travar o navegador num caso extremo (ex.: duration=Infinity).
// O vídeo enviado é sempre renderizado por inteiro, do começo ao fim.
const MAX_VIDEO_DURATION_S = 600;
const REVEAL_START = 0.4;
const REVEAL_END = 1.3;
const FADE_S = 0.4;
const MAX_ZOOM = 1.12;

function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 10000): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Tempo esgotado esperando o vídeo enviado carregar (readyState=" +
            video.readyState +
            ")."
        )
      );
    }, timeoutMs);
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Não foi possível carregar o vídeo enviado."));
    };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    // Em alguns navegadores móveis um <video> quase invisível (1x1px,
    // opacity 0) não começa a baixar/decodificar sozinho — força aqui.
    video.load();
  });
}

type VideoWithCapture = HTMLVideoElement & {
  captureStream?: () => MediaStream;
};

function pickMimeType(): string | null {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    // Safari (iOS e macOS) não grava webm — só entende mp4.
    "video/mp4;codecs=h264",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

function extensionFor(mimeType: string): string {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}

function easeOutCubic(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

export function VideoGenerator({
  siteImages,
}: {
  siteImages: Record<SiteImageKey, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const [template, setTemplate] = useState<TemplateKey>("servico");
  const [format, setFormat] = useState<FormatKey>("quadrado");
  const [photoChoice, setPhotoChoice] = useState<PhotoSource>("about");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [aiPhoto, setAiPhoto] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
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
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoExt, setVideoExt] = useState<string>("webm");
  const [error, setError] = useState<string | null>(null);

  const activeTemplate = TEMPLATES.find((t) => t.key === template)!;
  const activeFormat = FORMATS.find((f) => f.key === format)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    setSupported(
      typeof MediaRecorder !== "undefined" &&
        !!canvas &&
        typeof canvas.captureStream === "function" &&
        pickMimeType() !== null
    );
  }, []);

  // Cria/limpa a URL do vídeo enviado quando o arquivo muda.
  useEffect(() => {
    if (!videoFile) {
      setVideoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Static preview (settled frame) whenever not recording.
  useEffect(() => {
    if (recording) return;
    let cancelled = false;
    async function renderPreview() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      try {
        await loadFonts();
        const logo = await loadImage(siteImages.logoDark);
        let photo: MediaSource | null = null;
        if (activeTemplate.needsPhoto) {
          if (photoChoice === "video" && videoObjectUrl) {
            const video = sourceVideoRef.current;
            if (video) {
              await waitForVideoReady(video);
              photo = video;
            }
          } else {
            const src = resolvePhotoSrc(photoChoice, siteImages, uploadedPhoto, aiPhoto);
            if (src) photo = await loadImage(src);
          }
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
          zoom: MAX_ZOOM,
          reveal: 1,
        });
      } catch {
        if (!cancelled) {
          setError(
            "Não foi possível carregar alguma imagem. Tente enviar a foto pelo seu dispositivo."
          );
        }
      }
    }
    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [
    recording,
    template,
    format,
    activeFormat.height,
    photoChoice,
    uploadedPhoto,
    aiPhoto,
    videoObjectUrl,
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

  async function handleRecord() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mimeType = pickMimeType();
    if (!mimeType) {
      setError("Seu navegador não suporta gravação de vídeo. Tente no Chrome.");
      return;
    }

    setError(null);
    setVideoUrl(null);
    setVideoBlob(null);

    try {
      await loadFonts();
      const logo = await loadImage(siteImages.logoDark);
      let photo: MediaSource | null = null;
      let sourceVideo: HTMLVideoElement | null = null;
      if (activeTemplate.needsPhoto) {
        if (photoChoice === "video" && videoObjectUrl) {
          const video = sourceVideoRef.current;
          if (!video) throw new Error("Vídeo não carregado.");
          await waitForVideoReady(video);
          sourceVideo = video;
          photo = video;
        } else {
          const src = resolvePhotoSrc(photoChoice, siteImages, uploadedPhoto, aiPhoto);
          if (src) photo = await loadImage(src);
        }
      }

      const clipDuration = sourceVideo
        ? Math.min(sourceVideo.duration || DURATION_S, MAX_VIDEO_DURATION_S)
        : DURATION_S;

      setRecording(true);
      setProgress(0);

      const canvasStream = canvas.captureStream(30);
      let audioTracks: MediaStreamTrack[] = [];
      if (sourceVideo) {
        sourceVideo.currentTime = 0;
        // navegadores móveis só deixam tocar um vídeo sem toque do
        // usuário se ele estiver "muted" (volume = 0 sozinho não basta,
        // especialmente no Safari/iOS). Isso não afeta o áudio capturado
        // pelo captureStream() abaixo — só silencia a reprodução local.
        sourceVideo.muted = true;
        sourceVideo.volume = 0;
        try {
          await sourceVideo.play();
        } catch (playErr) {
          console.warn("Autoplay do vídeo enviado foi bloqueado:", playErr);
          // segue mesmo se o autoplay for bloqueado — os frames ainda são
          // lidos de onde o vídeo estiver.
        }
        const capturable = sourceVideo as VideoWithCapture;
        if (typeof capturable.captureStream === "function") {
          audioTracks = capturable.captureStream().getAudioTracks();
        }
      }
      const stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();
      const startTime = performance.now();
      const c = ctx;

      await new Promise<void>((resolve) => {
        function frame(now: number) {
          const t = (now - startTime) / 1000;
          const p = Math.min(1, t / clipDuration);
          setProgress(p);

          const zoom = sourceVideo ? 1 : 1 + (MAX_ZOOM - 1) * p;
          const revealT =
            (t - REVEAL_START) / (REVEAL_END - REVEAL_START);
          const reveal = easeOutCubic(revealT);

          draw(c, {
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
            zoom,
            reveal,
          });

          // fade from/to black at the edges
          const fadeIn = Math.max(0, 1 - t / FADE_S);
          const fadeOut = Math.max(0, 1 - (clipDuration - t) / FADE_S);
          const fade = Math.max(fadeIn, fadeOut);
          if (fade > 0) {
            c.fillStyle = `rgba(0,0,0,${fade})`;
            c.fillRect(0, 0, W, activeFormat.height);
          }

          if (t < clipDuration) {
            requestAnimationFrame(frame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });

      recorder.stop();
      await stopped;
      stream.getTracks().forEach((tr) => tr.stop());
      if (sourceVideo) {
        sourceVideo.pause();
        sourceVideo.currentTime = 0;
      }

      const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
      setVideoBlob(blob);
      setVideoExt(extensionFor(mimeType));
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      const detail = err instanceof Error ? ` (${err.name}: ${err.message})` : "";
      setError(`Não foi possível gerar o vídeo. Tente novamente.${detail}`);
    } finally {
      setRecording(false);
    }
  }

  function handleDownload() {
    if (!videoBlob) return;
    shareOrDownloadFile(videoBlob, `norte-drones-${template}-${format}.${videoExt}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="relative flex flex-col items-center rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
        <canvas
          ref={canvasRef}
          width={W}
          height={activeFormat.height}
          className={`h-auto rounded-xl bg-black ring-1 ring-black/10 ${
            format === "story" ? "w-full max-w-[260px]" : "w-full max-w-[420px]"
          }`}
        />
        {videoObjectUrl && (
          <video
            ref={sourceVideoRef}
            src={videoObjectUrl}
            playsInline
            muted
            preload="auto"
            className="absolute h-px w-px opacity-0"
            style={{ pointerEvents: "none" }}
          />
        )}

        {!supported && (
          <p className="mt-3 max-w-xs text-center text-xs font-medium text-red-600">
            Seu navegador não suporta gravação de vídeo direto na página.
            No computador, tente no Chrome ou Edge. No iPhone, isso funciona
            a partir do iOS 14.3 — atualize o sistema (trocar de navegador
            no iPhone não resolve, todos usam o mesmo motor do Safari).
          </p>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}

        {recording && (
          <div className="mt-4 w-full max-w-[300px]">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-nd-amber transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-nd-graphite/50">
              Gravando… {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRecord}
            disabled={recording || !supported}
            className="rounded-full bg-nd-green-dark px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nd-green disabled:opacity-60"
          >
            {recording
              ? "Gravando…"
              : photoChoice === "video" && videoObjectUrl
              ? "Gerar vídeo"
              : `Gerar vídeo (${DURATION_S}s)`}
          </button>
          {videoUrl && !recording && (
            <button
              onClick={handleDownload}
              className="rounded-full border-2 border-nd-green-dark px-6 py-2.5 text-sm font-semibold text-nd-green-dark transition hover:bg-nd-green-dark hover:text-white"
            >
              Salvar vídeo (.{videoExt})
            </button>
          )}
        </div>

        {videoUrl && !recording && (
          <>
            <video
              src={videoUrl}
              controls
              loop
              playsInline
              className={`mt-6 rounded-xl ring-1 ring-black/10 ${
                format === "story" ? "w-full max-w-[220px]" : "w-full max-w-[320px]"
              }`}
            />
            <p className="mt-2 text-center text-xs text-nd-graphite/50">
              No celular, se o botão não funcionar: toque e segure o vídeo acima e escolha &quot;Salvar vídeo&quot;.
            </p>
          </>
        )}
      </div>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
        <div>
          <p className="mb-2 text-sm font-medium text-nd-graphite">Formato</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                disabled={recording}
                onClick={() => setFormat(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
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
                disabled={recording}
                onClick={() => setTemplate(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
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
            disabled={recording}
            allowVideo
            videoFileName={videoFile?.name ?? null}
            onVideoSelected={setVideoFile}
          />
        )}

        {RICH_FIELD_TEMPLATES.includes(template) ? (
          <>
            <Field label="Linha pequena (acima do título)" value={kicker} onChange={setKicker} disabled={recording} />
            <Field label="Título" value={title} onChange={setTitle} disabled={recording} />
            <Field label="Destaque (linha em verde-limão)" value={highlight} onChange={setHighlight} disabled={recording} />
            <Field label="Texto de apoio" value={body} onChange={setBody} disabled={recording} textarea />
            <Field label="Selo 1" value={badge1} onChange={setBadge1} disabled={recording} />
            <Field label="Selo 2" value={badge2} onChange={setBadge2} disabled={recording} />
            <Field label="Selo 3" value={badge3} onChange={setBadge3} disabled={recording} />
            <Field label="Localização" value={location} onChange={setLocation} disabled={recording} />
            <Field label="Assinatura (estilo manuscrito)" value={signature} onChange={setSignature} disabled={recording} />
          </>
        ) : (
          <>
            <Field
              label={template === "frase" ? "Frase" : "Título"}
              value={title}
              onChange={setTitle}
              disabled={recording}
              textarea={template === "frase"}
            />
            <Field
              label={template === "frase" ? "Assinatura (opcional)" : "Texto de apoio"}
              value={subtitle}
              onChange={setSubtitle}
              disabled={recording}
            />
            {(template === "promocao" || template === "contato") && (
              <Field
                label={template === "contato" ? "Texto do botão" : "Selo de destaque"}
                value={price}
                onChange={setPrice}
                disabled={recording}
              />
            )}
          </>
        )}

        <p className="text-xs leading-relaxed text-nd-graphite/50">
          {photoChoice === "video" && videoObjectUrl
            ? "O vídeo enviado é usado como base do início ao fim, com o áudio original, e sai em .webm — funciona bem no Instagram e WhatsApp. Nada é enviado nem salvo em servidor."
            : `O vídeo é gravado ao vivo no seu navegador (leva ${DURATION_S}s pra gerar) e sai em .webm — funciona bem no Instagram e WhatsApp. Nada é enviado nem salvo em servidor.`}
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-nd-graphite">
      {label}
      {textarea ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green disabled:opacity-50"
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-nd-green focus:ring-1 focus:ring-nd-green disabled:opacity-50"
        />
      )}
    </label>
  );
}
