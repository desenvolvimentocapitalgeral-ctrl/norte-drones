import Image from "next/image";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";

export function About() {
  return (
    <section id="sobre" className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <SectionHeading
              eyebrow="Sobre a Norte Drones"
              title="Precisão no talhão, presença no campo."
            />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-nd-graphite/85 sm:text-lg">
              <p>
                A Norte Drones nasceu para levar a aplicação agrícola de
                precisão até o produtor rural do Tocantins. Trabalhamos com
                pulverização por drone, combinando planejamento de voo,
                controle de dose e acompanhamento técnico da operação.
              </p>
              <p>
                Nosso compromisso é com o resultado no campo: uniformidade na
                aplicação e uma equipe presente do primeiro contato até o
                retorno sobre o serviço realizado — sem enrolação, sem
                discurso de tecnologia por tecnologia.
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-card">
              <Image
                src="/images/drone-action.jpg"
                alt="Drone agrícola da Norte Drones em operação de pulverização"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
