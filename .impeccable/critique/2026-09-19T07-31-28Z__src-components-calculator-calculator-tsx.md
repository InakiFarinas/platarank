---
target: calculadora
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\calculator\\calculator.tsx"
target_fingerprint: "sha256:95b4e5e785bc83b2a9ff2adf4937b116d90a99a06de818fb41213924f3a669d4"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\calculator\\calculator.tsx"
timestamp: 2026-09-19T07-31-28Z
slug: src-components-calculator-calculator-tsx
---
Method: DEGRADED single-context. Target: calculator (/es/calculadora). Score 26/40 (Acceptable).
Heuristics: 1=3, 2=3, 3=3, 4=3, 5=2, 6=3, 7=2, 8=3, 9=2, 10=2.
Detector: 1 advisory (10px off DESIGN.md type ramp, calculator.tsx:327).
P1: Ganancia stays gold/positive when materials or sell price are missing -> grey + "incompleta" (harden).
P1: Sell price derivation not shown (per-city quotes, age, discarded outliers) -> "De donde sale" disclosure (clarify).
P2: Conditions panel shows ~16 controls -> move fee/extra/quality to advanced (distill).
P2: Guardar and Agregar a sesion compete with the result -> single secondary save menu (layout).
P2: fetch failure leaves skeleton forever -> catch + retry (harden).
Personas: Alex (no keyboard nav in search), Sam (no listbox/radio arrow keys), Riley (edits lost on refresh), Casey (36px targets).
