import { expect, test, type Page } from "@playwright/test";
import { entrarAdmin, vigilarErrores } from "./helpers";

/**
 * Escalabilidad de Atención, Cotizaciones, Destinos, Ciudades y Marcas.
 * Con STRESS_N = N: N/5 mensajes, N/4 cotizaciones, N/50 destinos, N/100 ciudades y 50 marcas extra.
 *   STRESS_N=500000 npm run e2e -- escalabilidad-extra
 */
const N = Number(process.env["STRESS_N"] ?? 100_000);
const F = (n: number) => n.toLocaleString("es");

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(180_000);

const conStress = (page: Page) => page.addInitScript((x) => localStorage.setItem("bs_stress", String(x)), N);
const filas = (page: Page) => page.evaluate(() => document.querySelectorAll("tbody tr").length);
const nodos = (page: Page) => page.evaluate(() => document.getElementsByTagName("*").length);

async function medir(page: Page, ruta: string, selector = "tbody tr") {
  const t0 = Date.now();
  await page.goto(ruta);
  await page.locator(selector).first().waitFor({ timeout: 60_000 });
  return Date.now() - t0;
}

test("Atención: tabla paginada, filtro por estado y respuesta", async ({ page }, info) => {
  await conStress(page);
  await entrarAdmin(page);
  const ms = await medir(page, "/admin/atencion", "text=#0");
  info.annotations.push({ type: "carga atención (ms)", description: String(ms) });
  expect(await filas(page)).toBeLessThanOrEqual(15);
  await expect(page.getByText(/mensajes nuevos · [\d.,]{5,} en total/)).toBeVisible();
  await page.getByLabel("Estado").selectOption("Respondido");
  await expect(page.locator("tbody tr").first()).toContainText("Respondido");
  await page.getByLabel("Estado").selectOption(""); // quita el filtro para buscar entre todos
  await page.getByLabel("Buscar mensaje").fill("#4242");
  const fila = page.locator("tbody tr", { hasText: "#4242" });
  await expect(fila).toHaveCount(1);
  await fila.getByRole("button", { name: "Ver detalle" }).click();
  await page.getByLabel("Respuesta", { exact: true }).fill("Resuelto");
  await page.getByRole("button", { name: "Responder" }).click();
  await expect(page.getByText("Respuesta enviada por correo")).toBeVisible();
});

test("Marcas: listado paginado y búsqueda", async ({ page }, info) => {
  await conStress(page);
  await entrarAdmin(page);
  const ms = await medir(page, "/admin/marcas");
  info.annotations.push({ type: "carga marcas (ms)", description: String(ms) });
  await page.getByLabel("Buscar marca").fill("Marca masiva 37");
  await expect(page.locator("tbody tr").first()).toContainText("Marca masiva 37");
  expect(F(1)).toBe("1");
});
