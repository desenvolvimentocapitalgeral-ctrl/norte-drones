import Image from "next/image";
import { Container } from "./Container";
import { getSiteContent } from "@/lib/content-store";

export function Footer() {
  const { contacts } = getSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-nd-graphite py-12 text-white/70">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="Norte Drones"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
          />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="#sobre" className="hover:text-white">Sobre</a>
            <a href="#servicos" className="hover:text-white">Serviços</a>
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
            <a href="#contato" className="hover:text-white">Contato</a>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Norte Drones. {contacts.areaServed || "Tocantins"}.
          </p>
          <p className="text-white/50">
            Aplicação agrícola de precisão com drones.
          </p>
        </div>
      </Container>
    </footer>
  );
}
