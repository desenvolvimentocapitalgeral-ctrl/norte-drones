import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getSiteStore } from "@/lib/blob-store";

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

// Mesmo padrão das imagens em lib/site-images.ts: o JSON de contatos é
// salvo no Netlify Blobs sempre na mesma chave (sobrescrevendo), então o
// Blob é a fonte da verdade em produção — sem precisar de banco de dados.
// Fora do Netlify (dev local), cai para o arquivo em disco
// (data/site-content.json), que persiste normalmente.
const CONTENT_PATHNAME = "site/content.json";

const DEFAULT_CONTENT: SiteContent = {
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
};

function readSeedFromDisk(): SiteContent | null {
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch {
    return null;
  }
}

async function readFromBlob(): Promise<SiteContent | null> {
  try {
    const store = getSiteStore();
    if (!store) return null;
    return (await store.get(CONTENT_PATHNAME, { type: "json" })) as SiteContent | null;
  } catch {
    return null;
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const fromBlob = await readFromBlob();
  return fromBlob ?? readSeedFromDisk() ?? DEFAULT_CONTENT;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const store = getSiteStore();
  if (store) {
    await store.setJSON(CONTENT_PATHNAME, content);
    return;
  }
  fs.writeFileSync(SEED_PATH, JSON.stringify(content, null, 2), "utf-8");
}

export function buildWhatsAppLink(contacts: SiteContacts): string | null {
  if (!contacts.whatsappNumber) return null;
  const digits = contacts.whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(contacts.whatsappMessage || "");
  return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`;
}
