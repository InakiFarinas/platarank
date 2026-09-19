import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos de uso",
  alternates: { canonical: "/es/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso" updated="19 de septiembre de 2026">
      <h2>Servicio informativo</h2>
      <p>
        PlataRank ofrece estimaciones de rentabilidad de crafteo basadas en datos de mercado aportados por la comunidad. Los precios pueden
        estar desactualizados, incompletos o ser erróneos. <strong>No garantizamos su exactitud</strong>: verificá siempre en el juego antes de
        invertir plata.
      </p>

      <h2>Sin afiliación</h2>
      <p>
        Albion Online es marca de Sandbox Interactive GmbH. Este sitio es un proyecto de fans, no está afiliado ni respaldado por Sandbox
        Interactive. Los datos de mercado provienen del Albion Online Data Project.
      </p>

      <h2>Uso aceptable</h2>
      <ul>
        <li>No intentes sobrecargar el servicio ni extraer datos de forma masiva.</li>
        <li>No uses el servicio para actividades ilegales o que violen las reglas del juego.</li>
      </ul>

      <h2>Cuentas</h2>
      <p>Podemos suspender cuentas que hagan un uso abusivo. Podés dejar de usar el servicio y pedir la eliminación de tus datos cuando quieras.</p>

      <h2>Responsabilidad</h2>
      <p>El servicio se ofrece &quot;tal cual&quot;. No somos responsables por pérdidas derivadas de decisiones tomadas con esta información.</p>

      <h2>Cambios</h2>
      <p>Podemos actualizar estos términos; la fecha de arriba indica la última revisión.</p>
    </LegalPage>
  );
}
