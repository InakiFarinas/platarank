export default function Es() {
  return (
    <>
      <h2>Fuentes de datos</h2>
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
        refinado) y +59 % con foco. Los artefactos nunca reciben retorno, y tampoco lo que la propia receta del juego marca como no retornable: el
        animal crecido de una montura o las fichas de Avalon.
      </p>

      <h2>Escondites e islas</h2>
      <p>
        En la calculadora podés elegir craftear en un escondite o en una isla en vez de una ciudad. En un escondite no hay 18% base: la
        fabricación suma el bono general del nivel de poder (0 % en nivel 1 hasta 26 % en nivel 9) y, si el ítem es especialidad del
        escondite, además el bono de la calidad de la zona (1 % en Q1 hasta 26 % en Q6) y el bono de especialista del nivel de poder (hasta 30
        %). Las especialidades de cada bioma son las mismas cinco que su ciudad (pantano = Thetford, bosque = Lymhurst, estepa = Bridgewatch,
        tierras altas = Martlock, montaña = Fort Sterling). En los caminos de Avalon cada camino tiene las suyas, así que se indica a mano. El
        refinado en un escondite tiene un bono fijo, 15 % en zona negra y 10 % en caminos (+10 % en el recurso del camino), que el nivel de poder
        no cambia. Las islas no tienen bono: solo suma el foco. Los valores salen del volcado del juego (hideouts.xml y craftingmodifiers.xml) y
        coinciden con la wiki oficial y las notas de parche; que la cocina y la alquimia reciben el bono general del nivel de poder lo asumimos
        porque en las ciudades el mismo bono de fabricación las cubre, pero no lo verificamos en el juego.
      </p>

      <h2>Tarifa de estación</h2>
      <p>
        Nutrición consumida = valor de ítem × 0,1125. Costo = (nutrición / 100) × tarifa de la estación (por defecto 500, editable). El valor de ítem suma
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

      <h2>Diarios de trabajador</h2>
      <p>
        Craftear equipo llena diarios de trabajador: placas, espadas, hachas, mazas, martillos, ballestas y guanteletes llenan el de herrero;
        cuero, arcos, dagas, lanzas, bastones de combate, naturales y cambiaformas, el de flechero; tela y bastones de fuego, hielo, arcano,
        sagrado y maldición, el de imbuidor; herramientas, capas, bolsas y equipo de recolección, el de hojalatero. El diario
        tiene que ser del mismo tier que el ítem. Por defecto sumamos esa ganancia: comprás el diario vacío en la ciudad más barata, lo llenás y
        lo vendés lleno al precio de referencia, con el mismo impuesto que el ítem. La fama de un craft es la cantidad de recursos refinados de la
        receta × la fama por recurso del tier (22,5 en T4, 90 en T5, 270 en T6, 645 en T7, 1.395 en T8; se duplica con cada encantamiento) × el
        factor propio del ítem en los artefactos (1,1 a 1,4). Los artefactos no suman fama, el bono de premium no llena diarios, y el foco y la
        calidad no cambian la fama. Qué ítem llena qué diario y cuánta fama entra en cada uno salen del volcado del juego. Refinado, alquimia y
        cocina no llenan ningún diario.
      </p>

      <h2>Foco y especialización</h2>
      <p>
        El foco de un craft es su foco base × 0,5 elevado a (eficiencia / 10.000): cada 10.000 de eficiencia de coste de foco lo reduce a
        la mitad. La eficiencia sale de tu tablero del destino: cada nivel de maestría suma 30 a toda su categoría, cada nivel de la
        especialización de un ítem le suma 250 a ese ítem, y las demás especializaciones de la categoría suman entre 11,25 y 30 por nivel
        (según el nodo; las de cristal, unos 2 a todo el árbol). En refinado, cada tier es un nodo: 250 a su tier y 30 a todos los tiers de
        ese recurso. Los valores por nivel y a qué ítems aplican salen del volcado del juego (tablero del destino), y el resultado coincide
        con lo que cobra el juego. El foco base del juego es por unidad producida: un craft de 5 pociones cuesta 5 veces el foco de una. El juego redondea el total del pedido, no cada craft. Las monturas no tienen nodos que bajen el foco.
      </p>

      <h2>Monturas criadas</h2>
      <p>
        En monturas podés elegir criar el animal base en vez de comprarlo crecido. En caballo y buey (T3 a T8) la cría tiene un precio fijo en el
        Mercader de granja (25.000 en T3, y se triplica por tier hasta 6.075.000 en T8). En ciervo gigante, alce, huargo, jabalí, oso, dragón de
        pantano y mamut la cría no tiene precio fijo, así que se cotiza en el mercado como cualquier material. A eso se suma el alimento: el
        cultivo o la carne más barata del día, por las unidades que hacen falta para que crezca (según los datos del juego). Caballo y buey,
        al crecer, te devuelven una cría nueva con una probabilidad de 78 a 87 % según el tier, así que la cría cuenta solo por la parte que no
        vuelve (en T4, 75.000 × 21 % ≈ 16.000); las demás familias no devuelven crías. Criar tarda de 44 h (T3) a 284 h (T8), y la plata por
        día no descuenta esa espera. Cuidar al animal con foco sube la probabilidad de cría, pero no lo modelamos porque no lo verificamos en el
        juego. Quedan afuera el Draco Ala de Fuego y el Conejo primaveral, que no tienen un costo que podamos calcular con datos reales.
      </p>

      <h2>Plata por día</h2>
      <p>Ganancia por unidad × volumen diario × cuota de mercado asumida (10 % por defecto). Es una estimación, no una garantía.</p>

      <h2>Limitaciones conocidas</h2>
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
