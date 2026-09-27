import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { DISCORD_URL, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Acerca de",
  description: "Qué es PlataRank, de dónde salen sus datos, cómo contactarnos y por qué no es una herramienta oficial de Albion Online.",
  path: "/es/acerca",
});

export default function AcercaPage() {
  return (
    <LegalPage title="Acerca de PlataRank" updated="27 de septiembre de 2026">
      <p>
        PlataRank es una herramienta gratuita de la comunidad hispanohablante de Albion Online. Ordena las recetas de crafteo por la plata que dejan por
        día (ganancia por unidad × volumen de ventas), para que puedas decidir qué craftear con datos y no por intuición.
      </p>
      <h2>De dónde salen los datos</h2>
      <ul>
        <li>Precios y volúmenes: Albion Online Data Project, alimentado por jugadores, servidor Américas. Se actualizan cada hora.</li>
        <li>Recetas y valores de ítems: dump oficial del cliente del juego.</li>
        <li>
          Todas las fórmulas están explicadas en la <Link href="/es/metodologia">metodología</Link>, incluidas sus limitaciones.
        </li>
      </ul>
      <h2>Contacto</h2>
      <p>
        La forma más rápida de reportar un error o proponer una mejora es el{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
          Discord de la comunidad
        </a>
        .
      </p>
      <h2>Sin afiliación</h2>
      <p>PlataRank no está afiliada a Sandbox Interactive ni a Albion Online. Es un uso no oficial y con fines informativos.</p>
    </LegalPage>
  );
}
