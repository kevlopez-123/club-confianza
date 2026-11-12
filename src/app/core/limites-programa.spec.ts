import { describe, expect, it } from "vitest";
import { errorLimites, LIMITES_POR_DEFECTO, limitesDe, textoHoras } from "./limites-programa";

describe("límites del programa", () => {
  it("sin valores guardados usan los de siempre (5 unidades, 9 pasajeros, 48 h y 72 h)", () => {
    expect(limitesDe(undefined)).toEqual(LIMITES_POR_DEFECTO);
    expect(limitesDe({ maxPorLinea: 3 })).toEqual({ ...LIMITES_POR_DEFECTO, maxPorLinea: 3 });
  });
  it("acepta valores enteros dentro de rango y un valor ausente", () => {
    expect(errorLimites({ maxPorLinea: 10, maxPasajeros: 4, cotizacionRespuestaHoras: 24, cotizacionValidezHoras: 120 })).toBe("");
    expect(errorLimites({})).toBe("");
    expect(errorLimites(undefined)).toBe("");
  });
  it("rechaza ceros, decimales, textos y valores fuera de rango, diciendo cuál es", () => {
    expect(errorLimites({ maxPorLinea: 0 })).toContain("unidades por producto");
    expect(errorLimites({ maxPasajeros: 2.5 })).toContain("pasajeros");
    expect(errorLimites({ cotizacionRespuestaHoras: 721 })).toContain("respuesta");
    expect(errorLimites({ cotizacionValidezHoras: "72" })).toContain("validez");
  });
  it("escribe las horas en singular y plural", () => {
    expect(textoHoras(1)).toBe("1 hora");
    expect(textoHoras(48)).toBe("48 horas");
  });
});