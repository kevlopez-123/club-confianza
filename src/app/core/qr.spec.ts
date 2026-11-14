import { describe, expect, it } from "vitest";
import { matrizQr, svgDeQr, urlDeSvg } from "./qr";

describe("QR local", () => {
  it("genera una matriz cuadrada con los tres cuadros de posición", async () => {
    const m = await matrizQr("MOT-8H2K9QAZ");
    const n = m.length;
    expect(n).toBeGreaterThanOrEqual(21); // versión 1 como mínimo
    expect(m.every((f) => f.length === n)).toBe(true);
    // Esquina superior izquierda: anillo exterior de 7×7 oscuro y centro 3×3 oscuro (el cuadro de posición).
    for (let i = 0; i < 7; i++) { expect(m[0]![i]).toBe(true); expect(m[6]![i]).toBe(true); expect(m[i]![0]).toBe(true); expect(m[i]![6]).toBe(true); }
    for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) expect(m[y]![x]).toBe(true);
    // Los otros dos cuadros: arriba a la derecha y abajo a la izquierda.
    expect(m[0]![n - 1]).toBe(true);
    expect(m[n - 1]![0]).toBe(true);
  });

  it("el mismo texto da la misma matriz y textos distintos dan matrices distintas", async () => {
    const a = await matrizQr("MOT-AAAA1111");
    const b = await matrizQr("MOT-AAAA1111");
    const c = await matrizQr("MOT-BBBB2222");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it("el SVG lleva zona de silencio, fondo blanco y un solo trazo negro", async () => {
    const m = await matrizQr("MOT-8H2K9QAZ");
    const svg = svgDeQr(m, 2);
    const lado = m.length + 4;
    expect(svg).toContain(`viewBox="0 0 ${lado} ${lado}"`);
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain('fill="#000"');
    expect(urlDeSvg(svg).startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(urlDeSvg(svg)).not.toContain("<"); // va codificado
  });
});
