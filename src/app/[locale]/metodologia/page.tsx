import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Metodología",
  description: "Cómo calcula PlataRank el costo, el retorno, los impuestos y la plata por día de cada receta.",
  alternates: { canonical: "/es/metodologia" },
};

export default function MetodologiaPage() {
  return (
    <LegalPage title="Metodología" updated="19 de septiembre de 2026">
      <h2>Fuentes de datos</h2>
      <ul>
        <li>
          <strong>Precios:</strong> Albion Online Data Project (servidor Américas), actualizados cada hora. Ciudades reales usan el precio de venta
          más bajo; el Black Market usa la oferta de compra más alta.
        </li>
        <li>
          <strong>Volumen:</strong> promedio diario de los últimos 30 días, del volcado diario del proyecto.
        </li>
        <li>
          <strong>Recetas:</strong> extraídas de los archivos oficiales del cliente (ao-bin-dumps).
        </li>
      </ul>

      <h2>Filtrado de precios</h2>
      <p>
        Los precios reportados por la comunidad pueden incluir anuncios falsos. Descartamos una cotización cuando está muy por encima del resto:
        al ingerir, si una venta de 100.000 o más supera 20 veces la mediana de las demás cotizaciones del ítem; al calcular, con 3 o más
        cotizaciones se recortan las que quedan por debajo de 0,4 o por encima de 2,5 veces la mediana. Los descartes se muestran en el detalle
        de cada fila.
      </p>

      <h2>Retorno de recursos</h2>
      <p>
        Retorno = 1 − 1 / (1 + bono). El bono suma 18 % base, +15 % si la ciudad tiene la especialidad de crafteo de esa categoría (+40 % en
        refinado) y +59 % con foco. Los artefactos nunca reciben retorno.
      </p>

      <h2>Tarifa de estación</h2>
      <p>
        Nutrición consumida = valor de ítem × 0,1125. Costo = (nutrición / 100) × tarifa de la estación (por defecto 235). El valor de ítem suma
        el valor de los materiales no artefacto según los datos del juego.
      </p>

      <h2>Impuestos de mercado</h2>
      <p>
        Se descuenta un impuesto de venta de 4 % con premium (8 % sin premium) más 2,5 % de tarifa de publicación. Estos porcentajes fueron verificados
        contra el juego.
      </p>

      <h2>Equipo y calidades</h2>
      <p>
        El precio de venta pondera las cinco calidades con los pesos base del juego, contando solo las que tienen liquidez real (volumen y días
        con ventas). No modelamos el efecto del foco, la comida ni el tablero del destino sobre la calidad, porque esa fórmula no es pública.
      </p>

      <h2>Plata por día</h2>
      <p>Ganancia por unidad × volumen diario × cuota de mercado asumida (10 % por defecto). Es una estimación, no una garantía.</p>

      <h2>Limitaciones conocidas</h2>
      <ul>
        <li>La calculadora todavía no modela diarios ni maestrías (el foco necesario se muestra sin reducción por maestría).</li>
        <li>Los datos dependen de que jugadores los suban al proyecto; ítems poco comerciados pueden tener precios viejos.</li>
      </ul>
    </LegalPage>
  );
}
