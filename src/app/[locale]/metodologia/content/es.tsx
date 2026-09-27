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
        refinado) y +59 % con foco. Los artefactos nunca reciben retorno.
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

      <h2>Monturas criadas</h2>
      <p>
        En monturas podés elegir criar el animal base en vez de comprarlo crecido. En caballo y buey (T3 a T8) la cría tiene un precio fijo en el
        Mercader de granja (25.000 en T3, y se triplica por tier hasta 6.075.000 en T8). En ciervo gigante, alce, huargo, jabalí, oso, dragón de
        pantano y mamut la cría no tiene precio fijo, así que se cotiza en el mercado como cualquier material. A eso se suma el alimento: el
        cultivo o la carne más barata del día, por las unidades que hacen falta para que crezca (según los datos del juego). Quedan afuera el
        Draco Ala de Fuego y el Conejo primaveral, que no tienen un costo que podamos calcular con datos reales.
      </p>

      <h2>Plata por día</h2>
      <p>Ganancia por unidad × volumen diario × cuota de mercado asumida (10 % por defecto). Es una estimación, no una garantía.</p>

      <h2>Limitaciones conocidas</h2>
      <ul>
        <li>La calculadora todavía no modela diarios ni maestrías (el foco necesario se muestra sin reducción por maestría).</li>
        <li>El Black Market acepta calidades iguales o mayores a la pedida y no lo modelamos: solo contamos la calidad exacta.</li>
        <li>No modelamos el reroll de calidad ni los diarios.</li>
        <li>Los datos dependen de que jugadores los suban al proyecto; ítems poco comerciados pueden tener precios viejos.</li>
      </ul>
    </>
  );
}
