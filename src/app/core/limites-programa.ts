/**
 * Límites del programa que antes estaban fijos en el código y ahora se administran en Reglas: cuántas unidades de un producto se
 * pueden canjear de una vez, cuántos pasajeros admite una cotización de vuelo y los plazos de respuesta y de validez de una
 * cotización. Funciones puras: las usan el panel, el sitio, el servidor simulado y se describen en docs/openapi.yaml para la app.
 */
export interface LimitesPrograma {
  /** Máximo de unidades de un mismo producto en un canje. */
  maxPorLinea: number;
  /** Máximo de pasajeros en una cotización de vuelo. */
  maxPasajeros: number;
  /** Horas en que una ejecutiva responde una cotización. */
  cotizacionRespuestaHoras: number;
  /** Horas que vale una cotización desde que se envía. */
  cotizacionValidezHoras: number;
}

export const LIMITES_POR_DEFECTO: LimitesPrograma = { maxPorLinea: 5, maxPasajeros: 9, cotizacionRespuestaHoras: 48, cotizacionValidezHoras: 72 };

const entero = (v: unknown, defecto: number) => (typeof v === "number" && Number.isFinite(v) ? v : defecto);

/** Los límites de unas reglas; lo que falte (reglas guardadas antes de este cambio) toma el valor por defecto. */
export function limitesDe(reglas: Partial<LimitesPrograma> | null | undefined): LimitesPrograma {
  return {
    maxPorLinea: entero(reglas?.maxPorLinea, LIMITES_POR_DEFECTO.maxPorLinea),
    maxPasajeros: entero(reglas?.maxPasajeros, LIMITES_POR_DEFECTO.maxPasajeros),
    cotizacionRespuestaHoras: entero(reglas?.cotizacionRespuestaHoras, LIMITES_POR_DEFECTO.cotizacionRespuestaHoras),
    cotizacionValidezHoras: entero(reglas?.cotizacionValidezHoras, LIMITES_POR_DEFECTO.cotizacionValidezHoras),
  };
}

const RANGOS: { k: keyof LimitesPrograma; etiqueta: string; min: number; max: number; unidad: string }[] = [
  { k: "maxPorLinea", etiqueta: "El máximo de unidades por producto", min: 1, max: 99, unidad: "unidades" },
  { k: "maxPasajeros", etiqueta: "El máximo de pasajeros por cotización", min: 1, max: 20, unidad: "pasajeros" },
  { k: "cotizacionRespuestaHoras", etiqueta: "El plazo de respuesta de una cotización", min: 1, max: 720, unidad: "horas" },
  { k: "cotizacionValidezHoras", etiqueta: "La validez de una cotización", min: 1, max: 720, unidad: "horas" },
];

/** Primer error de los límites (números enteros dentro de su rango) o cadena vacía. Un valor ausente no es error: usa el defecto. */
export function errorLimites(r: Partial<Record<keyof LimitesPrograma, unknown>> | null | undefined): string {
  for (const { k, etiqueta, min, max, unidad } of RANGOS) {
    const v = r?.[k];
    if (v === undefined || v === null) continue;
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) return `${etiqueta} debe ser un número entero de ${min} a ${max} ${unidad}.`;
  }
  return "";
}

/** "1 hora" / "48 horas". */
export const textoHoras = (h: number) => `${h} ${h === 1 ? "hora" : "horas"}`;