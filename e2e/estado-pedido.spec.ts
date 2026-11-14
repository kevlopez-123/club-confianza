import { expect, test } from "@playwright/test";
import { entrarAdmin, esperarCarga } from "./helpers";

const K = "confianza_mockdb_v1";

test.describe("El estado del pedido llega al participante", () => {
  test("al marcarlo como entregado en el panel, Mis compras lo muestra entregado", async ({ page }) => {
    await entrarAdmin(page); // el ingreso es una escritura: deja la base simulada guardada
    await page.waitForFunction((k) => !!localStorage.getItem(k), K);
    // El pedido de la participante demo, tal como lo ve el panel: físico y en preparación.
    await page.evaluate((k) => {
      const db = JSON.parse(localStorage.getItem(k)!);
      const p = db.admin.pedidos.find((x: any) => x.codigo === "BNB-9KD01MZ7");
      Object.assign(p, { estadoAdmin: "Preparando", digital: false, guia: "", email: db.perfil.correo, historial: [{ estado: "Confirmado", fecha: "14/07/2026 09:00" }, { estado: "Preparando", fecha: "14/07/2026 10:00" }] });
      localStorage.setItem(k, JSON.stringify(db));
    }, K);
    await page.goto("/admin/pedidos?ver=BNB-9KD01MZ7");
    await esperarCarga(page);
    const d = page.getByRole("dialog");
    await d.getByLabel("Número de guía (courier)").fill("SERV-48210");
    const guardado = (campo: string) => page.evaluate(([k, c]) => JSON.parse(localStorage.getItem(k!)!).admin.pedidos.find((x: any) => x.codigo === "BNB-9KD01MZ7")[c!], [K, campo]);
    await expect.poll(() => guardado("guia")).toBe("SERV-48210"); // cada guardado espera al anterior
    await page.waitForTimeout(500); // llega la respuesta con la versión nueva del pedido
    await d.getByRole("button", { name: "Marcar como Enviado" }).click();
    await expect(page.getByText(/Estado actualizado a Enviado/)).toBeVisible();
    await expect.poll(() => guardado("estadoAdmin")).toBe("Enviado");
    await page.waitForTimeout(500);
    await d.getByRole("button", { name: "Marcar como Entregado" }).click();
    await expect(page.getByText(/Estado actualizado a Entregado/)).toBeVisible();

    // el cambio se guarda en el servidor antes de abrir el sitio
    await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).admin.pedidos.find((c: any) => c.codigo === "BNB-9KD01MZ7").estadoAdmin, K)).toBe("Entregado");
    await page.goto("/mis-compras/BNB-9KD01MZ7");
    await expect(page.getByText("Entregado", { exact: true })).toBeVisible();
    await expect(page.getByText("En camino", { exact: true })).toHaveCount(0);
  });

  test("un pedido cancelado en el panel se ve como Cancelado, no como Confirmado", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/admin/pedidos?ver=BNB-31LOP9AA");
    await esperarCarga(page);
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    await page.getByRole("button", { name: "Sí, cancelar" }).click();
    await expect(page.getByText(/Pedido cancelado/)).toBeVisible();
    await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).admin.pedidos.find((c: any) => c.codigo === "BNB-31LOP9AA").estadoAdmin, K)).toBe("Cancelado");
    // los puntos usados (7.000) vuelven al saldo, una sola vez, y quedan en el historial
    const db = () => page.evaluate((k) => { const d = JSON.parse(localStorage.getItem(k)!); return { saldo: d.usuario.puntos as number, devs: d.movimientos.filter((m: any) => m.detalle.includes("Devolución por pedido cancelado BNB-31LOP9AA")).map((m: any) => m.puntos) }; }, K);
    expect((await db()).devs).toEqual([7000]);

    await page.goto("/mis-compras");
    await expect(page.locator("article").filter({ hasText: "BNB-31LOP9AA" }).getByText("Cancelado", { exact: true })).toBeVisible();
  });
});
