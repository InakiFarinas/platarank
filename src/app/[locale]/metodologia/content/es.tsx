const SECTIONS = [
  ["fuentes", "Fuentes de datos"],
  ["filtrado", "Filtrado de precios"],
  ["retorno", "Retorno de recursos"],
  ["escondites", "Escondites"],
  ["tarifa", "Tarifa de estación"],
  ["impuestos", "Impuestos de mercado"],
  ["calidades", "Equipo y calidades"],
  ["diarios", "Diarios de trabajador"],
  ["foco", "Foco y especialización"],
  ["monturas", "Monturas criadas"],
  ["plata", "Plata por día"],
  ["limitaciones", "Limitaciones conocidas"],
] as const;

export default function Es() {
  return (
    <>
      <nav aria-label="Secciones de esta página" className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SECTIONS.map(([id, label], i) => (
          <span key={id}>
            <a href={`#${id}`}>{label}</a>
            {i < SECTIONS.length - 1 && <span className="text-muted-foreground"> ·</span>}
          </span>
        ))}
      </nav>

      <p className="rounded-md border border-dashed border-border bg-card/40 px-3 py-2.5 text-sm">
        Esta metodología también dice lo que <strong>no</strong> sabemos -- ver{" "}
        <a href="#limitaciones">Limitaciones conocidas</a> antes de confiar un número a ciegas.
      </p>

      <h2 id="fuentes">Fuentes de datos</h2>
      <ul>
        <li>
          <strong>Precios:</strong> Albion Online Data Project (servidor Américas), actualizados cada hora. Ciudades reales usan el precio de venta
          más bajo; el Black Market (solo en armas y armaduras) usa la oferta de compra más alta.
        </li>
        <li>
          <strong>Volumen:</strong> promedio diario de los últimos 30 días, del volcado diario del proyecto.
        </li>
        <li>
          <strong>Recetas:</strong> extraídas de los archivos oficiales del cliente (ao-bin-dumps).
        </li>
      </ul>

      <h2 id="filtrado">Filtrado de precios</h2>
      <p>
        Los precios reportados por la comunidad pueden incluir anuncios falsos. Descartamos una cotización cuando está muy por encima del resto:
        al ingerir, si una venta de 100.000 o más supera 20 veces la mediana de las demás cotizaciones del ítem; al calcular, con 3 o más
        cotizaciones se recortan las que quedan por debajo de 0,4 o por encima de 2,5 veces la mediana. Los descartes se muestran en el detalle
        de cada fila.
      </p>

      <h2 id="retorno">Retorno de recursos</h2>
      <p>
        <code>Retorno = 1 − 1 / (1 + bono)</code>. El bono suma 18 % base, +15 % si la ciudad tiene la especialidad de crafteo de esa categoría (+40 % en
        refinado) y +59 % con foco. Los artefactos nunca reciben retorno, y tampoco lo que la propia receta del juego marca como no retornable: el
        animal crecido de una montura o las fichas de Avalon.
      </p>

      <h2 id="escondites">Escondites</h2>
      <p>
        En la calculadora y en los rankings podés elegir craftear en un escondite en vez de una ciudad. En un escondite no hay 18% base:
      </p>
      <ul>
        <li>
          La fabricación suma el bono general del <strong>nivel de poder</strong> (0 % en nivel 1 hasta 26 % en nivel 9).
        </li>
        <li>
          Si el ítem es especialidad del escondite, suma además el bono de la <strong>calidad de la zona</strong> (1 % en Q1 hasta 26 % en Q6) y el
          bono de <strong>especialista del nivel de poder</strong> (hasta 30 %).
        </li>
        <li>
          Las especialidades de cada bioma son las mismas cinco que su ciudad (pantano = Thetford, bosque = Lymhurst, estepa = Bridgewatch,
          tierras altas = Martlock, montaña = Fort Sterling). En los caminos de Avalon cada camino tiene las suyas, así que se indica a mano en
          la calculadora; el ranking no las suma.
        </li>
        <li>
          El refinado en un escondite tiene un bono fijo, 15 % en zona negra y 10 % en caminos (+10 % en el recurso del camino), que el nivel de
          poder no cambia.
        </li>
      </ul>
      <p>
        Los valores salen del volcado del juego (hideouts.xml y craftingmodifiers.xml) y coinciden con la wiki oficial y las notas de parche; que
        la cocina y la alquimia reciben el bono general del nivel de poder lo asumimos porque en las ciudades el mismo bono de fabricación las
        cubre, pero no lo verificamos en el juego.
      </p>

      <h2 id="tarifa">Tarifa de estación</h2>
      <p>
        <code>Nutrición consumida = valor de ítem × 0,1125</code>. <code>Costo = (nutrición / 100) × tarifa de la estación</code> (por defecto 500,
        editable). El valor de ítem suma el valor de los materiales no artefacto según los datos del juego.
      </p>

      <h2 id="impuestos">Impuestos de mercado</h2>
      <p>
        Se descuenta un impuesto de venta de 4 % con premium (8 % sin premium) más 2,5 % de tarifa de publicación. Estos porcentajes fueron verificados
        contra el juego.
      </p>

      <h2 id="calidades">Equipo y calidades</h2>
      <p>
        El precio de venta pondera las cinco calidades con los pesos base del juego, contando solo las que tienen liquidez real (volumen y días
        con ventas). No modelamos el efecto del foco, la comida ni el tablero del destino sobre la calidad, porque esa fórmula no es pública.
      </p>

      <h2 id="diarios">Diarios de trabajador</h2>
      <p>Craftear equipo llena diarios de trabajador, uno por familia de ítem:</p>
      <ul>
        <li>
          <strong>Herrero:</strong> placas, espadas, hachas, mazas, martillos, ballestas y guanteletes.
        </li>
        <li>
          <strong>Flechero:</strong> cuero, arcos, dagas, lanzas, bastones de combate, naturales y cambiaformas.
        </li>
        <li>
          <strong>Imbuidor:</strong> tela y bastones de fuego, hielo, arcano, sagrado y maldición.
        </li>
        <li>
          <strong>Hojalatero:</strong> herramientas, capas, bolsas y equipo de recolección.
        </li>
      </ul>
      <p>
        El diario tiene que ser del mismo tier que el ítem. Por defecto sumamos esa ganancia: comprás el diario vacío en la ciudad más barata, lo
        llenás y lo vendés lleno al precio de referencia, con el mismo impuesto que el ítem. La fama de un craft es{" "}
        <code>recursos refinados de la receta × fama por recurso del tier</code> (22,5 en T4, 90 en T5, 270 en T6, 645 en T7, 1.395 en T8; se
        duplica con cada encantamiento) <code>× factor propio del ítem en los artefactos</code> (1,1 a 1,4). Los artefactos no suman fama, el
        bono de premium no llena diarios, y el foco y la calidad no cambian la fama. Qué ítem llena qué diario y cuánta fama entra en cada uno
        salen del volcado del juego. Refinado, alquimia y cocina no llenan ningún diario.
      </p>

      <h2 id="foco">Foco y especialización</h2>
      <p>
        <code>Foco de un craft = foco base × 0,5 ^ (eficiencia / 10.000)</code>: cada 10.000 de eficiencia de coste de foco lo reduce a la
        mitad. La eficiencia sale de tu tablero del destino: cada nivel de maestría suma 30 a toda su categoría, cada nivel de la
        especialización de un ítem le suma 250 a ese ítem, y las demás especializaciones de la categoría suman entre 11,25 y 30 por nivel
        (según el nodo; las de cristal, unos 2 a todo el árbol). En refinado, cada tier es un nodo: 250 a su tier y 30 a todos los tiers de
        ese recurso. Los valores por nivel y a qué ítems aplican salen del volcado del juego (tablero del destino), y el resultado coincide
        con lo que cobra el juego. El foco base del juego es por unidad producida: un craft de 5 pociones cuesta 5 veces el foco de una. El
        juego redondea el total del pedido, no cada craft. Las monturas no tienen nodos que bajen el foco.
      </p>

      <h2 id="monturas">Monturas criadas</h2>
      <p>En monturas podés elegir criar el animal base en vez de comprarlo crecido:</p>
      <ul>
        <li>
          <strong>Caballo y buey (T3 a T8):</strong> la cría tiene un precio fijo en el Mercader de granja (25.000 en T3, se triplica por tier
          hasta 6.075.000 en T8).
        </li>
        <li>
          <strong>Ciervo gigante, alce, huargo, jabalí, oso, dragón de pantano y mamut:</strong> la cría no tiene precio fijo, así que se cotiza
          en el mercado como cualquier material.
        </li>
        <li>
          A eso se suma el alimento: el cultivo o la carne más barata del día, por las unidades que hacen falta para que crezca (según los datos
          del juego).
        </li>
        <li>
          Caballo y buey, al crecer, te devuelven una cría nueva con una probabilidad de 78 a 87 % según el tier, así que la cría cuenta solo por
          la parte que no vuelve (en T4, 75.000 × 21 % ≈ 16.000); las demás familias no devuelven crías.
        </li>
      </ul>
      <p>
        Criar tarda de 44 h (T3) a 284 h (T8), y la plata por día no descuenta esa espera. Cuidar al animal con foco sube la probabilidad de
        cría, pero no lo modelamos porque no lo verificamos en el juego. Quedan afuera el Draco Ala de Fuego y el Conejo primaveral, que no
        tienen un costo que podamos calcular con datos reales.
      </p>

      <h2 id="plata">Plata por día</h2>
      <p>
        <code>Ganancia por unidad × volumen diario × cuota de mercado asumida</code> (10 % por defecto). Es una estimación, no una garantía.
      </p>

      <h2 id="limitaciones">Limitaciones conocidas</h2>
      <ul>
        <li>El foco con tu especialización se calcula en la calculadora, pero el ranking todavía no ordena por plata por punto de foco.</li>
        <li>El Black Market acepta calidades iguales o mayores a la pedida y no lo modelamos: solo contamos la calidad exacta.</li>
        <li>No modelamos el reroll de calidad.</li>
        <li>El volumen de venta de los diarios llenos no limita la plata/día: asumimos que se venden al ritmo del ítem.</li>
        <li>Los datos dependen de que jugadores los suban al proyecto; ítems poco comerciados pueden tener precios viejos.</li>
      </ul>
    </>
  );
}
