import { describe, expect, it } from "vitest";
import { estadoParaParticipante } from "./estados-pedido";

describe("estadoParaParticipante", () => {
  it("traduce los seis estados del panel a los cuatro del participante", () => {
    expect(estadoParaParticipante("Confirmado")).toBe("Procesando");
    expect(estadoParaParticipante("Preparando")).toBe("Procesando");
    expect(estadoParaParticipante("Enviado")).toBe("En camino");
    expect(estadoParaParticipante("Entregado")).toBe("Entregado");
    expect(estadoParaParticipante("Digital enviado")).toBe("Entregado");
    expect(estadoParaParticipante("Cancelado")).toBe("Cancelado");
  });
  it("un estado desconocido se muestra como Procesando", () => {
    expect(estadoParaParticipante(undefined)).toBe("Procesando");
  });
});
