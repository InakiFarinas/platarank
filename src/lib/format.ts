/** Whole number with es-AR thousands separators (the app's one integer format). */
export const formatInt = (n: number) => Math.round(n).toLocaleString("es-AR");
