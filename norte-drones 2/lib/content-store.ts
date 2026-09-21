import fs from "node:fs";
import path from "node:path";

export type SiteContacts = {
  whatsappNumber: string; // apenas digitos, com DDI+DDD, ex: 5563999999999
  whatsappMessage: string;
  phone: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  address: string;
  areaServed: string;
};

export type SiteContent = {
  contacts: SiteContacts;
};

const SEED_PATH = path.join(process.cwd(), "data", "site-content.json");

// Em produção na Vercel o sistema de arquivos do projeto é somente leitura;
// apenas /tmp é gravável, e /tmp NÃO é persistente entre deploys/instâncias.
// Por isso, em produção (VERCEL=1) as edições feitas pelo /admin ficam
// valendo apenas enquanto aquela instância da função estiver "quente".
// Para persistência real em produção, troque este arquivo por uma leitura/
// escrita em um banco (Vercel KV, Postgres, Supabase, etc.) — ver README.
const RUNTIME_PATH = process.env.VERCEL
  ? path.join("/tmp", "site-content.runtime.json")
  : SEED_PATH;

function readJsonSafe(filePath: string): SiteContent | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch {
    return null;
  }
}

export function getSiteContent(): SiteContent {
  const runtime = process.env.VERCEL ? readJsonSafe(RUNTIME_PATH) : null;
  const seed = readJsonSafe(SEED_PATH);
  return (
    runtime ??
    seed ?? {
      contacts: {
        whatsappNumber: "",
        whatsappMessage: "",
        phone: "",
        email: "",
        instagramHandle: "",
        instagramUrl: "",
        address: "",
        areaServed: "",
      },
    }
  );
}

export function saveSiteContent(content: SiteContent): void {
  const dir = path.dirname(RUNTIME_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(RUNTIME_PATH, JSON.stringify(content, null, 2), "utf-8");
}

export function buildWhatsAppLink(contacts: SiteContacts): string | null {
  if (!contacts.whatsappNumber) return null;
  const digits = contacts.whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(contacts.whatsappMessage || "");
  return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`;
}
