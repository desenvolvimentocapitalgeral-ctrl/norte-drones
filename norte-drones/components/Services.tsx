import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";
import { services } from "@/lib/site-data";
import { WhatsAppButton } from "./WhatsAppButton";

export function Services({ whatsappLink }: { whatsappLink: string | null }) {
  return (
    <section id="servicos" className="bg-nd-mist py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="O que fazemos"
          title="Serviços"
          description="Atualmente a Norte Drones atua com a aplicação abaixo. Novos serviços entram aqui assim que forem confirmados."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.slug}
              className="flex flex-col rounded-2xl bg-white p-8 shadow-card ring-1 ring-black/5"
            >
              <ServiceIcon />
              <h3 className="mt-6 text-xl font-bold text-nd-green-dark">
                {service.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-nd-graphite/80">
                {service.description}
              </p>
              <p className="mt-4 border-t border-nd-graphite/10 pt-4 text-sm font-medium text-nd-green">
                {service.benefit}
              </p>
            </div>
          ))}

          <div className="flex flex-col items-start justify-center rounded-2xl border-2 border-dashed border-nd-graphite/20 p-8 text-nd-graphite/60">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Espaço reservado
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Novos serviços (ex.: mapeamento aéreo, monitoramento) podem ser
              adicionados aqui assim que forem confirmados — edite{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5">
                lib/site-data.ts
              </code>
              .
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <WhatsAppButton
            whatsappLink={whatsappLink}
            label="Solicitar orçamento para meu talhão"
          />
        </div>
      </Container>
    </section>
  );
}

function ServiceIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nd-green-dark/10">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-nd-green-dark">
        <path d="M12 2 3 6v6c0 5 3.8 9.3 9 10 5.2-.7 9-5 9-10V6l-9-4zm0 2.2 7 3.1v4.7c0 4-2.9 7.6-7 8.5-4.1-.9-7-4.5-7-8.5V7.3l7-3.1zM11 7h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    </div>
  );
}
