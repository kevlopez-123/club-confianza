import { expect, test, type Page } from "@playwright/test";
import { entrarAdmin } from "./helpers";

/** Pide la eliminación de la cuenta desde Mi perfil: avisa lo que pasa, pide el código del correo y deja la solicitud. */
const pedirEliminacion = async (page: Page) => {
  await page.goto("/perfil");
  await page.getByRole("link", { name: "Eliminar mi cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Eliminar mi cuenta", level: 1 })).toBeVisible();
  const continuar = page.getByRole("button", { name: "Continuar" });
  await expect(continuar).toBeDisabled(); // primero hay que confirmar que entiende lo que pasará
  await page.getByLabel("Entiendo lo que pasará con mi cuenta y mis puntos").check();
  await continuar.click();
  const enviar = page.getByRole("button", { name: "Solicitar eliminación" });
  await expect(enviar).toBeDisabled(); // sin los 6 dígitos no se puede enviar
  await page.getByLabel("Código de verificación").fill("123456");
  await enviar.click();
  await expect(page.getByRole("heading", { name: "Recibimos tu solicitud" })).toBeVisible();
};

test.describe("Eliminar mi cuenta", () => {
  test("la solicitud queda pendiente y la cuenta sigue activa", async ({ page }) => {
    await pedirEliminacion(page);
    await expect(page.getByText(/ELI-[A-Z0-9]{6}/).first()).toBeVisible();
    await expect(page.getByText("Pendiente", { exact: true })).toBeVisible();
    // Al volver se ve el estado de la solicitud en vez de pedirla otra vez.
    await page.goto("/perfil/eliminar-cuenta");
    await expect(page.getByRole("heading", { name: "Recibimos tu solicitud" })).toBeVisible();
    // La cuenta sigue activa: se puede abrir el perfil.
    await page.goto("/perfil");
    await expect(page.getByRole("tab", { name: "Datos personales" })).toBeVisible();
  });

  test("el equipo la atiende desde el panel y la persona recibe el aviso", async ({ page }) => {
    await pedirEliminacion(page);
    const codigo = (await page.getByText(/ELI-[A-Z0-9]{6}/).first().innerText()).match(/ELI-[A-Z0-9]{6}/)![0];

    await entrarAdmin(page);
    await page.goto("/admin/participantes/solicitudes-eliminacion");
    const fila = page.locator("tbody tr", { hasText: codigo });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText("Pendiente");
    await fila.getByRole("button", { name: codigo, exact: true }).click();
    await page.getByRole("button", { name: "Rechazar" }).isDisabled().then((d) => expect(d).toBe(true)); // rechazar exige un motivo
    await page.getByRole("button", { name: "Completar eliminación" }).click();
    await expect(page.getByText("Solicitud completada y persona avisada")).toBeVisible();
    await expect(fila).toContainText("Completada");

    // La persona recibió un correo y un aviso con lo que se hizo.
    await page.goto("/notificaciones");
    await expect(page.getByText(`Solicitud de eliminación ${codigo}`).first()).toBeVisible();
    await expect(page.getByText(/Eliminamos tu cuenta y tus datos personales/).first()).toBeVisible();
  });
});

test.describe("Eliminar mi cuenta: página pública", () => {
  // Sin sesión: es la dirección que se declara en las tiendas de aplicaciones para pedir la eliminación sin abrir la app.
  test.use({ storageState: { cookies: [], origins: [] } });

});

test.describe("Ingreso: reenviar código", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("«Reenviar código» espera 30 s y luego pide un código nuevo", async ({ page }) => {
    await page.clock.install();
    await page.goto("/login");
    await page.getByLabel("Número de documento").fill("1712345678");
    await page.getByRole("button", { name: "Continuar" }).click();
    const reenviar = page.getByRole("button", { name: /Reenviar código/ });
    await expect(reenviar).toBeDisabled(); // recién enviado: hay que esperar
    await expect(reenviar).toContainText("Reenviar código en");
    await page.clock.runFor(31_000); // dispara el temporizador cada segundo
    await expect(reenviar).toBeEnabled();
    await reenviar.click();
    await expect(page.getByText("Te enviamos un código nuevo.")).toBeVisible(); // antes el botón no hacía nada
    await expect(reenviar).toBeDisabled(); // y vuelve a esperar
  });
});
