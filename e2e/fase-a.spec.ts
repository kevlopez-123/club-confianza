import { expect, test } from "@playwright/test";
import { entrarAdmin, esperarCarga } from "./helpers";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAHxQBA0bAfiQAAAAASUVORK5CYII=", "base64");

test.describe("Fase A: arreglos rápidos", () => {
  test("se puede eliminar un banner (con confirmación) y desaparece", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/contenido");
    await page.getByRole("button", { name: "Nuevo banner" }).click();
    const d = page.getByRole("dialog", { name: /Nuevo banner/ });
    await d.getByLabel("Subir imagen").first().setInputFiles({ name: "b.png", mimeType: "image/png", buffer: PNG });
    await d.getByLabel("Texto alternativo").fill("Banner para eliminar");
    await d.getByRole("button", { name: "Guardar banner" }).click();
    await expect(d).toBeHidden();

    const antes = await page.getByRole("button", { name: "Eliminar" }).count();
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    const c = page.getByRole("dialog", { name: "¿Eliminar banner?" });
    await expect(c).toContainText("Banner para eliminar");
    await c.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(antes); // cancelar no borra

    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await page.getByRole("dialog", { name: "¿Eliminar banner?" }).getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(antes - 1);
    await expect(page.getByText("Banner para eliminar")).toHaveCount(0);
  });

  test("los encabezados de las tablas del panel van en mayúscula", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/pedidos");
    await esperarCarga(page);
    const th = page.locator(".adm-table thead th").first();
    await expect(th).toBeVisible();
    expect(await th.evaluate((e) => getComputedStyle(e).textTransform)).toBe("uppercase");
  });

  test("el encabezado del sitio se compacta al bajar y vuelve al subir", async ({ page }) => {
    await entrarAdmin(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/beneficios");
    await esperarCarga(page);
    const h = page.locator("header").first();
    const alto = async () => (await h.boundingBox())!.height;
    const inicial = await alto();
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect.poll(alto).toBeLessThan(inicial - 15);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(alto).toBeGreaterThan(inicial - 2);
  });

  test("la galería del detalle se queda fija mientras se lee la columna de texto", async ({ page }) => {
    await entrarAdmin(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/canjea/p1");
    await esperarCarga(page);
    const g = page.locator(".galeria-fija");
    await expect(g).toBeVisible();
    expect(await g.evaluate((e) => getComputedStyle(e).position)).toBe("sticky");
    // Con una columna de texto larga, la galería sigue a la vista al bajar.
    await g.evaluate((e) => { const r = document.createElement("div"); r.style.height = "1800px"; e.nextElementSibling!.appendChild(r); });
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(async () => Math.round((await g.boundingBox())!.y)).toBeGreaterThan(60);
    expect((await g.boundingBox())!.y).toBeLessThan(200);
  });
});
