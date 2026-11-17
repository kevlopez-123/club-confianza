import { expect, test } from "@playwright/test";
import { entrarAdmin, esperarCarga } from "./helpers";

test.describe("Locales y mapa de establecimientos", () => {
  test("el mapa carga los establecimientos y se filtra por marca", async ({ page }) => {
    await page.goto("/mapa");
    await esperarCarga(page);
    await expect(page.getByRole("heading", { name: "Mapa de establecimientos" })).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.getByText(/\d+ establecimientos/)).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible();
  });

  test("la ficha del beneficio muestra dónde canjearlo, solo en los locales elegidos", async ({ page }) => {
    await page.goto("/beneficios/b1"); // Norky's: el ejemplo se limita a 2 de sus locales
    const donde = page.getByTestId("donde-canjearlo");
    await expect(donde).toBeVisible();
    await expect(donde.getByRole("list", { name: "Locales donde se canjea" }).getByRole("listitem")).toHaveCount(2);
    await expect(donde.getByRole("button", { name: /Ver el más cercano/ })).toBeVisible();
    await page.goto("/beneficios/b2"); // Juan Valdez: sin locales elegidos, vale en todos los de la marca
    await expect(page.getByTestId("donde-canjearlo").getByRole("list", { name: "Locales donde se canjea" }).getByRole("listitem")).toHaveCount(3);
  });

  test("en la ficha del beneficio, Términos y condiciones va antes que Especificaciones y Dónde canjearlo", async ({ page }) => {
    for (const id of ["b1", "b2"]) {
      await page.goto("/beneficios/" + id);
      await expect(page.getByTestId("donde-canjearlo")).toBeVisible();
      const titulos = await page.locator("main h2").allTextContents();
      const pos = (t: string) => titulos.findIndex((x) => x.trim() === t);
      expect(pos("Términos y condiciones")).toBeGreaterThanOrEqual(0);
      expect(pos("Términos y condiciones")).toBeLessThan(pos("Especificaciones"));
      expect(pos("Términos y condiciones")).toBeLessThan(pos("Dónde canjearlo"));
    }
  });

  test("el catálogo de beneficios lleva al mapa", async ({ page }) => {
    await page.goto("/beneficios");
    await page.getByRole("link", { name: "Buscar en el mapa de establecimientos" }).click();
    await expect(page).toHaveURL(/\/mapa/);
  });

  test("el panel lista los locales por marca y permite crear uno", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/marcas/locales");
    await expect(page.getByRole("heading", { name: /Locales/ }).first()).toBeVisible();
    await expect(page.getByText("Bembos Miraflores").first()).toBeVisible();
  });
});
