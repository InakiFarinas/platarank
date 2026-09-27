import type { Faq } from "@/components/json-ld";
import { recipeCount } from "@/lib/seo";
import type { StationType } from "@/lib/server/station-data";

type StationSeo = {
  path: string;
  name: string;
  /** Page <title> (the site name is appended by the root template). */
  title: string;
  subject: string;
  intro: string;
  extraFaq: Faq;
};

export const STATION_SEO: Record<StationType, StationSeo> = {
  alchemy: {
    path: "alquimia",
    name: "Alquimia",
    title: "Ranking de alquimia de Albion Online: pociones",
    subject: "pociones",
    intro:
      "La alquimia convierte hierbas, huevos y materiales de animales en pociones. Este ranking ordena cada poción por la plata que deja por día, no por su margen unitario.",
    extraFaq: {
      q: "¿Qué pociones conviene craftear en Albion Online?",
      a: "Las que más plata por día dejan: las de margen razonable que además se venden todos los días. El ranking se actualiza cada hora y la primera fila es la mejor opción con los supuestos que elijas.",
    },
  },
  refining: {
    path: "refinado",
    name: "Refinado",
    title: "Ranking de refinado de Albion Online: tablas, lingotes, tela y cuero",
    subject: "materiales refinados",
    intro:
      "El refinado transforma recursos crudos (madera, mineral, fibra, pieles y piedra) en tablas, lingotes, tela, cuero y bloques. Es la categoría donde más pesa el retorno de recursos de cada ciudad.",
    extraFaq: {
      q: "¿Qué ciudad da más retorno al refinar?",
      a: "Cada ciudad tiene un bono de refinado para un recurso específico, que sube el retorno de recursos. El ranking marca el bono de cada ciudad para que compares con el mismo criterio.",
    },
  },
  cooking: {
    path: "cocina",
    name: "Cocina",
    title: "Ranking de cocina de Albion Online: comidas",
    subject: "comidas",
    intro:
      "La cocina prepara comidas que restauran vida y energía, y son de las recetas con más rotación diaria del mercado. Acá ves cuáles convienen según precio, volumen y retorno.",
    extraFaq: {
      q: "¿Cocinar es rentable en Albion Online?",
      a: "Depende de la comida y del momento. Las de mucha rotación pueden dejar más plata por día que otras con margen mayor, y los precios cambian con el consumo del servidor. Por eso el ranking usa datos de las últimas horas.",
    },
  },
  gear: {
    path: "equipo",
    name: "Equipo",
    title: "Ranking de equipo de Albion Online: armas y armaduras",
    subject: "armas, armaduras, bolsas y capas",
    intro:
      "El equipo tiene calidades de Normal a Obra maestra, y cada una se vende a un precio distinto. El ranking pondera las cinco calidades por el peso base del juego y descarta las que no tienen liquidez real.",
    extraFaq: {
      q: "¿Cómo se calcula el precio de venta del equipo?",
      a: "Se pondera el precio de cada calidad según la probabilidad base de obtenerla al craftear, y se descartan las calidades sin ventas recientes. Así el número refleja lo que realmente podés vender.",
    },
  },
  mount: {
    path: "monturas",
    name: "Monturas",
    title: "Ranking de monturas de Albion Online",
    subject: "monturas",
    intro:
      "Craftear una montura requiere un animal adulto más materiales. Ninguna ciudad da bono de crafteo a las monturas, así que el ranking compara solo costo, precio de venta y volumen.",
    extraFaq: {
      q: "¿Conviene craftear monturas en Albion Online?",
      a: "Sirve cuando el precio de venta cubre el animal adulto y los materiales con margen, y la montura se vende seguido. Las monturas de mucho valor venden poco por día, así que el volumen pesa mucho en el ranking.",
    },
  },
};

export function stationDescription(type: StationType): string {
  const s = STATION_SEO[type];
  return `Ranking de ${s.subject} de Albion Online por plata realizable por día (ganancia × volumen de ventas). ${recipeCount(type).toLocaleString("es-AR")} recetas, servidor Américas, actualizado cada hora.`;
}

export function stationFaqs(type: StationType): Faq[] {
  const s = STATION_SEO[type];
  return [
    {
      q: "¿Qué es la plata por día?",
      a: "Es la ganancia por unidad multiplicada por el volumen diario de ventas y por la cuota de mercado que asumas. Una receta con margen alto que casi no se vende rinde menos que una de margen chico que se vende todo el día.",
    },
    s.extraFaq,
    {
      q: "¿De dónde salen los precios y las recetas?",
      a: "Los precios vienen del Albion Online Data Project (servidor Américas) y las recetas del dump oficial del cliente. Los precios se actualizan cada hora y la metodología completa está publicada.",
    },
  ];
}
