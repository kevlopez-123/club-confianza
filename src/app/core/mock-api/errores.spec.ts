import { provideHttpClient, withInterceptors, HttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";
import { mockApiInterceptor } from "./mock-api.interceptor";
import { ApiError, codigoPorEstado, cuerpoDeError } from "./types";

describe("contrato de errores del API", () => {
  it("sin código propio, el código sale del estado HTTP", () => {
    expect(new ApiError(404, "x").codigo).toBe("no_encontrado");
    expect(new ApiError(422, "x").codigo).toBe("datos_invalidos");
    expect(new ApiError(409, "x").codigo).toBe("conflicto");
    expect(codigoPorEstado(503)).toBe("error_interno");
  });
  it("un código propio tiene prioridad", () => {
    expect(new ApiError(422, "x", "saldo_insuficiente").codigo).toBe("saldo_insuficiente");
  });
  it("el cuerpo trae codigo, mensaje y message (el mismo texto, para los clientes que ya leen message)", () => {
    expect(cuerpoDeError(new ApiError(403, "Cuenta bloqueada", "cuenta_bloqueada"))).toEqual({ codigo: "cuenta_bloqueada", mensaje: "Cuenta bloqueada", message: "Cuenta bloqueada" });
  });
});

const SESION = { Authorization: "Bearer mock.participante.p1" };

describe("API simulada (de punta a punta, sin navegador)", () => {
  const http = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))] });
    return TestBed.inject(HttpClient);
  };

  it("un error trae su código y mensaje", async () => {
    const e: any = await firstValueFrom(http().post("/api/ordenes", { items: [{ nombre: "X", marca: "M", imagen: "", cantidad: 1, puntos: 1, digital: true }], puntosUsados: 999999999, montoUSD: 0, entrega: "x" }, { headers: SESION })).catch((x) => x);
    expect(e.status).toBe(422);
    expect(e.error.codigo).toBe("saldo_insuficiente");
    expect(e.error.mensaje).toBe(e.error.message);
  });

  it("sin sesión responde 401 con su código", async () => {
    const e: any = await firstValueFrom(http().get("/api/me/compras-puntos")).catch((x) => x);
    expect(e.status).toBe(401);
    expect(e.error.codigo).toBe("no_autenticado");
  });

  it("un canje con más unidades de las permitidas por producto se rechaza con su código", async () => {
    const e: any = await firstValueFrom(http().post("/api/ordenes", { items: [{ nombre: "X", marca: "M", imagen: "", cantidad: 6, puntos: 1, digital: true }], puntosUsados: 0, montoUSD: 0, entrega: "x" }, { headers: SESION })).catch((x) => x);
    expect(e.status).toBe(422);
    expect(e.error.codigo).toBe("cantidad");
    expect(e.error.mensaje).toContain("máximo 5 unidades");
  });

  it("una cotización con más pasajeros de los permitidos se rechaza", async () => {
    const pas = Array.from({ length: 10 }, (_, i) => ({ nombres: "A", apellidos: "B", tipoDoc: "cedula", numDoc: `17000000${i}0`, nacimiento: "1990-01-01", asistencia: false }));
    const e: any = await firstValueFrom(http().post("/api/me/cotizaciones", { origen: "UIO", destino: "MIA", salida: "2027-03-01", pasajeros: 10, pasajerosDetalle: pas }, { headers: SESION })).catch((x) => x);
    expect(e.status).toBe(422);
    expect(e.error.codigo).toBe("pasajeros_maximo");
  });

  it("un dispositivo se registra, se repite sin duplicarse y se quita", async () => {
    const cliente = http();
    const token = "fcm-token-de-prueba-" + "x".repeat(30);
    await firstValueFrom(cliente.post("/api/me/dispositivos", { token, plataforma: "android" }, { headers: SESION }));
    await firstValueFrom(cliente.post("/api/me/dispositivos", { token, plataforma: "android" }, { headers: SESION }));
    const guardados = JSON.parse(localStorage.getItem("bancosolidario_mockdb_v11") ?? "{}").dispositivos ?? [];
    expect(guardados.filter((d: any) => d.token === token).length).toBe(1);
    await firstValueFrom(cliente.delete("/api/me/dispositivos/" + encodeURIComponent(token), { headers: SESION }));
    const despues = JSON.parse(localStorage.getItem("bancosolidario_mockdb_v11") ?? "{}").dispositivos ?? [];
    expect(despues.some((d: any) => d.token === token)).toBe(false);
  });

  it("un token de dispositivo vacío se rechaza", async () => {
    const e: any = await firstValueFrom(http().post("/api/me/dispositivos", { token: "corto" }, { headers: SESION })).catch((x) => x);
    expect(e.status).toBe(422);
    expect(e.error.codigo).toBe("token_invalido");
  });

  it("GET onboarding es público y trae solo las pantallas activas, sin campos internos", async () => {
    const lista: any[] = await firstValueFrom(http().get<any[]>("/api/onboarding"));
    expect(lista.length).toBeGreaterThan(0);
    for (const o of lista) expect(Object.keys(o).sort()).toEqual(["id", "texto", "titulo"]);
  });

  it("una ruta inexistente responde ruta_no_encontrada", async () => {
    const e: any = await firstValueFrom(http().get("/api/no-existe")).catch((x) => x);
    expect(e.status).toBe(404);
    expect(e.error.codigo).toBe("ruta_no_encontrada");
  });

  it("GET me/compras-puntos devuelve las compras de la participante con el formato que lee la app", async () => {
    const lista: any[] = await firstValueFrom(http().get<any[]>("/api/me/compras-puntos", { headers: SESION }));
    expect(Array.isArray(lista)).toBe(true);
    for (const c of lista) expect(Object.keys(c)).toEqual(expect.arrayContaining(["codigo", "fechaISO", "cantidad", "monto", "estado", "motivo", "intentos"]));
  });
});
