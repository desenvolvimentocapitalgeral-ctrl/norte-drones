/**
 * Salva um arquivo gerado no navegador. Em celular (principalmente iOS,
 * onde o atributo `download` do link é ignorado e só abre o arquivo numa
 * aba), usa a Web Share API pra abrir o menu "Salvar imagem/vídeo" nativo.
 * No desktop, ou quando o compartilhamento não está disponível, cai pro
 * download tradicional por link.
 */
export async function shareOrDownloadFile(blob: Blob, filename: string) {
  if (typeof navigator !== "undefined" && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // se o compartilhamento falhar por outro motivo, cai pro download normal
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
