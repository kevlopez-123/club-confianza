import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { leer } from "../core/leer";
import { RouterLink } from "@angular/router";
import { ApiService } from "../core/api.service";
import { CatalogService } from "../core/catalog.service";
import { StoreService } from "../core/store.service";
import { BrandService } from "../core/brand.service";
import { estadoLabels, tipoLabels } from "../core/labels";
import { formatPuntos, formatUSD, nivelPorPuntos } from "../core/format";
import type { Beneficio, BeneficioUsuario, Compra, EstadoBeneficio, Movimiento, Notificacion, TipoMovimiento } from "../core/models";
import { haceTiempo } from "../core/tiempo";
import { descargarBlob } from "../core/pdf-cotizacion";
import { pdfEstadoCuenta } from "../core/pdf-estado-cuenta";
import { ToastService } from "../shared/toast";
import { ICONO_NOTIFICACION } from "../shared/notificaciones";
import { Countdown } from "../shared/countdown";
import { QrCodeComponent } from "../shared/qr-code";
import { cuponComoPdf } from "../core/cupon-pdf";
import { cuponComoPng } from "../core/cupon-imagen";
import type { DatosCupon } from "../core/cupon-datos";
import { ofuscarDocumento } from "../core/documento";
import { fechaLarga } from "../core/cupones";
import { cargarQr } from "../core/qr";
import { IconComponent } from "../shared/icon.component";
import { LimpiarFiltrosComponent } from "../shared/limpiar-filtros";
import { ModalComponent } from "../shared/ui";
import { NivelResumenCardComponent } from "../shared/widgets";

/* ------------------------------------------------------------------ */
/* Mi nivel                                                            */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-mi-nivel-page",
  imports: [IconComponent, NivelResumenCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Mi nivel</h1>
        <p class="mt-2 max-w-2xl text-base text-muted-foreground">
          {{ catalog.subtituloNiveles() }}
          Llevas <strong class="text-ink">{{ puntos(puntosNivel()) }}</strong> {{ brand.unidad() }} acumulados en el periodo.
        </p>

        <div class="mt-7"><app-nivel-resumen-card [puntos]="puntosNivel()" /></div>

        <h2 class="mt-10 text-xl font-extrabold text-ink lg:text-2xl">Rangos y beneficios por nivel</h2>
        <div class="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          @for (n of catalog.niveles(); track n.id; let i = $index) {
            <article class="flex flex-col rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]"
              [class.ring-2]="n.id === actual()?.id" [style.--tw-ring-color]="n.id === actual()?.id ? n.color : null">
              <span class="grid h-12 w-12 place-items-center rounded-full" [style.background]="n.color + '22'">
                <app-icon name="Gem" class="h-6 w-6" [style.color]="n.color" />
              </span>
              <h3 class="mt-4 text-lg font-extrabold text-ink">{{ n.nombre }}</h3>
              <p class="text-base text-muted-foreground">{{ puntos(n.desde) }}{{ n.hasta ? ' – ' + puntos(n.hasta) : ' a más' }} {{ brand.unidad() }}</p>
              <ul class="mt-4 space-y-2 text-base text-muted-foreground">
                @for (b of n.beneficios; track b) {
                  <li class="flex gap-2">
                    @if (i <= idxActual()) {
                      <app-icon name="Check" class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    } @else {
                      <app-icon name="Lock" class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" />
                    }
                    {{ b }}
                  </li>
                }
              </ul>
              @if (n.id === actual()?.id) {
                <p class="mt-4 text-base font-bold" [style.color]="n.color">Tu nivel actual</p>
              }
            </article>
          }
        </div>
      </div>
    </div>
  `,
})
export class MiNivelPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly brand = inject(BrandService);
  private readonly store = inject(StoreService);
  protected readonly puntos = formatPuntos;
  protected readonly puntosNivel = computed(() => this.store.usuario().puntosNivel);
  protected readonly actual = computed(() => {
    const n = this.catalog.niveles();
    return n.length ? nivelPorPuntos(n, this.puntosNivel()) : null;
  });
  protected readonly idxActual = computed(() => this.catalog.niveles().findIndex((n) => n.id === this.actual()?.id));
}

/* ------------------------------------------------------------------ */
/* Mis beneficios                                                      */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-mis-beneficios-page",
  imports: [RouterLink, IconComponent, LimpiarFiltrosComponent, Countdown, ModalComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Mis beneficios</h1>
        <p class="mt-2 max-w-2xl text-base text-muted-foreground">
          Historial de los cupones que has generado. Los activos pueden presentarse en el comercio antes de su vencimiento.
        </p>

        <div class="mt-7 grid gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div class="relative min-w-0">
            <label for="buscar-beneficios" class="sr-only">Buscar beneficio</label>
            <input id="buscar-beneficios" type="search" [value]="q()" (input)="q.set($any($event.target).value)"
              placeholder="Buscar por marca, beneficio o código"
              class="h-12 w-full rounded-full bg-muted pl-5 pr-12 text-base text-ink outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50" />
            <app-icon name="Search" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
          </div>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            @for (f of filtros; track f.value) {
              <button type="button" (click)="estado.set(f.value)" [attr.aria-pressed]="estado() === f.value"
                [class]="'min-h-11 rounded-full px-5 text-base font-semibold transition-colors lg:min-h-14 ' + (estado() === f.value ? 'bg-primary text-primary-foreground' : 'border border-border text-ink hover:border-primary hover:text-primary')">
                {{ f.label }}
              </button>
            }
            <app-limpiar-filtros [activo]="!!q() || estado() !== 'todos'" (limpiar)="q.set(''); estado.set('todos')" />
          </div>
        </div>

        <p class="mt-5 text-sm text-muted-foreground" aria-live="polite">{{ lista().length === todos().length ? todos().length : lista().length + " de " + todos().length }} {{ todos().length === 1 ? "cupón" : "cupones" }}@if (totalAhorrado() > 0) { · <span class="font-semibold text-primary" data-testid="ahorro-total">Has ahorrado {{ usd(totalAhorrado()) }} con tus cupones</span> }</p>
        <div class="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          @for (x of lista(); track x.mb.id) {
            <article class="flex flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div class="flex gap-4">
                <img [src]="x.b.imagen" [alt]="x.b.marca" class="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24" loading="lazy" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm uppercase tracking-wide text-muted-foreground">{{ x.b.marca }}</p>
                  <h2 class="text-base font-extrabold text-ink">{{ x.b.nombre }}</h2>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span [class]="'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ' + estadoClase[x.vencido && x.mb.estado === 'activo' ? 'vencido' : x.mb.estado]">
                      <app-icon name="Ticket" class="h-4 w-4" />
                      {{ estadoLabels[x.vencido && x.mb.estado === 'activo' ? 'vencido' : x.mb.estado] }}
                    </span>
                    @if (x.mb.estado === 'usado' && x.mb.ahorroSoles !== undefined) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary" data-testid="ahorro">
                        <app-icon name="PiggyBank" class="h-4 w-4" />
                        Ahorraste {{ usd(x.mb.ahorroSoles) }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- El código en grande y con botón para copiarlo: es lo que se muestra en el comercio -->
              <div class="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Código</p>
                  <p class="break-all font-mono text-lg font-extrabold tracking-wide text-ink">{{ x.mb.codigo }}</p>
                </div>
                <button type="button" (click)="copiar(x.mb.codigo)" [attr.aria-label]="'Copiar código ' + x.mb.codigo"
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                  <app-icon name="Copy" class="h-5 w-5" />
                </button>
              </div>

              <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt class="text-muted-foreground">Generado</dt><dd class="font-semibold text-ink">{{ x.mb.fecha }}</dd></div>
                <div><dt class="text-muted-foreground">{{ x.vencido ? "Venció" : "Vence" }}</dt><dd class="font-semibold text-ink">{{ x.mb.vence }}</dd></div>
              </dl>
              @if (x.vigente) {
                <p class="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><app-icon name="Clock" class="h-4 w-4 text-primary" /> Te quedan <app-countdown [expira]="x.expira" [compacto]="true" /></p>
              }

              <div class="mt-auto flex flex-wrap gap-3 pt-4 sm:justify-end">
                @if (x.vigente) {
                  <button type="button" (click)="verQr.set(x.mb.id)"
                    class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground sm:flex-none lg:min-h-14">
                    <app-icon name="QrCode" class="h-4 w-4" />
                    Ver QR
                  </button>
                }
                <a [routerLink]="['/beneficios', x.b.id]"
                  [class]="'inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-6 text-base font-bold sm:flex-none lg:min-h-14 ' + (x.vigente ? 'border border-border text-ink hover:border-primary hover:text-primary' : 'bg-primary text-primary-foreground')">
                  Ver detalles
                </a>
              </div>
            </article>
          }
          @if (lista().length === 0) {
            <p class="rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)] lg:col-span-2">No hay beneficios con ese criterio.</p>
          }
        </div>

        <app-modal [open]="!!qr()" title="Tu cupón" (closed)="verQr.set(null)">
          @if (qr(); as q) {
            <div class="text-center">
              <p class="text-sm text-muted-foreground">{{ q.b.marca }} · {{ q.b.nombre }}</p>
              <p class="mt-3 text-sm text-ink">Presenta este QR a un encargado del local.</p>
              <div class="mt-3"><app-countdown [expira]="q.expira" /></div>
              <app-qr [valor]="q.mb.codigo" clase="mx-auto mt-4 h-48 w-48" />
              <p class="mt-2 break-all font-mono text-lg font-extrabold text-ink">{{ q.mb.codigo }}</p>
              <div class="mt-4 flex flex-wrap justify-center gap-3">
                <button type="button" (click)="copiar(q.mb.codigo)" class="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-base font-bold text-ink hover:border-primary hover:text-primary">
                  <app-icon name="Copy" class="h-4 w-4" /> Copiar código
                </button>
                <button type="button" (click)="descargarPdf(q)" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground">
                  <app-icon name="Download" class="h-4 w-4" /> Descargar PDF
                </button>
                <button type="button" (click)="descargarImagen(q)" class="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-base font-bold text-ink hover:border-primary hover:text-primary">
                  <app-icon name="Image" class="h-4 w-4" /> Descargar imagen
                </button>
              </div>
            </div>
          }
        </app-modal>
      </div>
    </div>
  `,
})
export class MisBeneficiosPage {
  private readonly api = inject(ApiService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly brand = inject(BrandService);
  private readonly store = inject(StoreService);
  private readonly mis = leer(this.api.get<BeneficioUsuario[]>("me/beneficios"), [] as BeneficioUsuario[]);

  protected readonly estadoLabels = estadoLabels;
  protected readonly estadoClase: Record<EstadoBeneficio, string> = {
    activo: "bg-lima/25 text-ink",
    usado: "bg-secondary text-secondary-foreground",
    vencido: "bg-muted text-muted-foreground",
  };
  protected readonly filtros: { value: EstadoBeneficio | "todos"; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activo", label: "Activos" },
    { value: "usado", label: "Usados" },
    { value: "vencido", label: "Vencidos" },
  ];

  protected readonly q = signal("");
  protected readonly estado = signal<EstadoBeneficio | "todos">("todos");
  protected readonly verQr = signal<string | null>(null);

  /** «dd/mm/aaaa hh:mm» → milisegundos (0 si no se puede leer). */
  private static aMs(vence: string): number {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(vence);
    return m ? new Date(+m[3]!, +m[2]! - 1, +m[1]!, +(m[4] ?? 23), +(m[5] ?? 59)).getTime() : 0;
  }

  /** Cada cupón con su vencimiento: los que se pueden usar ahora van primero (el que vence antes, arriba) y luego el resto, del más reciente al más antiguo. */
  private readonly todos = computed(() => {
    const ahora = Date.now();
    return this.mis()
      .map((mb) => {
        const expira = MisBeneficiosPage.aMs(mb.vence);
        return { mb, b: this.catalog.beneficioPorId(mb.beneficioId), expira, vigente: mb.estado === "activo" && expira > ahora, vencido: mb.estado === "vencido" || (mb.estado !== "usado" && expira <= ahora) };
      })
      .filter((x): x is typeof x & { b: NonNullable<typeof x.b> } => !!x.b)
      .sort((p, q) => (p.vigente !== q.vigente ? (p.vigente ? -1 : 1) : p.vigente ? p.expira - q.expira : q.expira - p.expira));
  });

  protected readonly lista = computed(() => {
    const t = this.q().trim().toLowerCase();
    const estado = this.estado();
    return this.todos().filter((x) => {
      // El filtro usa el estado que ve la persona: un cupón «activo» cuya fecha ya pasó se muestra (y se filtra) como vencido.
      const efectivo = x.vigente ? "activo" : x.vencido ? "vencido" : x.mb.estado;
      if (estado !== "todos" && efectivo !== estado) return false;
      return !t || `${x.b.nombre} ${x.b.marca} ${x.mb.codigo}`.toLowerCase().includes(t);
    });
  });
  protected readonly qr = computed(() => this.todos().find((x) => x.mb.id === this.verQr()) ?? null);
  protected readonly usd = formatUSD;
  /** Soles ahorrados en total con los cupones ya usados. */
  protected readonly totalAhorrado = computed(() => this.todos().reduce((s, x) => s + (x.mb.estado === "usado" ? (x.mb.ahorroSoles ?? 0) : 0), 0));

  /** Datos del cupón para guardarlo como imagen o PDF (documento ofuscado, QR, vencimiento y locales de canje). */
  private async datos(x: { mb: BeneficioUsuario; b: Beneficio }): Promise<DatosCupon> {
    const logo = this.brand.marca().logoOscuro;
    const qr = await cargarQr().then((m) => m.toDataURL(x.mb.codigo, { width: 220, margin: 1, errorCorrectionLevel: "M" })).catch(() => undefined);
    const perfil = this.store.perfil();
    return {
      programa: this.brand.programa(),
      color: this.brand.tenant().tema.primario,
      banco: this.brand.marca().nombre,
      logo: logo ? new URL(logo, document.baseURI).href : undefined,
      beneficio: x.b.nombre,
      comercio: x.b.marca,
      descuento: x.b.descuento,
      codigo: x.mb.codigo,
      qr,
      documentoEtiqueta: perfil?.tipoDocumento || this.brand.pais().documentos[0]?.label || "Documento",
      documento: ofuscarDocumento(perfil?.codigoParticipante),
      venceEl: x.mb.vence,
      vigenciaHasta: x.b.hasta ? fechaLarga(x.b.hasta) : undefined,
      locales: this.catalog.localesDeBeneficio(x.b).map((l) => ({ nombre: l.nombre, direccion: l.direccion, distrito: l.distrito, horario: l.horario })),
      terminos: x.b.terminos,
    };
  }
  protected async descargarPdf(x: { mb: BeneficioUsuario; b: Beneficio }) {
    try {
      descargarBlob(await cuponComoPdf(await this.datos(x)), `cupon-${x.mb.codigo}.pdf`);
    } catch {
      this.toast.error("No se pudo generar el PDF del cupón.");
    }
  }
  protected async descargarImagen(x: { mb: BeneficioUsuario; b: Beneficio }) {
    try {
      descargarBlob(await cuponComoPng(await this.datos(x)), `cupon-${x.mb.codigo}.png`);
    } catch {
      this.toast.error("No se pudo generar la imagen del cupón.");
    }
  }

  protected async copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      this.toast.show("Código copiado");
    } catch {
      this.toast.error("No se pudo copiar. Selecciona el código y cópialo manualmente.");
    }
  }
}

/* ------------------------------------------------------------------ */
/* Mis compras                                                         */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-mis-compras-page",
  imports: [RouterLink, IconComponent, LimpiarFiltrosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Mis canjes</h1>
        <p class="mt-2 max-w-2xl text-base text-muted-foreground">Revisa el detalle de cada pedido, su estado y la forma de pago utilizada.</p>

        <div class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] lg:items-end">
          <div class="relative sm:col-span-2 lg:col-span-1">
            <label for="buscar-compras" class="sr-only">Buscar canje</label>
            <input id="buscar-compras" type="search" [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Buscar por código o producto"
              class="h-12 w-full rounded-full bg-card pl-5 pr-12 text-base text-ink shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50" />
            <app-icon name="Search" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
          </div>
          <label class="text-sm font-semibold text-ink">
            Desde
            <input type="date" [value]="desde()" [max]="hasta() || null" (input)="desde.set($any($event.target).value)"
              class="mt-1 h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-ink focus:ring-2 focus:ring-primary/50" />
          </label>
          <label class="text-sm font-semibold text-ink">
            Hasta
            <input type="date" [value]="hasta()" [min]="desde() || null" (input)="hasta.set($any($event.target).value)"
              class="mt-1 h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-ink focus:ring-2 focus:ring-primary/50" />
          </label>
          <app-limpiar-filtros [activo]="!!q() || !!desde() || !!hasta()" (limpiar)="q.set(''); desde.set(''); hasta.set('')" />
        </div>

        <p class="mt-5 text-sm text-muted-foreground" aria-live="polite">{{ lista().length === compras().length ? compras().length : lista().length + " de " + compras().length }} {{ compras().length === 1 ? "pedido" : "pedidos" }}</p>
        <div class="mt-3 grid gap-4">
          @for (c of lista(); track c.codigo) {
            <article class="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div class="min-w-0">
                  <p class="text-base text-muted-foreground"><span class="whitespace-nowrap">Pedido {{ c.codigo }}</span> · <span class="whitespace-nowrap">{{ c.fecha }}@if (c.hora) { · {{ c.hora }} }</span></p>
                  <h2 class="break-words text-base font-extrabold text-ink">{{ resumen(c) }}</h2>
                  <p class="text-base text-muted-foreground">{{ puntos(c.puntosUsados) }} puntos{{ c.montoUSD > 0 ? ' + ' + usd(c.montoUSD) : '' }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">{{ c.estado }}</span>
                  <a [routerLink]="['/mis-compras', c.codigo]"
                    class="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-base font-bold text-primary-foreground lg:min-h-14">Ver detalles</a>
                </div>
              </div>
              <!-- Fotos superpuestas: con muchos productos solo se ven las primeras y un «+N» -->
              <div class="mt-4 flex items-center">
                @for (i of c.items.slice(0, 4); track i.nombre; let primero = $first) {
                  <img [src]="i.imagen" alt="" [class]="'h-14 w-14 rounded-xl border-2 border-card object-cover ' + (primero ? '' : '-ml-3')" />
                }
                @if (c.items.length > 4) {
                  <span class="-ml-3 grid h-14 w-14 place-items-center rounded-xl border-2 border-card bg-secondary text-sm font-bold text-primary" [attr.aria-label]="(c.items.length - 4) + ' productos más'">+{{ c.items.length - 4 }}</span>
                }
              </div>
            </article>
          }
          @if (lista().length === 0) {
            <p class="rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">No encontramos canjes con ese criterio.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class MisComprasPage {
  private readonly compras = leer(inject(ApiService).get<Compra[]>("me/compras"), [] as Compra[]);
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
  protected readonly q = signal("");

  /** «Primer producto» o «Primer producto y N productos más»: una línea aunque el pedido tenga muchos. */
  protected resumen(c: Compra) {
    const n = c.items.length - 1;
    return n > 0 ? c.items[0]!.nombre + " y " + n + (n === 1 ? " producto más" : " productos más") : (c.items[0]?.nombre ?? "");
  }
  protected readonly desde = signal("");
  protected readonly hasta = signal("");
  protected readonly lista = computed(() => {
    const t = this.q().trim().toLowerCase();
    const d = this.desde();
    const h = this.hasta();
    return this.compras().filter((c) => {
      // La fecha del pedido viene como dd/mm/aaaa; se compara como aaaa-mm-dd (ambos extremos incluidos).
      const iso = c.fecha.split("/").reverse().join("-");
      if (d && iso < d) return false;
      if (h && iso > h) return false;
      return !t || c.codigo.toLowerCase().includes(t) || c.items.some((i) => `${i.nombre} ${i.marca}`.toLowerCase().includes(t));
    });
  });
}

@Component({
  selector: "app-detalle-compra-page",
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <a routerLink="/mis-compras" class="inline-flex min-h-11 items-center gap-2 text-base font-semibold text-primary">
          <app-icon name="ArrowLeft" class="h-4 w-4" /> Volver al historial
        </a>

        @if (compra(); as compra) {
          <!-- Cuatro tarjetas, como en la app: estado y seguimiento, productos, entrega y resumen de pago -->
          <div class="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <div class="grid gap-5">
              <section class="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="pedido-titulo">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h1 id="pedido-titulo" class="text-2xl font-extrabold text-ink">Pedido {{ compra.codigo }}</h1>
                    <p class="mt-1 text-base text-muted-foreground">Realizado el {{ compra.fecha }}@if (compra.hora) { a las {{ compra.hora }} }</p>
                  </div>
                  <span [class]="'rounded-full px-4 py-1.5 text-sm font-bold ' + (compra.estado === 'Cancelado' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground')">{{ compra.estado }}</span>
                </div>

                @if (compra.estado === 'Cancelado') {
                  <p role="status" class="mt-5 flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                    <app-icon name="AlertCircle" class="mt-0.5 h-5 w-5 shrink-0" />
                    <span>Este pedido fue cancelado. Los puntos que usaste volvieron a tu saldo.</span>
                  </p>
                } @else {
                  <ol class="mt-5" aria-label="Seguimiento del pedido">
                    @for (p of pasos; track p; let i = $index; let ultimo = $last) {
                      <li class="relative flex gap-3 pb-5 last:pb-0">
                        @if (!ultimo) { <span aria-hidden="true" [class]="'absolute left-[15px] top-8 bottom-0 w-0.5 ' + (i < avance(compra.estado) ? 'bg-primary' : 'bg-border')"></span> }
                        <span [class]="'relative grid h-8 w-8 shrink-0 place-items-center rounded-full ' + (i <= avance(compra.estado) ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-muted-foreground')">
                          @if (i <= avance(compra.estado)) { <app-icon name="Check" class="h-4 w-4" /> } @else { <span class="h-2 w-2 rounded-full bg-border"></span> }
                        </span>
                        <div class="min-w-0 pt-0.5">
                          <p [class]="'text-base ' + (i <= avance(compra.estado) ? 'font-bold text-ink' : 'text-muted-foreground')">{{ p.titulo }}</p>
                          <p class="text-sm text-muted-foreground">{{ p.detalle }}</p>
                        </div>
                      </li>
                    }
                  </ol>
                }
              </section>

              <section class="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="productos-titulo">
                <h2 id="productos-titulo" class="text-lg font-extrabold text-ink">Productos</h2>
                <div class="mt-4 grid gap-3">
                  @for (i of compra.items; track i.nombre) {
                    <div class="flex items-center gap-4 rounded-2xl bg-surface p-3 sm:p-4">
                      <img [src]="i.imagen" alt="" class="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                      <div class="min-w-0 flex-1">
                        <p class="text-sm uppercase tracking-wide text-muted-foreground">{{ i.marca }}</p>
                        <p class="text-base font-extrabold text-ink">{{ i.nombre }}</p>
                        <p class="text-sm text-muted-foreground">Cantidad: {{ i.cantidad }}</p>
                      </div>
                      <p class="shrink-0 text-right text-base font-extrabold text-ink">{{ puntos(i.puntos * i.cantidad) }}<span class="block text-xs font-medium text-muted-foreground">puntos</span></p>
                    </div>
                  }
                </div>
              </section>
            </div>

            <div class="grid gap-5">
              <section class="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="entrega-titulo">
                <h2 id="entrega-titulo" class="text-lg font-extrabold text-ink">Entrega</h2>
                <p class="mt-3 flex items-start gap-3 text-base text-ink">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary"><app-icon [name]="entregaDigital(compra.entrega) ? 'Mail' : 'MapPin'" class="h-5 w-5" /></span>
                  <span class="min-w-0 pt-2 font-semibold">{{ compra.entrega }}</span>
                </p>
              </section>

              <section class="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="pago-titulo">
                <h2 id="pago-titulo" class="text-lg font-extrabold text-ink">Resumen de pago</h2>
                <dl class="mt-4 space-y-3 text-base">
                  <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Puntos utilizados</dt><dd class="font-semibold text-ink">{{ puntos(compra.puntosUsados) }} puntos</dd></div>
                </dl>
              </section>
            </div>
          </div>
        } @else if (compras()) {
          <p class="mt-6 rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">No encontramos ese pedido.</p>
        }
      </div>
    </div>
  `,
})
export class DetalleCompraPage {
  readonly codigo = input.required<string>();
  /** Etapas del pedido, de la confirmación a la entrega. */
  protected readonly pasos = [
    { titulo: "Pedido confirmado", detalle: "Recibimos tu pedido y descontamos tus puntos." },
    { titulo: "Preparando tu pedido", detalle: "Estamos alistando tus productos." },
    { titulo: "Pedido enviado", detalle: "Va rumbo a tu dirección o a tu correo." },
    { titulo: "Pedido entregado", detalle: "Ya lo tienes contigo." },
  ];
  /** Última etapa alcanzada (posición en `pasos`). */
  protected avance(estado: Compra["estado"]): number {
    return estado === "Entregado" ? 3 : estado === "En camino" ? 2 : estado === "Procesando" ? 1 : 0;
  }
  protected entregaDigital(entrega: string): boolean {
    return /correo|digital|email/i.test(entrega);
  }
  protected readonly compras = leer(inject(ApiService).get<Compra[] | undefined>("me/compras"), undefined);
  protected readonly compra = computed(() => this.compras()?.find((c) => c.codigo === this.codigo()));
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
}

/* ------------------------------------------------------------------ */
/* Historial de puntos                                                 */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-historial-puntos-page",
  imports: [IconComponent, NivelResumenCardComponent, LimpiarFiltrosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Historial de puntos</h1>
        <p class="mt-2 max-w-2xl text-base text-muted-foreground">Revisa el movimiento de tus puntos por periodo y descarga tu estado de cuenta.</p>

        <div class="mt-7"><app-nivel-resumen-card [puntos]="store.usuario().puntosNivel" /></div>

        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <span class="flex items-center gap-2 text-base text-muted-foreground"><app-icon name="PiggyBank" class="h-5 w-5 text-primary" /> Saldo actual</span>
            <p class="mt-2 text-2xl font-extrabold text-primary">{{ puntos(store.puntos()) }}</p>
          </div>
          <div class="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <span class="text-base text-muted-foreground">Ganados en el periodo</span>
            <p class="mt-2 text-2xl font-extrabold text-ink">+{{ puntos(ganados()) }}</p>
          </div>
          <div class="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <span class="text-base text-muted-foreground">Usados en el periodo</span>
            <p class="mt-2 text-2xl font-extrabold text-ink">{{ puntos(usados()) }}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end">
          <label class="text-base font-semibold text-ink">
            Desde
            <input type="date" [value]="desde()" (input)="desde.set($any($event.target).value)"
              class="mt-1 h-12 w-full rounded-xl border border-border px-4 text-base text-ink focus:ring-2 focus:ring-primary/50" />
          </label>
          <label class="text-base font-semibold text-ink">
            Hasta
            <input type="date" [value]="hasta()" (input)="hasta.set($any($event.target).value)"
              class="mt-1 h-12 w-full rounded-xl border border-border px-4 text-base text-ink focus:ring-2 focus:ring-primary/50" />
          </label>
          <label class="text-base font-semibold text-ink">
            Tipo de movimiento
            <select [value]="tipo()" (change)="tipo.set($any($event.target).value)"
              class="select-field mt-1 h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-ink focus:ring-2 focus:ring-primary/50">
              @for (t of tipos; track t) {
                <option [value]="t" [selected]="t === tipo()">{{ t === "todos" ? "Todos" : tipoLabels[t] }}</option>
              }
            </select>
          </label>
          <app-limpiar-filtros [activo]="filtrosActivos()" (limpiar)="restablecerFiltros()" />
          <button type="button" (click)="descargar()" [disabled]="generando()" [attr.aria-busy]="generando()"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground transition-all hover:scale-[1.03] hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100 lg:min-h-14">
            @if (generando()) {
              <span class="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" aria-hidden="true"></span> Generando PDF…
            } @else {
              <app-icon name="ArrowDownToLine" class="h-5 w-5" />
              Estado de cuenta
            }
          </button>
        </div>

        <!-- Móvil: tarjetas -->
        <ul class="mt-6 grid gap-3 lg:hidden">
          @for (m of lista(); track m.id) {
            <li class="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 text-base font-semibold text-ink">{{ m.detalle }}</p>
                <p [class]="'shrink-0 text-base font-extrabold ' + (m.puntos > 0 ? 'text-primary' : 'text-ink')">{{ m.puntos > 0 ? "+" : "" }}{{ puntos(m.puntos) }}</p>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span class="rounded-full bg-surface px-3 py-1 font-semibold text-ink">{{ tipoLabels[m.tipo] }}</span>
                <span>{{ m.fecha }}</span>
              </div>
            </li>
          }
          @if (lista().length === 0) {
            <li class="rounded-2xl bg-card p-6 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">No hay movimientos en el rango seleccionado.</li>
          }
        </ul>

        <!-- Desktop: tabla -->
        <div class="mt-6 hidden overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-card)] lg:block">
          <table class="w-full min-w-[640px] text-left text-base">
            <caption class="sr-only">Movimientos de puntos del periodo seleccionado</caption>
            <thead class="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" class="px-5 py-4">Fecha</th>
                <th scope="col" class="px-5 py-4">Detalle</th>
                <th scope="col" class="px-5 py-4">Tipo</th>
                <th scope="col" class="px-5 py-4 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              @for (m of lista(); track m.id) {
                <tr class="border-t border-border">
                  <td class="px-5 py-4 text-muted-foreground">{{ m.fecha }}</td>
                  <td class="px-5 py-4 font-semibold text-ink">{{ m.detalle }}</td>
                  <td class="px-5 py-4 text-muted-foreground">{{ tipoLabels[m.tipo] }}</td>
                  <td [class]="'px-5 py-4 text-right font-extrabold ' + (m.puntos > 0 ? 'text-primary' : 'text-ink')">{{ m.puntos > 0 ? "+" : "" }}{{ puntos(m.puntos) }}</td>
                </tr>
              }
              @if (lista().length === 0) {
                <tr><td colspan="4" class="px-5 py-8 text-center text-muted-foreground">No hay movimientos en el rango seleccionado.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class HistorialPuntosPage {
  protected readonly store = inject(StoreService);
  private readonly movimientos = leer(inject(ApiService).get<Movimiento[]>("me/movimientos"), [] as Movimiento[]);
  protected readonly puntos = formatPuntos;
  protected readonly tipoLabels = tipoLabels;
  protected readonly tipos: (TipoMovimiento | "todos")[] = ["todos", "acumulacion", "canje", "compra", "vencimiento", "ajuste"];

  protected readonly tipo = signal<TipoMovimiento | "todos">("todos");
  protected readonly desde = signal("2026-05-01");
  protected readonly hasta = signal("2026-12-31");
  /** El periodo por defecto no cuenta como filtro: solo lo que se cambió. */
  protected readonly filtrosActivos = computed(() => this.tipo() !== "todos" || this.desde() !== "2026-05-01" || this.hasta() !== "2026-12-31");
  protected restablecerFiltros() {
    this.tipo.set("todos");
    this.desde.set("2026-05-01");
    this.hasta.set("2026-12-31");
  }

  protected readonly lista = computed(() =>
    this.movimientos().filter((m) => (this.tipo() === "todos" || m.tipo === this.tipo()) && m.fechaISO >= this.desde() && m.fechaISO <= this.hasta()),
  );
  protected readonly ganados = computed(() => this.lista().filter((m) => m.puntos > 0).reduce((a, m) => a + m.puntos, 0));
  protected readonly usados = computed(() => this.lista().filter((m) => m.puntos < 0).reduce((a, m) => a + m.puntos, 0));

  private readonly toast = inject(ToastService);
  private readonly brand = inject(BrandService);
  protected readonly generando = signal(false);

  /** Genera el estado de cuenta en PDF con el periodo y los filtros que se están viendo. */
  protected descargar() {
    if (this.generando()) return;
    this.generando.set(true);
    // Deja pintar el estado "Generando" antes de armar el archivo.
    setTimeout(() => {
      try {
        const color = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
        const f = (iso: string) => iso.split("-").reverse().join("/");
        const blob = pdfEstadoCuenta({
          programa: this.brand.programa(),
          participante: this.store.usuario().nombre,
          periodo: `${f(this.desde())} al ${f(this.hasta())}${this.tipo() !== "todos" ? ` - ${tipoLabels[this.tipo() as TipoMovimiento]}` : ""}`,
          generado: new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }),
          color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#00bdd2",
          saldo: formatPuntos(this.store.puntos()),
          ganados: formatPuntos(this.ganados()),
          usados: formatPuntos(this.usados()),
          filas: this.lista().map((m) => ({ fecha: m.fecha, detalle: m.detalle, tipo: tipoLabels[m.tipo], puntos: m.puntos })),
          formatoPuntos: formatPuntos,
        });
        descargarBlob(blob, `estado-de-cuenta-puntos-${this.desde()}-${this.hasta()}.pdf`);
        this.toast.show("Estado de cuenta descargado");
      } catch {
        this.toast.error("No pudimos generar el estado de cuenta. Inténtalo de nuevo.");
      } finally {
        this.generando.set(false);
      }
    }, 120);
  }}

/* ------------------------------------------------------------------ */
/* Notificaciones                                                      */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-notificaciones-page",
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Notificaciones</h1>
            <p class="mt-2 max-w-2xl text-base text-muted-foreground">Novedades de tus pedidos, puntos, beneficios y cotizaciones de vuelos.</p>
          </div>
          @if (store.noLeidas()) {
            <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90" (click)="store.marcarLeidas()">
              <app-icon name="CheckCheck" class="h-4 w-4" /> Marcar todas como leídas
            </button>
          }
        </div>

        <div role="tablist" aria-label="Filtro de notificaciones" class="mt-6 inline-flex rounded-full bg-card p-1 shadow-[var(--shadow-card)]">
          @for (t of tabs; track t.id) {
            <button role="tab" type="button" [attr.aria-selected]="filtro() === t.id" (click)="filtro.set(t.id)"
              [class]="'min-h-10 rounded-full px-5 text-sm font-bold ' + (filtro() === t.id ? 'bg-primary text-primary-foreground' : 'text-ink hover:bg-muted')">
              {{ t.label }}@if (t.id === 'sin-leer' && store.noLeidas()) { ({{ store.noLeidas() }}) }
            </button>
          }
        </div>

        <ul class="mt-6 grid gap-3">
          @for (n of lista(); track n.id) {
            <li>
              <a [routerLink]="n.enlace || '/notificaciones'" (click)="abrir(n)"
                [class]="'flex gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-muted/60 ' + (n.leida ? '' : 'ring-2 ring-primary/30')">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><app-icon [name]="icono[n.tipo]" class="h-5 w-5" /></span>
                <span class="min-w-0 flex-1">
                  <span class="block text-base text-ink" [class.font-extrabold]="!n.leida" [class.font-semibold]="n.leida">{{ n.titulo }}</span>
                  <span class="block text-base text-muted-foreground">{{ n.texto }}</span>
                  <span class="mt-1 block text-sm text-muted-foreground">{{ tiempo(n.fecha) }}</span>
                </span>
                @if (!n.leida) { <span class="mt-2 h-3 w-3 shrink-0 rounded-full bg-primary" aria-label="Sin leer"></span> }
              </a>
            </li>
          } @empty {
            <li class="rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">
              {{ filtro() === 'sin-leer' ? 'No tienes notificaciones sin leer.' : 'Todavía no tienes notificaciones.' }}
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class NotificacionesPage {
  protected readonly store = inject(StoreService);
  protected readonly tiempo = haceTiempo;
  protected readonly icono = ICONO_NOTIFICACION;
  protected readonly tabs = [{ id: "todas" as const, label: "Todas" }, { id: "sin-leer" as const, label: "Sin leer" }];
  protected readonly filtro = signal<"todas" | "sin-leer">("todas");
  protected readonly lista = computed(() => this.store.notificaciones().filter((n) => this.filtro() === "todas" || !n.leida));

  constructor() {
    this.store.cargarNotificaciones();
  }
  protected abrir(n: Notificacion) {
    if (!n.leida) this.store.marcarLeidas([n.id]);
  }
}