import "server-only";
import { getStore } from "@netlify/blobs";

const TIMEOUT_MS = 5000;

// fetch com timeout: se o Blobs não responder, a operação falha rápido e o
// código cai nos arquivos de /public em vez de travar a página inteira.
const fetchWithTimeout: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });

// Armazenamento persistente do /admin (imagens e contatos) no Netlify Blobs.
// Só existe no ambiente Netlify (build/runtime injeta as credenciais); em dev
// local ou fora do Netlify, `getSiteStore()` devolve null e o código cai nos
// arquivos de /public e data/site-content.json.
export function getSiteStore() {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  try {
    return getStore({ name: "site", fetch: fetchWithTimeout });
  } catch {
    return null;
  }
}
