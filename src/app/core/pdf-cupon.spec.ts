import { describe, expect, it } from "vitest";
import { pdfCupon, type DatosCupon } from "./pdf-cupon";
import { matrizQr } from "./qr";

async function texto(b: Blob) {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (const x of buf) s += String.fromCharCode(x);
  return s;
}

const base: DatosCupon = {
  programa: "Banco Solidario Puntos", marca: "Noe Sushi Bar", beneficio: "35% dscto. en tablas para compartir",
  codigo: "MOT-8H2K9QAZ", generado: "13/11/2026 15:40", vence: "13/11/2026 18:40", color: "#00bdd2",
};

describe("pdfCupon", () => {
  it("genera un PDF de una página con el programa, el beneficio, el código y la vigencia", async () => {
    const pdf = await texto(pdfCupon(base, await matrizQr(base.codigo)));
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("%%EOF");
    expect(pdf).toContain("/Count 1");
    expect(pdf).toContain("/MediaBox [0 0 595 842]");
    expect(pdf).toContain("(Banco Solidario Puntos)");
    expect(pdf).toContain("(NOE SUSHI BAR)"); // la marca va en mayúsculas
    expect(pdf).toContain("(MOT-8H2K9QAZ)");
    expect(pdf).toContain("(V\\341lido hasta el 13/11/2026 18:40)"); // «Válido» en Latin-1
    expect(pdf).toContain("(Generado el 13/11/2026 15:40)");
  });

  it("el QR va como rectángulos negros dentro de la tarjeta", async () => {
    const matriz = await matrizQr(base.codigo);
    const pdf = await texto(pdfCupon(base, matriz));
    const rectangulos = pdf.split("\n").find((l) => l.startsWith("0 0 0 rg "))!;
    expect((rectangulos.match(/ re/g) ?? []).length).toBeGreaterThan(matriz.length); // al menos un trazo por fila con módulos
  });

  it("un código muy largo se achica para caber, y sin fecha de generación no la imprime", async () => {
    const largo = { ...base, codigo: "NORKYS-COMBO-FAMILIAR-2026-AB12CD34EF56GH78", generado: undefined };
    const pdf = await texto(pdfCupon(largo, await matrizQr(largo.codigo)));
    expect(pdf).toContain(`(${largo.codigo})`);
    expect(pdf).not.toContain("Generado el");
    const linea = pdf.split(String.fromCharCode(10)).find((l) => l.includes(`(${largo.codigo}) Tj`))!; // BT /F2 <tam> Tf …
    const tam = Number(linea.split(" ")[2]);
    expect(tam).toBeLessThan(26); // el tamaño normal del código
    expect(tam).toBeGreaterThanOrEqual(12);
  });
});
