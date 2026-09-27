import Link from "next/link";
import { localePath } from "@/i18n/config";
import { DISCORD_URL } from "@/lib/seo";

export default function Es() {
  return (
    <>
      <p>
        PlataRank es una herramienta gratuita de la comunidad hispanohablante de Albion Online. Ordena las recetas de crafteo por la plata que dejan por
        día (ganancia por unidad × volumen de ventas), para que puedas decidir qué craftear con datos y no por intuición.
      </p>
      <h2>De dónde salen los datos</h2>
      <ul>
        <li>Precios y volúmenes: Albion Online Data Project, alimentado por jugadores, servidor Américas. Se actualizan cada hora.</li>
        <li>Recetas y valores de ítems: dump oficial del cliente del juego.</li>
        <li>
          Todas las fórmulas están explicadas en la <Link href={localePath("es", "methodology")}>metodología</Link>, incluidas sus limitaciones.
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
    </>
  );
}
