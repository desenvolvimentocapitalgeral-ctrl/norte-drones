import "server-only";
import { getStore } from "@netlify/blobs";

// Armazenamento persistente do /admin (imagens e contatos) no Netlify Blobs.
// Só existe no ambiente Netlify (build/runtime injeta as credenciais); em dev
// local ou fora do Netlify, `getSiteStore()` devolve null e o código cai nos
// arquivos de /public e data/site-content.json.
export function getSiteStore() {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  try {
    return getStore({ name: "site", consistency: "strong" });
  } catch {
    return null;
  }
}
