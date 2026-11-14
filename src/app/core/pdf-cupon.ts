/**
 * PDF del cupón de un beneficio (una página A4): franja con el color de la marca, nombre del beneficio, QR dibujado como vectores,
 * código en grande, vigencia e instrucciones. Se arma en el navegador con las piezas de `pdf-base` y el QR local de `qr`.
 */
import { ancho, col, ensamblarPdf, envolver, esc, rgb, type Rgb } from "./pdf-base";
import { descargarBlob } from "./pdf-cotizacion";
import { matrizQr } from "./qr";

export interface DatosCupon {
  programa: string;
  marca: string;
  beneficio: string;
  codigo: string;
  /** «dd/mm/aaaa hh:mm» (o solo la fecha). */
  generado?: string;
  vence: string;
  /** Color de la marca (#rrggbb). */
  color: string;
}

const W = 595;
const H = 842;
const NEGRO: Rgb = [0.17, 0.17, 0.17];
const GRIS: Rgb = [0.45, 0.45, 0.45];
const LINEA: Rgb = [0.86, 0.87, 0.88];

const texto = (x: number, y: number, negrita: boolean, tam: number, color: Rgb, s: string) =>
  `BT /${negrita ? "F2" : "F1"} ${tam} Tf ${col(color)} rg ${x.toFixed(1)} ${y.toFixed(1)} Td (${esc(s)}) Tj ET`;
const centrado = (y: number, negrita: boolean, tam: number, color: Rgb, s: string) => texto((W - ancho(s, tam, negrita)) / 2, y, negrita, tam, color, s);
const rect = (x: number, y: number, w: number, h: number, relleno: Rgb) => `${col(relleno)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;

export function pdfCupon(d: DatosCupon, qr: boolean[][]): Blob {
  const marca = rgb(d.color);
  const c: string[] = [];

  // Franja de color con el programa
  c.push(rect(0, H - 120, W, 120, marca));
  c.push(texto(40, H - 62, true, 22, [1, 1, 1], d.programa));
  c.push(texto(40, H - 86, false, 12, [1, 1, 1], "Cupón de beneficio"));

  // Tarjeta
  c.push(rect(40, 130, W - 80, H - 130 - 150, [1, 1, 1]));
  c.push(`${col(LINEA)} RG 1 w 40 130 ${W - 80} ${H - 130 - 150} re S`);
  c.push(texto(64, H - 190, true, 10, GRIS, d.marca.toUpperCase()));
  let y = H - 218;
  for (const l of envolver(d.beneficio, W - 128, 20, 2, true)) {
    c.push(texto(64, y, true, 20, NEGRO, l));
    y -= 26;
  }

  // QR centrado, con zona de silencio blanca
  const n = qr.length;
  const lado = 230;
  const celda = lado / (n + 4);
  const x0 = (W - lado) / 2;
  const y0 = 330;
  c.push(rect(x0, y0, lado, lado, [1, 1, 1]));
  c.push(`${col(LINEA)} RG 1 w ${x0} ${y0} ${lado} ${lado} re S`);
  const trazos: string[] = [];
  qr.forEach((fila, fy) => {
    let fx = 0;
    while (fx < n) {
      if (!fila[fx]) { fx++; continue; }
      let largo = 1;
      while (fx + largo < n && fila[fx + largo]) largo++;
      trazos.push(`${(x0 + (fx + 2) * celda).toFixed(2)} ${(y0 + lado - (fy + 3) * celda).toFixed(2)} ${(largo * celda + 0.05).toFixed(2)} ${(celda + 0.05).toFixed(2)} re`);
      fx += largo;
    }
  });
  c.push(`0 0 0 rg ${trazos.join(" ")} f`);

  // Código (se achica si es largo) y vigencia
  let tam = 26;
  while (tam > 12 && ancho(d.codigo, tam, true) > W - 120) tam -= 2;
  c.push(centrado(296, true, tam, NEGRO, d.codigo));
  c.push(centrado(268, true, 12, marca, `Válido hasta el ${d.vence}`));
  if (d.generado) c.push(centrado(250, false, 10, GRIS, `Generado el ${d.generado}`));

  // Instrucciones
  c.push(`${col(LINEA)} RG 0.5 w 64 232 m ${W - 64} 232 l S`);
  c.push(texto(64, 210, true, 12, NEGRO, "Cómo usarlo"));
  let yp = 190;
  for (const paso of [
    "1. Presenta este código QR a un encargado del local.",
    "2. El cupón es de un solo uso y vale únicamente hasta la fecha indicada.",
    "3. Si el QR no se lee, dicta el código que aparece sobre la vigencia.",
  ]) {
    c.push(texto(64, yp, false, 11, GRIS, paso));
    yp -= 18;
  }

  c.push(centrado(100, false, 9, GRIS, `${d.programa} · Cupón generado desde la plataforma`));
  return ensamblarPdf([c.join("\n")], W, H);
}

/** Descarga el cupón como PDF (`cupon-CÓDIGO.pdf`). */
export async function descargarCuponPdf(d: DatosCupon) {
  descargarBlob(pdfCupon(d, await matrizQr(d.codigo)), `cupon-${d.codigo}.pdf`);
}

/** Abre el PDF del cupón en una pestaña nueva y lanza la impresión (si el navegador no la lanza solo, queda el visor con su botón de imprimir). */
export async function imprimirCuponPdf(d: DatosCupon) {
  const url = URL.createObjectURL(pdfCupon(d, await matrizQr(d.codigo)));
  const w = window.open(url, "_blank");
  if (!w) {
    // Ventana emergente bloqueada: se descarga el archivo para que se imprima desde el visor del sistema.
    descargarBlob(pdfCupon(d, await matrizQr(d.codigo)), `cupon-${d.codigo}.pdf`);
    return;
  }
  w.addEventListener("load", () => { try { w.print(); } catch { /* el visor de PDF ya trae su botón de imprimir */ } });
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
