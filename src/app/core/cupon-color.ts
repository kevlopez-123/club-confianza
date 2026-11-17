/** Color de la marca para el cupón impreso o guardado: cabecera, píldora y recuadros. */
export const COLOR_POR_DEFECTO = "#005699";

const aRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Mezcla el color con blanco (`t` = proporción de blanco, 0–1): fondo suave del aviso. */
export function tinte(hex: string, t = 0.9): string {
  const [r, g, b] = aRgb(hex).map((v) => Math.round(v + (255 - v) * t));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Copia del logo con todos sus píxeles en blanco (conserva la transparencia): se ve sobre la cabecera de color. */
export function logoBlanco(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}
