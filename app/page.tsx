import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { WhyUs } from "@/components/WhyUs";
import { HowItWorks } from "@/components/HowItWorks";
import { ServiceArea } from "@/components/ServiceArea";
import { CtaSection } from "@/components/CtaSection";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { getSiteContent, buildWhatsAppLink } from "@/lib/content-store";
import { getSiteImages } from "@/lib/site-images";

// Renderizado dinamicamente para refletir imediatamente as alterações
// salvas no painel /admin (WhatsApp, telefone, e-mail, Instagram, imagens etc.).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { contacts } = getSiteContent();
  const whatsappLink = buildWhatsAppLink(contacts);
  const images = await getSiteImages();

  return (
    <>
      <Header whatsappLink={whatsappLink} logoUrl={images.logoLight} />
      <main>
        <Hero whatsappLink={whatsappLink} imageUrl={images.hero} />
        <About imageUrl={images.about} />
        <Services whatsappLink={whatsappLink} />
        <WhyUs />
        <HowItWorks />
        <ServiceArea />
        <CtaSection whatsappLink={whatsappLink} />
        <Contact />
      </main>
      <Footer logoUrl={images.logoDark} />
    </>
  );
}
