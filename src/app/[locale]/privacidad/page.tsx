import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/es/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="19 de septiembre de 2026">
      <p>PlataRank es una herramienta gratuita para calcular la rentabilidad de crafteo en Albion Online. Acá explicamos qué datos tratamos.</p>

      <h2>Datos que recibimos</h2>
      <p>
        <strong>Sin cuenta:</strong> podés usar los rankings y la calculadora sin registrarte. Los servidores pueden registrar datos técnicos
        estándar (dirección IP, navegador, páginas visitadas) para operar y proteger el servicio.
      </p>
      <p>
        <strong>Con cuenta de Discord:</strong> si elegís &quot;Entrar con Discord&quot;, recibimos de Discord tu identificador, nombre de usuario,
        avatar y correo electrónico. Los usamos solo para identificarte y mostrarte tu sesión. No accedemos a tus mensajes, servidores ni amigos.
      </p>
      <p>
        <strong>Planificaciones:</strong> los cálculos que guardes (ítem, cantidades, precios que edites y el resultado) se almacenan asociados a tu
        cuenta y solo vos podés verlos.
      </p>

      <h2>Cookies y almacenamiento</h2>
      <ul>
        <li>Cookies de sesión necesarias para mantenerte conectado si iniciás sesión.</li>
        <li>Preferencias locales del navegador (por ejemplo filtros y ciudad elegida).</li>
      </ul>
      <p>Si en el futuro se muestran anuncios de terceros, estos podrán usar cookies propias; en ese caso pediremos tu consentimiento donde corresponda.</p>

      <h2>Con quién compartimos datos</h2>
      <p>
        No vendemos tus datos. Usamos <strong>Supabase</strong> (autenticación y base de datos) y <strong>Discord</strong> (inicio de sesión) como
        proveedores, y el servicio de hosting donde se publica el sitio.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir el acceso o la eliminación de tu cuenta y tus planificaciones escribiendo a Discord: <strong>inaki261111</strong>. Podés
        borrar tus planificaciones en cualquier momento desde la calculadora.
      </p>
    </LegalPage>
  );
}
