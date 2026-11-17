import { expect, test } from "@playwright/test";
import { ADMIN_ROUTES, PUBLIC_ROUTES, entrarAdmin, esperarCarga, vigilarErrores } from "./helpers";

test.describe("Rutas del participante", () => {
  for (const ruta of PUBLIC_ROUTES) {
    test(`carga ${ruta} sin errores`, async ({ page }) => {
      const errores = vigilarErrores(page);
      await page.goto(ruta);
      await esperarCarga(page);
      await expect(page.locator("main")).not.toBeEmpty();
      await expect(page.getByText("Página no encontrada")).toHaveCount(0);
      expect(errores).toEqual([]);
    });
  }

  test("una ruta inexistente muestra el 404", async ({ page }) => {
    await page.goto("/no-existe");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("detalles inexistentes no dejan la pantalla en blanco ni dan errores", async ({ page }) => {
    for (const ruta of ["/canjea/p999", "/beneficios/b999"]) {
      const errores = vigilarErrores(page);
      await page.goto(ruta);
      await esperarCarga(page);
      await expect(page.locator("main")).not.toBeEmpty();
      expect(errores).toEqual([]);
    }
  });

});

test.describe("Rutas del admin", () => {
  test("sin sesión se pide el ingreso", async ({ page }) => {
    await page.goto("/admin/productos");
    await expect(page.getByRole("heading", { name: "Panel de administración" })).toBeVisible();
  });

  test("todas las páginas cargan sin errores", async ({ page }) => {
    const errores = vigilarErrores(page);
    await entrarAdmin(page);
    for (const ruta of ADMIN_ROUTES) {
      await page.goto(ruta);
      await esperarCarga(page);
      await expect(page.locator("h1").first(), ruta).toBeVisible();
      await expect(page.getByText("Sin acceso a esta sección"), ruta).toHaveCount(0);
    }
    expect(errores).toEqual([]);
  });
});

test.describe("Enlaces", () => {
  test("todo enlace interno del sitio lleva a una página existente", async ({ page }) => {
    test.setTimeout(420_000); // recorre cada enlace interno del sitio: crece con el catálogo
    const hrefs = new Set<string>();
    for (const ruta of PUBLIC_ROUTES) {
      await page.goto(ruta);
      await esperarCarga(page);
      for (const h of await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))) {
        if (h.startsWith("/") && !h.startsWith("//")) hrefs.add(h.split("#")[0]!);
      }
    }
    expect(hrefs.size).toBeGreaterThan(30);
    const rotos: string[] = [];
    for (const h of hrefs) {
      await page.goto(h);
      await esperarCarga(page);
      if (await page.getByText("Página no encontrada").count()) rotos.push(h);
    }
    expect(rotos).toEqual([]);
  });

  test("no quedan enlaces muertos (href=\"#\" o vacío)", async ({ page }) => {
    const muertos: string[] = [];
    for (const ruta of ["/", "/canjea", "/contacto"]) {
      await page.goto(ruta);
      await esperarCarga(page);
      const m = await page.locator("a").evaluateAll((as) =>
        as.filter((a) => ["#", "", null].includes(a.getAttribute("href"))).map((a) => (a.getAttribute("aria-label") ?? a.textContent ?? "").trim()),
      );
      muertos.push(...m.map((x) => `${ruta}: ${x}`));
    }
    expect([...new Set(muertos)]).toEqual([]);
  });

  test("los enlaces del menú llevan a la sección correcta", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav");
    const esperados: Record<string, string> = {
      Inicio: "/", "Canjea tus puntos": "/canjea", "Mis canjes": "/mis-compras", Contáctanos: "/contacto",
    };
    for (const [texto, ruta] of Object.entries(esperados)) {
      await nav.getByRole("link", { name: texto, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${ruta === "/" ? "/$" : ruta + "$"}`));
    }
    for (const [grupo, hijo, ruta] of [
      ["Beneficios", "Catálogo de beneficios", "/beneficios"], ["Beneficios", "Mis beneficios", "/mis-beneficios"],
      ["Mis puntos", "Historial de puntos", "/mis-puntos/historial"], ["Mis puntos", "Mi nivel", "/mi-nivel"],
    ] as const) {
      await nav.getByRole("button", { name: grupo }).hover();
      await nav.getByRole("link", { name: hijo }).click();
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
    }
  });
});
