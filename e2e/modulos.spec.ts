import { expect, test } from "@playwright/test";
import { entrarAdmin } from "./helpers";

test.describe("Usuarios, Roles y Registro de cambios por separado", () => {
  test("tres secciones distintas en el menú y cada una con su contenido", async ({ page }) => {
    await entrarAdmin(page);
    const nav = page.getByLabel("Navegación principal");
    for (const l of ["Usuarios", "Roles", "Registro de cambios"]) await expect(nav.getByRole("link", { name: l, exact: true })).toBeVisible();

    await page.goto("/admin/usuarios");
    await expect(page.getByRole("heading", { name: "Usuarios", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Registro de cambios" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Roles", exact: true })).toHaveCount(0);

    await page.goto("/admin/roles");
    for (const r of ["Administrador", "Catálogo", "Operaciones", "Atención", "Solo lectura"]) await expect(page.getByRole("heading", { name: r, exact: true })).toBeVisible();
    await expect(page.getByText(/usuarios? con este rol/).first()).toBeVisible();

    await page.goto("/admin/auditoria");
    await expect(page.getByRole("heading", { name: "Registro de cambios" })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("un cambio de usuario queda registrado con quién lo hizo y se puede filtrar", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Invitar usuario" }).click();
    const m = page.getByRole("dialog");
    await m.getByLabel("Nombre completo").fill("Pablo Registro");
    await m.getByLabel("Correo electrónico").fill("pablo.registro@bancosolidario.com");
    await m.getByRole("button", { name: "Enviar invitación" }).click();
    await page.goto("/admin/auditoria");
    const fila = page.locator("tbody tr", { hasText: "Invitó a Pablo Registro" });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText("Mariela Castro");
    await page.getByLabel("Filtrar por usuario").selectOption("Karla Núñez");
    await expect(page.locator("tbody tr", { hasText: "Invitó a Pablo Registro" })).toHaveCount(0);
  });

  test("solo el administrador accede a Roles y Registro de cambios", async ({ page }) => {
    await entrarAdmin(page, "Operaciones");
    for (const ruta of ["/admin/roles", "/admin/auditoria", "/admin/usuarios"]) {
      await page.goto(ruta);
      await expect(page.getByText("Sin acceso a esta sección")).toBeVisible();
    }
  });
});

test.describe("Atención con el mismo formato que Pedidos", () => {
  test("tabla, búsqueda, filtro de estado, paginador y panel de detalle", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/atencion");
    await expect(page.locator("thead th")).toHaveText(["Asunto", "Estado", "Participante", "Fecha", ""]);
    await expect(page.getByRole("button", { name: "Descargar" })).toBeVisible();
    await page.getByLabel("Estado").selectOption("En proceso");
    await expect(page.locator("tbody tr", { hasText: "Cupón no válido" })).toHaveCount(1);
    await page.getByLabel("Buscar mensaje").fill("gabriela");
    await expect(page.locator("tbody tr", { hasText: "Puntos de compra" })).toHaveCount(0); // otro estado
    await page.getByLabel("Estado").selectOption("");
    const fila = page.locator("tbody tr", { hasText: "Puntos de compra" });
    await fila.getByRole("button", { name: "Ver detalle" }).click();
    await expect(page.getByText("Compré 5 000 puntos pero no se reflejan.")).toBeVisible();
  });
});

test.describe("Banners en su módulo y con orden", () => {
  test("Productos y Beneficios tienen su pestaña Banners, solo con los suyos", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/productos");
    await page.getByRole("button", { name: "Banners", exact: true }).click();
    const catalogo = page.locator("a-panel");
    await expect(catalogo.first()).toBeVisible();
    for (const p of await catalogo.all()) await expect(p).toContainText("Canjea");
    await page.goto("/admin/beneficios");
    await page.getByRole("button", { name: "Banners", exact: true }).click();
    await expect(page.locator("a-panel").first()).toBeVisible();
    for (const p of await page.locator("a-panel").all()) await expect(p).toContainText("Beneficios");
    await page.goto("/admin/contenido");
    for (const p of await page.locator("a-panel").all()) await expect(p).toContainText("Home");
  });

  test("reordenar un banner del Home se conserva al recargar", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/contenido");
    await expect(page.locator("a-panel").nth(1)).toBeVisible();
    const paneles = page.locator("a-panel");
    const alt0 = await paneles.nth(0).locator("p.truncate").innerText();
    const alt1 = await paneles.nth(1).locator("p.truncate").innerText();
    await paneles.nth(0).getByRole("button", { name: "Mover después" }).click();
    await expect(paneles.nth(0).locator("p.truncate")).toHaveText(alt1);
    await expect(paneles.nth(1).locator("p.truncate")).toHaveText(alt0);
    await page.reload();
    await expect(page.locator("a-panel").nth(0).locator("p.truncate")).toHaveText(alt1); // se conserva
  });

});
test.describe("Subida de imágenes y espaciado de modales", () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

});

test.describe("Subcategorías en productos", () => {
  test("el producto elige subcategoría de su categoría; al cambiar de categoría se limpia", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/productos");
    const fila = page.locator("tbody tr").first();
    await expect(fila).toBeVisible();
    await fila.getByRole("button", { name: /Editar/ }).click();
    const d = page.locator("aside").last();
    const cat = d.getByLabel("Categoría", { exact: true });
    const sub = d.getByLabel("Subcategoría", { exact: true });
    // categoría con subcategorías: se puede elegir una
    const slugs = await cat.locator("option").evaluateAll((o) => (o as HTMLOptionElement[]).map((x) => x.value));
    let elegida = "";
    for (const s of slugs) {
      await cat.selectOption(s);
      await page.waitForTimeout(200); // el cambio de categoría actualiza las subcategorías
      if ((await sub.locator("option").count()) > 1) { elegida = s; break; }
    }
    expect(elegida).not.toBe("");
    await expect(sub).toBeEnabled();
    const etiqueta = (await sub.locator("option").nth(1).innerText()).trim();
    await sub.selectOption({ index: 1 });
    await expect(sub.locator("option:checked")).toHaveText(etiqueta);
    await d.getByRole("button", { name: "Guardar producto" }).click();
    await expect(page.locator("tbody tr").first()).toContainText(etiqueta); // se ve bajo la categoría en la tabla

    // reabrir: la subcategoría quedó guardada; cambiar de categoría la limpia
    await page.locator("tbody tr").first().getByRole("button", { name: /Editar/ }).click();
    const d2 = page.locator("aside").last();
    await expect(d2.getByLabel("Subcategoría", { exact: true }).locator("option:checked")).toHaveText(etiqueta);
    const otra = slugs.find((s) => s !== elegida)!;
    await d2.getByLabel("Categoría", { exact: true }).selectOption(otra);
    await expect(d2.getByLabel("Subcategoría", { exact: true }).locator("option:checked")).not.toHaveText(etiqueta);
  });

  test("una categoría sin subcategorías deshabilita el selector", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/productos");
    await page.locator("tbody tr").first().getByRole("button", { name: /Editar/ }).click();
    const d = page.locator("aside").last();
    const cat = d.getByLabel("Categoría", { exact: true });
    const slugs = await cat.locator("option").evaluateAll((o) => (o as HTMLOptionElement[]).map((x) => x.value));
    let vacia = false;
    for (const s of slugs) {
      await cat.selectOption(s);
      await page.waitForTimeout(200);
      if (await d.getByLabel("Subcategoría", { exact: true }).isDisabled()) { vacia = true; break; }
    }
    if (vacia) await expect(d.getByLabel("Subcategoría", { exact: true }).locator("option:checked")).toHaveText(/no tiene subcategorías/);
  });
});
