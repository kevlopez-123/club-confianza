import type * as QRCode from "qrcode";

/**
 * Código QR dibujado en el propio navegador (sin enviar el código del cupón a ningún servicio externo). La librería se carga
 * solo cuando hace falta (al ver un cupón), para no engordar la carga inicial del sitio.
 */

/** Matriz del QR: `true` = módulo oscuro. Corrección de errores media (M), suficiente para un código corto. */
export async function matrizQr(texto: string): Promise<boolean[][]> {
  const modulo: any = await import("qrcode");
  const lib = typeof modulo.create === "function" ? modulo : modulo.default;
  const qr = lib.create(texto, { errorCorrectionLevel: "M" });
  const n: number = qr.modules.size;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => !!qr.modules.get(y, x)));
}

/** QR como SVG (negro sobre blanco, con zona de silencio `margen` módulos): se usa como imagen con texto alternativo. */
export function svgDeQr(m: boolean[][], margen = 2): string {
  const n = m.length;
  const lado = n + margen * 2;
  let d = "";
  m.forEach((fila, y) => {
    let x = 0;
    while (x < n) {
      if (!fila[x]) { x++; continue; }
      let largo = 1;
      while (x + largo < n && fila[x + largo]) largo++;
      d += `M${x + margen} ${y + margen}h${largo}v1h-${largo}z`;
      x += largo;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges"><rect width="${lado}" height="${lado}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

export const urlDeSvg = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Carga la librería de QR bajo demanda. Es CommonJS: en la compilación de producción la importación dinámica entrega el módulo dentro
 * de `default`, y en desarrollo con las funciones en la raíz. Aquí se aceptan las dos formas.
 */
export async function cargarQr(): Promise<typeof QRCode> {
  const m = (await import("qrcode")) as unknown as typeof QRCode & { default?: typeof QRCode };
  return m.default && typeof m.default.toDataURL === "function" ? m.default : m;
}
