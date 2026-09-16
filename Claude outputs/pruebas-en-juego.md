# Pruebas en el juego — cerrar los supuestos del calculador

Casi todo se lee **sin craftear**: parate en la estación, seleccioná la receta, y anotá el fee
que te muestra antes de confirmar. No gastás plata ni materiales.

**La idea central: son tests de ratio.** No compares contra un número que yo calculé — comparás
dos lecturas tuyas en la misma estación y mirás el cociente. Así la tarifa de la estación se
cancela sola y no importa si es 235, 400 u 800. Si el ratio da lo predicho, la fórmula es
correcta. Si no da, está mal y lo sabés ahí mismo.

Están ordenadas por cuánto rompen si están mal. Si tenés poco tiempo, hacé los bloques 1 a 3.

---

## Bloque 1 — Alquimia (~10 min, una sola estación)

Cualquier estación de alquimia sirve. Anotá la tarifa por 100 de nutrición una vez, y después
solo los fees.

| # | Qué comparar | Predicción | Qué prueba |
|---|---|---|---|
| 1.1 | Curación T4 **.0** vs **.1** vs **.2** | **fee idéntico** en las tres | Que el fee de alquimia NO depende del encantamiento |
| 1.2 | Dos pociones del mismo tier con **distinta cantidad** de materiales de granja | fee proporcional a la cantidad | Que escala lineal con materiales, no con tier |
| 1.3 | Resistencia T5 (42 mat. de granja) vs Curación T4 (30 mat.) | ratio **42/30 = 1,40** | Lo mismo, con números concretos |
| 1.4 | Ácido T5 (lleva artefacto) vs una receta sin artefacto de igual cantidad de granja | **fee idéntico** | Que los artefactos pagan 0 |

La 1.1 es la más valiosa de todas: es contraintuitiva (todo el mundo asume que encantar sale
más caro) y si se cumple, la fórmula de alquimia queda cerrada.

**Anotá 3 de estas como casos de oro**, con la tarifa de la estación y el fee exacto.

---

## Bloque 2 — Cocina, el bug de la carne (~5 min, misma ciudad)

Este bloque existe por un solo motivo: hoy el código multiplica la carne por 900 en vez de 45.

| # | Qué comparar | Predicción | Qué prueba |
|---|---|---|---|
| 2.1 | Una receta **con carne** vs una **sin carne**, con la misma cantidad total de materiales | **fee idéntico** | Que la carne vale 45 como cualquier material de granja |

Si el fee de la que lleva carne te da ~20 veces más alto, entonces el 900 estaba bien y el
que se equivocó fui yo. Cualquiera de los dos resultados cierra la pregunta.

**Este es caso de oro obligatorio.**

---

## Bloque 3 — Equipo: armas y armaduras (~15 min)

La fórmula es otra y tiene más partes móviles. Necesitás una forja o torre.

| # | Qué comparar | Predicción | Qué prueba |
|---|---|---|---|
| 3.1 | El mismo ítem en **T4 vs T5** | fee **×2** exacto | El `2^(tier−4)` |
| 3.2 | El mismo ítem **.0 vs .1** | fee **×2** exacto | El `2^ench` |
| 3.3 | Botas T4 (8 mat.) vs arma a dos manos T4 (32 mat.) | ratio **4,00** | Que escala con unidades de material |
| 3.4 | **Ítem rúnico vs ítem plano**, mismo tier y misma cantidad de materiales | ratio **1,25** exacto | El multiplicador de artefacto |
| 3.5 | Ídem con **alma** / **reliquia** / **avaloniano** | **1,75** / **2,75** / **4,75** | Los otros tiers de artefacto |

**La 3.4 mata dos pájaros.** Si el ratio da exactamente 1,25, confirma el multiplicador rúnico
*y* confirma que la cuenta de materiales excluye al artefacto. Si da 1,289 (que es
1,25 × 33/32), entonces el artefacto sí cuenta como material y hay que sumarlo. Cualquiera de
los dos números te dice algo distinto y preciso.

**Anotá 3.1, 3.2 y 3.4 como casos de oro.**

---

## Bloque 4 — Refinado (~5 min)

| # | Qué comparar | Predicción | Qué prueba |
|---|---|---|---|
| 4.1 | Tablones T4 vs T5 vs T6 | fee **×2** en cada salto | El `2^(tier−4)` |
| 4.2 | Refinar **1 vs 10** unidades | fee por unidad **idéntico**, y no depende de la cantidad de materiales | Que refinado no escala con materiales como el crafteo |

---

## Bloque 5 — Return rate (~10 min, necesita dos ciudades)

Acá leés el **porcentaje de retorno** que muestra la estación, no el fee.

| # | Qué leer | Predicción | Qué prueba |
|---|---|---|---|
| 5.1 | Una poción en **Brecilien** vs en cualquier ciudad real | **24,8 %** vs **15,2 %** | La especialidad de crafteo |
| 5.2 | La misma poción en Brecilien **con foco activado** | **47,9 %** | El bonus de foco (0,59) |
| 5.3 | Refinar el recurso especialista de la ciudad (madera en Fort Sterling, mena en Thetford…) | **36,7 %** | La especialidad de refinado (0,40) |
| 5.4 | **Capa plana vs capa de facción**, las dos en Brecilien | **24,8 %** vs **15,2 %** | La trampa de las capas — que las de facción no tienen `craftingcategory` |

La 5.4 es barata y te confirma de una la decisión de diseño más sutil de todo el rubro.

---

## Bloque 6 — Impuestos de mercado (~5 min)

| # | Qué hacer | Predicción | Qué prueba |
|---|---|---|---|
| 6.1 | Poné una orden de venta y mirá el costo de setup que te cobra | **2,5 %** del valor listado | El setup fee |
| 6.2 | Vendé algo contra una orden de compra existente y compará lo listado con lo recibido | **4 %** con premium, **8 %** sin | El impuesto de venta, y que el setup NO aplica acá |

Si tenés premium, hacé 6.2 igual: te confirma el 4 % y de paso que el setup no se cobra al
matchear.

---

## Bloque 7 — Black Market y calidad (~5 min)

| # | Qué hacer | Qué buscás |
|---|---|---|
| 7.1 | Mirá una orden de compra del BM que pida **calidad 1** y fijate si te deja llenarla con un ítem de calidad superior | Confirmar que el BM acepta igual **o mejor** |
| 7.2 | Anotá si el BM muestra órdenes de **venta** o solo de compra | Confirmar que solo hay compra |

---

## Bloque 8 — Costo de reroll (~5 min)

El costo en plata del reroll no está en los dumps. Andá a una estación de reparación y anotá:

| Ítem | Tier | Ench | Calidad actual | Costo del reroll |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

Tomá 3 o 4 combinaciones variando tier y calidad. Con eso se ve si escala como el resto
(potencias de 2 por tier) o es otra cosa.

---

## Bloque 9 — Los dos caros (opcionales, cuestan materiales)

**9.1 — ¿Vuelven los artefactos?** Es el flag que hoy está en "sí" sin confirmar. Crafteá ~20
ítems de artefacto baratos (T4) y contá cuántos artefactos te devolvió. Si vuelven, esperás
~5 de 20. Si no vuelven, 0. Con 20 crafteos la diferencia es inconfundible.

**9.2 — Calibrar calidad.** La función que convierte tus bonus en probabilidades no está
publicada en ningún lado, así que la única vía es medirla vos. Crafteá **al menos 100 unidades
del mismo ítem** con tu setup habitual (tu foco, tu comida, tu especialización) y anotá cuántas
salieron de cada calidad. Esas son las tasas que después cargás en la página.

Antes de gastar nada: fijate si la estación te muestra las probabilidades de calidad en pantalla.
Si las muestra, te ahorrás los 100 crafteos.

Guardá el resultado junto con **qué comida usaste y qué nivel de especialización tenías**, porque
esas tasas solo valen para ese setup.

---

## Qué anotar para cada caso de oro

Para que entre directo en `fixtures/golden-cases.json`:

```json
{
  "receta": "T6_POTION_HEAL@1",
  "estacion": "Alquimia Brecilien",
  "tarifa_por_100_nutricion": 235,
  "foco": false,
  "fee_esperado_por_lote": 0,
  "retorno_esperado_pct": 0,
  "fuente": "captura en juego 2026-09-XX"
}
```

Sacale captura a cada pantalla. Cuando alguien discuta un número en Reddit, la captura fechada
es la respuesta — y es exactamente el material que va en `/metodologia`.

---

## Resumen de prioridad

1. **2.1** — el bug de la carne. Es el único error confirmado.
2. **3.4** — el multiplicador de artefacto. Hoy está hardcodeado en 0 y afecta a todo el equipo de artefacto.
3. **1.1** — independencia del encantamiento en alquimia. Cierra el rubro que ya tenés funcionando.
4. **5.4** — la trampa de las capas.
5. El resto, cuando tengas ganas.
