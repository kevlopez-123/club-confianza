import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { distanciaKm, textoDistancia } from "../core/geo";
import { MapaLocalesComponent } from "../shared/mapa-locales";
import { ApiService } from "../core/api.service";
import { fechaLarga, listaTexto } from "../core/cupones";
import { SesionService } from "../core/sesion.service";
import { RouterLink } from "@angular/router";
import { CatalogService } from "../core/catalog.service";
import { claseEtiqueta } from "../core/promo";
import { StoreService } from "../core/store.service";
import { AnaliticaService } from "../core/analitica.service";
import { BrandService } from "../core/brand.service";
import { SeoService } from "../core/seo.service";
import { formatPuntos, formatUSD } from "../core/format";
import type { Beneficio, Orden_Producto, Producto } from "../core/models";
import { IconComponent } from "../shared/icon.component";
import { EstadoErrorComponent } from "../shared/estado-error";
import {
  AddedToCartModalComponent, BenefitCardComponent, HeroSliderComponent, ModalComponent, ProductCardComponent,
  SectionTitleComponent, agregarProducto,
} from "../shared/ui";
import {
  BenefitsSectionComponent, CategoryStripComponent, CtaDuoComponent, HomeCategoriesComponent, HomeCtaPuntosComponent, HomeDestinosComponent,
  OrdenSelectComponent, ProductSectionComponent, SearchFilterBarComponent,
} from "../shared/widgets";
import { Countdown } from "../shared/countdown";
import { QrCodeComponent } from "../shared/qr-code";
import { ToastService } from "../shared/toast";
import { cuponComoPdf } from "../core/cupon-pdf";
import { cuponComoPng } from "../core/cupon-imagen";
import type { DatosCupon } from "../core/cupon-datos";
import { ofuscarDocumento } from "../core/documento";
import { cargarQr } from "../core/qr";
import { descargarBlob } from "../core/pdf-base";

/* ------------------------------------------------------------------ */
/* Inicio                                                              */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-home-page",
  imports: [HeroSliderComponent, ProductSectionComponent, BenefitsSectionComponent, CtaDuoComponent, HomeCategoriesComponent, HomeDestinosComponent, HomeCtaPuntosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">{{ brand.programa() }}: canjea tus {{ brand.unidad() }} por productos y beneficios</h1>
    @for (s of secciones(); track s.id) {
      @switch (s.id) {
        @case ("banners") { <app-hero-slider [items]="catalog.bannersHome()" /> }
        @case ("productos") { <div class="animate-fade-up"><app-product-section /></div> }
        @case ("categorias") { <app-home-categories /> }
        @case ("beneficios") { <app-benefits-section /> }
        @case ("destinos") { <app-home-destinos /> }
        @case ("cta-puntos") { <app-home-cta-puntos /> }
        @case ("cta-duo") { <app-cta-duo /> }
      }
    }
  `,
})
export class HomePage {
  protected readonly catalog = inject(CatalogService);
  protected readonly brand = inject(BrandService);
  /** Orden y visibilidad de la portada: se configuran en Admin → Contenido → Secciones del Home. */
  protected readonly secciones = computed(() => {
    const porDefecto = ["banners", "productos", "beneficios", "cta-duo"].map((id) => ({ id, s: id, on: true }));
    return (this.catalog.config()?.seccionesHome ?? porDefecto).filter((s) => s.on);
  });
}

/* ------------------------------------------------------------------ */
/* Catálogo de productos (/canjea)                                     */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-canjea-page",
  imports: [EstadoErrorComponent, HeroSliderComponent, CategoryStripComponent, ProductCardComponent, OrdenSelectComponent, SearchFilterBarComponent, AddedToCartModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-slider [items]="catalog.bannersProductos()" />

    <section class="bg-background py-6">
      <div class="page-container">
        <app-category-strip [categorias]="catalog.categoriasProducto()" [conSubcategorias]="true"
          [value]="categoria()" (valueChange)="elegirCategoria($event)" [(subcategoria)]="subcategoria" />
      </div>
    </section>

    <section class="bg-surface py-10">
      <div class="page-container">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 class="min-w-0 text-xl font-extrabold text-ink sm:text-2xl">Increíbles productos para ti</h1>
          <app-orden-select [(value)]="orden" />
        </div>

        <div class="mt-5">
          <app-search-filter-bar [(query)]="query" [(marca)]="marca" [marcas]="marcas()" [extrasActivos]="!!subcategoria() || soloAlcanza()" (limpiado)="subcategoria.set(null); soloAlcanza.set(false)">
            @if (subs().length > 0) {
              <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subcategoría
                <select [value]="subcategoria() ?? ''" (change)="subcategoria.set($any($event.target).value || null)"
                  class="select-field mt-1 h-11 w-full rounded-full border border-border bg-card px-4 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="" [selected]="!subcategoria()">Todas las subcategorías</option>
                  @for (s of subs(); track s.slug) {
                    <option [value]="s.slug" [selected]="s.slug === subcategoria()">{{ s.label }}</option>
                  }
                </select>
              </label>
            }
          </app-search-filter-bar>
        </div>

        <label class="mt-5 flex w-fit cursor-pointer items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary">
          <input type="checkbox" [checked]="soloAlcanza()" (change)="soloAlcanza.set($any($event.target).checked)" data-compact
            class="h-5 w-5" />
          Mostrar solo lo que puedo canjear con mis {{ puntos(store.puntos()) }} puntos
        </label>

        <p class="mt-4 text-sm text-muted-foreground">{{ lista().length }} productos disponibles</p>

        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @if (!catalog.cargado() && !catalog.errorCarga()) { <p role="status" class="sr-only">Cargando…</p> @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) { <div class="skeleton h-[26rem] rounded-2xl" aria-hidden="true"></div> } }
          @for (p of visiblesLista(); track p.id) {
            <app-product-card [producto]="p" [nivel]="2" (add)="onAdd($event)" class="animate-fade-up" />
          }
        </div>

        @if (visibles() < lista().length) {
          <div class="mt-10 flex flex-col items-center gap-2">
            <p class="text-sm text-muted-foreground" aria-live="polite">Mostrando {{ visiblesLista().length }} de {{ lista().length }}</p>
            <button type="button" (click)="visibles.set(visibles() + 8)"
              class="rounded-full border border-border bg-card px-8 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary">
              Cargar más
            </button>
          </div>
        } @else if (lista().length > 12) {
          <p class="mt-8 text-center text-sm text-muted-foreground">Ya viste todos los productos ({{ lista().length }}).</p>
        }

        @if (catalog.errorCarga() && !catalog.cargado()) { <app-estado-error (reintentar)="catalog.reintentar()" /> }
        @if (catalog.cargado() && lista().length === 0) {
          <p class="py-16 text-center text-sm text-muted-foreground">No encontramos productos con esos filtros. Prueba con otra búsqueda.</p>
        }
      </div>
    </section>

    <app-added-to-cart-modal [producto]="agregado()" (closed)="agregado.set(null)" />
  `,
})
export class CanjeaPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly store = inject(StoreService);
  protected readonly puntos = formatPuntos;

  protected readonly categoria = signal<string | null>(null);
  /** Categoría preseleccionada desde un enlace (?categoria=slug), p. ej. la sección "Categorías" de la portada. */
  readonly categoriaParam = input("", { alias: "categoria" });
  protected readonly subcategoria = signal<string | null>(null);
  protected readonly orden = signal<Orden_Producto>("recomendado");
  protected readonly query = signal("");
  protected readonly marca = signal("");
  protected readonly visibles = signal(12);
  protected readonly agregado = signal<Producto | null>(null);
  protected readonly soloAlcanza = signal(false);

  protected readonly marcas = computed(() => [...new Set(this.catalog.productos().map((p) => p.marca))].sort());
  protected readonly subs = computed(() => this.catalog.subcategoriasDe(this.categoria()));

  constructor() {
    effect(() => {
      const c = this.categoriaParam();
      if (c) this.categoria.set(c);
    });
  }

  protected elegirCategoria(slug: string | null) {
    this.categoria.set(slug);
    this.subcategoria.set(null);
    this.visibles.set(12);
  }

  protected readonly lista = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.categoria();
    const sub = this.subcategoria();
    const marca = this.marca();
    const alcanza = this.soloAlcanza();
    const puntos = this.store.puntos();
    let out = this.catalog.productos().filter((p) => {
      const okCat = !cat || p.categoria === cat;
      const okSub = !sub || p.subcategoria === sub;
      const okMarca = !marca || p.marca === marca;
      const okQuery = !q || `${p.marca} ${p.nombre} ${p.categoriaLabel} ${p.subcategoriaLabel}`.toLowerCase().includes(q);
      const okPuntos = !alcanza || p.puntos <= puntos;
      return okCat && okSub && okMarca && okQuery && okPuntos;
    });
    const orden = this.orden();
    if (orden === "az") out = [...out].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (orden === "puntos-asc") out = [...out].sort((a, b) => a.puntos - b.puntos);
    if (orden === "puntos-desc") out = [...out].sort((a, b) => b.puntos - a.puntos);
    return out;
  });
  protected readonly visiblesLista = computed(() => this.lista().slice(0, this.visibles()));

  protected onAdd(p: Producto) {
    agregarProducto(this.store, p);
    this.agregado.set(p);
  }
}

/* ------------------------------------------------------------------ */
/* Detalle de producto (/canjea/:id)                                   */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-producto-detalle-page",
  imports: [RouterLink, IconComponent, ProductCardComponent, AddedToCartModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (producto(); as producto) {
      <div class="bg-surface py-8">
        <div class="page-container">
          <a routerLink="/canjea" class="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-primary">
            <app-icon name="ArrowLeft" class="h-4 w-4" /> Volver al catálogo
          </a>

          <article class="mt-5 grid gap-8 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:grid-cols-2 lg:p-8">
            <div class="galeria-fija">
              <img [src]="producto.galeria[foto()]" [alt]="producto.nombre" width="900" height="900" class="mx-auto aspect-square w-full rounded-2xl object-cover" />
              @if (producto.galeria.length > 1) {
                <div class="mt-4 flex gap-3">
                  @for (g of producto.galeria; track g; let i = $index) {
                    <button type="button" (click)="foto.set(i)" [attr.aria-label]="'Ver foto ' + (i + 1)"
                      [class]="'h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ' + (i === foto() ? 'border-primary' : 'border-transparent')">
                      <img [src]="g" alt="" width="160" height="160" class="h-full w-full object-cover" />
                    </button>
                  }
                </div>
              }
            </div>

            <div>
              <h1 class="text-2xl font-extrabold text-ink sm:text-3xl">{{ producto.nombre }}</h1>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">{{ producto.categoriaLabel }}</span>
                @if (producto.etiqueta) { <span [class]="'inline-block rounded-full px-4 py-1.5 text-sm font-bold ' + claseEtiqueta(producto.etiquetaColor)">{{ producto.etiqueta }}</span> }
                @if (producto.promoEtiqueta) { <span class="inline-block rounded-full bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground">{{ producto.promoEtiqueta }}</span> }
              </div>
              <p class="mt-4 text-sm leading-relaxed text-muted-foreground">{{ producto.descripcion }}</p>

              <div class="my-5 border-t border-border"></div>

              <div class="flex items-center gap-3">
                @if (catalog.marcaPorNombre(producto.marca)?.logo; as logo) {
                  <img [src]="logo" [alt]="producto.marca" class="h-12 w-12 rounded-full border border-border bg-white object-contain p-1" />
                } @else {
                  <span class="grid h-12 w-12 place-items-center rounded-full bg-secondary text-sm font-extrabold text-primary">{{ producto.marca.slice(0, 2).toUpperCase() }}</span>
                }
                <div class="min-w-0">
                  <p class="text-sm font-semibold uppercase text-ink">{{ producto.marca }}</p>
                  <a [href]="catalog.marcaPorNombre(producto.marca)?.web || producto.marcaUrl" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-sm text-celeste hover:underline">
                    Visitar página web <app-icon name="Link2" class="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div class="mt-6 rounded-2xl border border-border p-5">
                <p class="text-sm font-semibold text-ink">Cantidad</p>
                <div class="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                  <div class="flex items-center gap-4 rounded-full border border-border px-3 py-2">
                    <button type="button" aria-label="Quitar uno" (click)="cantidad.set(max1(cantidad() - 1))" class="grid h-11 w-11 place-items-center text-ink"><app-icon name="Minus" class="h-4 w-4" /></button>
                    <span class="w-8 text-center text-sm font-bold text-ink">{{ cantidad() }}</span>
                    <button type="button" aria-label="Agregar uno" (click)="cantidad.set(min(cantidad() + 1))" [disabled]="cantidad() >= store.maxPorLinea()" class="grid h-11 w-11 place-items-center text-ink disabled:opacity-40"><app-icon name="Plus" class="h-4 w-4" /></button>
                  </div>
                  <div class="min-w-0 text-right sm:text-left">
                    <p class="text-lg font-extrabold text-ink">{{ puntos(producto.puntos * cantidad()) }} puntos@if (producto.puntosOriginal) { <s class="ml-2 text-sm font-medium text-muted-foreground">{{ puntos(producto.puntosOriginal * cantidad()) }}</s> }</p>
                  </div>
                </div>
              </div>

              <button type="button" (click)="agregar(producto)"
                class="mt-5 w-full rounded-full bg-primary py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02]">
                Agregar al carrito
              </button>
              <p class="mt-3 text-center text-xs text-muted-foreground">
                {{ producto.digital ? "Producto digital: lo recibirás por correo electrónico." : "Producto físico: elige tu dirección de envío en el checkout." }}
              </p>
            </div>
          </article>

          <section class="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] lg:p-8">
            <h2 class="text-lg font-bold text-ink">Consideraciones</h2>
            <ul class="mt-4 space-y-1.5 text-sm text-ink">
              @for (c of producto.consideraciones; track c) { <li>• {{ c }}</li> }
            </ul>
          </section>

          <section class="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] lg:p-8">
            <h2 class="text-lg font-bold text-ink">Especificaciones</h2>
            <ul class="mt-4 space-y-1.5 text-sm text-ink">
              @for (e of producto.especificaciones; track e) { <li>• {{ e }}</li> }
            </ul>
          </section>
        </div>
      </div>

      <section class="bg-background py-14">
        <div class="page-container">
          <!-- «Más sobre la marca» solo si el panel tiene una descripción de la marca: logo (o sus iniciales), nombre, descripción y, si tiene, su web. -->
          @if (catalog.marcaPorNombre(producto.marca); as info) {
            @if (info.descripcion?.trim()) {
              <h2 class="text-center text-xl font-extrabold text-ink sm:text-2xl">Más sobre la marca</h2>
              @if (info.logo) {
                <img [src]="info.logo" [alt]="producto.marca" class="mx-auto mt-4 h-14 max-w-[200px] object-contain" />
              } @else {
                <span class="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-extrabold text-primary" aria-hidden="true">{{ producto.marca.slice(0, 2).toUpperCase() }}</span>
              }
              <p class="mt-2 text-center text-base font-semibold uppercase text-ink">{{ producto.marca }}</p>
              <p class="mx-auto mt-3 max-w-4xl text-center text-sm leading-relaxed text-muted-foreground">{{ info.descripcion }}</p>
              @if (info.web) {
                <p class="mt-3 text-center">
                  <a [href]="info.web" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-sm font-semibold text-celeste hover:underline">
                    Visitar sitio web de {{ producto.marca }} <app-icon name="Link2" class="h-4 w-4" />
                  </a>
                </p>
              }
            }
          }
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            @for (p of relacionados(); track p.id) {
              <app-product-card [producto]="p" (add)="onAdd($event)" />
            }
          </div>
        </div>
      </section>

      <app-added-to-cart-modal [producto]="agregado()" (closed)="agregado.set(null)" />
    } @else if (catalog.cargado()) {
      <div class="bg-surface py-24 text-center">
        <h1 class="text-2xl font-extrabold text-ink">Producto no disponible</h1>
        <a routerLink="/canjea" class="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-base font-bold uppercase tracking-wide text-primary-foreground">Volver al catálogo</a>
      </div>
    }
  `,
})
export class ProductoDetallePage {
  protected readonly catalog = inject(CatalogService);
  protected readonly brand = inject(BrandService);
  protected readonly store = inject(StoreService);
  readonly id = input.required<string>();
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
  protected readonly claseEtiqueta = claseEtiqueta;

  protected readonly foto = signal(0);
  protected readonly cantidad = signal(1);
  /** La cantidad no pasa del máximo por producto que define el panel (Reglas). */
  protected min(n: number) { return Math.min(n, this.store.maxPorLinea()); }
  protected readonly agregado = signal<Producto | null>(null);

  protected readonly producto = computed(() => this.catalog.productoPorId(this.id()));
  private readonly seo = inject(SeoService);
  private readonly analitica = inject(AnaliticaService);
  /** Título, descripción, imagen y datos estructurados (schema.org/Product) de la ficha. */
  private readonly seoProducto = effect(() => {
    const p = this.producto();
    if (!p) return;
    const moneda = this.brand.tenant().pais.moneda.codigo;
    this.seo.detalle({
      titulo: `${p.nombre} | {programa}`,
      descripcion: (p.descripcion || `${p.nombre} de ${p.marca}: canjéalo con ${formatPuntos(p.puntos)} puntos en {programa}.`).slice(0, 300),
      imagen: p.imagen,
      tipo: "product",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.nombre,
        sku: p.id,
        image: (p.galeria?.length ? p.galeria : [p.imagen]).filter(Boolean),
        description: p.descripcion,
        brand: { "@type": "Brand", name: p.marca },
        offers: { "@type": "Offer", price: p.precio, priceCurrency: moneda, availability: "https://schema.org/InStock", url: location.origin + "/canjea/" + p.id },
      },
    });
  });
  private vistoId = "";
  private readonly contarVista = effect(() => {
    const p = this.producto();
    if (p && p.id !== this.vistoId) {
      this.vistoId = p.id;
      this.catalog.registrarVista(p.id);
      this.analitica.registrar({ tipo: "ver_item", itemId: p.id, itemTipo: "producto" }); // embudo (solo con permiso de analítica)
    }
  });
  protected readonly relacionados = computed(() => {
    const p = this.producto();
    if (!p) return [];
    const todos = this.catalog.productos();
    const deMarca = todos.filter((x) => x.marca === p.marca && x.id !== p.id);
    return (deMarca.length ? deMarca : todos.filter((x) => x.id !== p.id)).slice(0, 4);
  });

  protected max1(n: number) {
    return Math.max(1, n);
  }
  protected agregar(p: Producto) {
    agregarProducto(this.store, p, this.cantidad());
    this.agregado.set(p);
  }
  protected onAdd(p: Producto) {
    agregarProducto(this.store, p);
    this.agregado.set(p);
  }
}

/* ------------------------------------------------------------------ */
/* Catálogo de beneficios (/beneficios)                                */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-beneficios-page",
  imports: [EstadoErrorComponent, HeroSliderComponent, CategoryStripComponent, BenefitCardComponent, OrdenSelectComponent, SearchFilterBarComponent, SectionTitleComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-slider [items]="catalog.bannersBeneficios()" />

    <section class="bg-background py-6">
      <div class="page-container"><app-category-strip [categorias]="catalog.categoriasBeneficio()" [(value)]="categoria" /></div>
    </section>

    @if (mostrarExclusivos) {
    <section class="bg-background pb-10">
      <div class="page-container">
        <app-section-title text="Descubre nuestros beneficios" highlight="exclusivos" />
        <p class="mt-3 text-center text-sm text-muted-foreground">Beneficios especiales que puedes comprar con puntos, puntos + dinero o solo con tu tarjeta.</p>
        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (b of exclusivos(); track b.id) { <app-benefit-card [beneficio]="b" class="animate-fade-up" /> }
        </div>
      </div>
    </section>
    }

    <section class="bg-surface py-10">
      <div class="page-container">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <h1 class="min-w-0 text-xl font-extrabold text-ink sm:text-2xl">Disfruta de grandiosos beneficios</h1>
          <!-- En celular el orden va dentro de Filtros (abajo); desde tablet se queda junto al título. -->
          <app-orden-select class="hidden sm:block" [(value)]="orden" />
        </div>
        <div class="mt-5">
          <app-search-filter-bar [conMapa]="true" [mostrarLimpiar]="false" [(query)]="query" [(marca)]="marca" [marcas]="marcas()" [extrasActivos]="!!provincia()" (limpiado)="provincia.set('')">
            <div class="sm:hidden"><app-orden-select [(value)]="orden" /></div>
            @if (provincias().length > 0) {
              <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Provincia
                <select [value]="provincia()" (change)="provincia.set($any($event.target).value)" aria-label="Provincia"
                  class="select-field mt-1 h-11 w-full rounded-full border border-border bg-card px-4 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="" [selected]="!provincia()">Todas las provincias</option>
                  @for (p of provincias(); track p) {
                    <option [value]="p" [selected]="p === provincia()">{{ p }}</option>
                  }
                </select>
              </label>
            }
          </app-search-filter-bar>
        </div>

        <div class="mt-5 flex h-7 items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">{{ lista().length }} beneficios disponibles</p>
          @if (hayFiltros()) {
            <button type="button" data-compact (click)="limpiarFiltros()" class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold text-primary hover:bg-primary/10">
              <app-icon name="X" class="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          }
        </div>

        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @if (!catalog.cargado() && !catalog.errorCarga()) { <p role="status" class="sr-only">Cargando…</p> @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) { <div class="skeleton h-[26rem] rounded-2xl" aria-hidden="true"></div> } }
          @for (b of lista(); track b.id) { <app-benefit-card [beneficio]="b" [nivel]="2" class="animate-fade-up" /> }
        </div>

        @if (catalog.errorCarga() && !catalog.cargado()) { <app-estado-error (reintentar)="catalog.reintentar()" /> }
        @if (catalog.cargado() && lista().length === 0) {
          <p class="py-16 text-center text-sm text-muted-foreground">No encontramos beneficios con esos filtros. Prueba con otra búsqueda.</p>
        }
      </div>
    </section>
  `,
})
export class BeneficiosPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly categoria = signal<string | null>(null);
  protected readonly orden = signal<Orden_Producto>("recomendado");
  protected readonly query = signal("");
  protected readonly marca = signal("");
  /** Provincia elegida en los filtros: muestra lo que está disponible allí (más lo de todo el país). */
  protected readonly provincia = signal("");
  protected readonly hayFiltros = computed(() => !!this.query() || !!this.marca() || !!this.provincia());
  protected limpiarFiltros() {
    this.query.set("");
    this.marca.set("");
    this.provincia.set("");
  }

  protected readonly marcas = computed(() => [...new Set(this.catalog.beneficios().map((b) => b.marca))].sort());
  /** Provincias que aparecen en alguno de los beneficios (los que no indican provincia valen para todo el país). */
  protected readonly provincias = computed(() => [...new Set(this.catalog.beneficios().flatMap((b) => b.provincias ?? []))].sort((a, b) => a.localeCompare(b, "es")));
  /** Sección "Descubre nuestros beneficios exclusivos": oculta por ahora. Poner en true para volver a mostrarla. */
  protected readonly mostrarExclusivos = false;
  protected readonly exclusivos = computed(() => this.catalog.beneficios().filter((b) => b.tipo === "compra"));

  protected readonly lista = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.categoria();
    const marca = this.marca();
    let out = this.catalog.beneficios().filter((b) => {
      const okCat = !cat || b.categoriaSlug === cat;
      const okMarca = !marca || b.marca === marca;
      const okQuery = !q || `${b.marca} ${b.nombre} ${b.categoria}`.toLowerCase().includes(q);
      const prov = this.provincia();
      const okProv = !prov || !b.provincias?.length || b.provincias.includes(prov);
      return okCat && okMarca && okQuery && okProv;
    });
    const orden = this.orden();
    if (orden === "az") out = [...out].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (orden === "puntos-asc") out = [...out].sort((a, b) => (a.puntos ?? 0) - (b.puntos ?? 0));
    if (orden === "puntos-desc") out = [...out].sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
    return out;
  });
}

/* ------------------------------------------------------------------ */
/* Detalle de beneficio (/beneficios/:id)                              */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-beneficio-detalle-page",
  imports: [RouterLink, IconComponent, ModalComponent, AddedToCartModalComponent, Countdown, QrCodeComponent, MapaLocalesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (beneficio(); as beneficio) {
      <div class="bg-surface py-8">
        <div class="page-container">
          <a routerLink="/beneficios" class="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-primary">
            <app-icon name="ArrowLeft" class="h-4 w-4" /> Volver al catálogo
          </a>

          <article class="mt-5 grid gap-8 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:grid-cols-2 lg:p-8">
            <div class="galeria-fija">
              <img [src]="beneficio.galeria[foto()]" [alt]="beneficio.nombre" width="900" height="900" class="mx-auto aspect-square w-full rounded-2xl object-cover" />
              @if (beneficio.galeria.length > 1) {
                <div class="mt-4 flex gap-3">
                  @for (g of beneficio.galeria; track g; let i = $index) {
                    <button type="button" (click)="foto.set(i)" [attr.aria-label]="'Ver foto ' + (i + 1)"
                      [class]="'h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ' + (i === foto() ? 'border-primary' : 'border-transparent')">
                      <img [src]="g" alt="" width="160" height="160" class="h-full w-full object-cover" />
                    </button>
                  }
                </div>
              }
            </div>

            <div>
              <h1 class="text-2xl font-extrabold text-ink sm:text-3xl">{{ beneficio.nombre }}</h1>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">{{ beneficio.categoria }}</span>
                @if (beneficio.etiqueta) { <span [class]="'inline-block rounded-full px-4 py-1.5 text-sm font-bold ' + claseEtiqueta(beneficio.etiquetaColor)">{{ beneficio.etiqueta }}</span> }
                @if (beneficio.promoEtiqueta) { <span class="inline-block rounded-full bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground">{{ beneficio.promoEtiqueta }}</span> }
              </div>
              <p class="mt-4 text-sm leading-relaxed text-muted-foreground">{{ beneficio.descripcion }}</p>

              @if (datosReglas(); as d) {
                <ul class="mt-4 space-y-1.5 text-sm text-ink" aria-label="Condiciones del beneficio">
                  @for (l of d; track l) { <li class="flex items-start gap-2"><app-icon name="CheckCircle2" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{{ l }}</span></li> }
                </ul>
              }

              <div class="my-5 border-t border-border"></div>

              <div class="flex items-center gap-3">
                @if (catalog.marcaPorNombre(beneficio.marca)?.logo; as logo) {
                  <img [src]="logo" [alt]="beneficio.marca" class="h-12 w-12 rounded-full border border-border bg-white object-contain p-1" />
                } @else {
                  <span class="grid h-12 w-12 place-items-center rounded-full bg-secondary text-sm font-extrabold text-primary">{{ beneficio.marca.slice(0, 2).toUpperCase() }}</span>
                }
                <div class="min-w-0">
                  <p class="text-sm font-semibold uppercase text-ink">{{ beneficio.marca }}</p>
                  <a [href]="catalog.marcaPorNombre(beneficio.marca)?.web || beneficio.marcaUrl" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-sm text-celeste hover:underline">
                    Visitar página web <app-icon name="Link2" class="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div class="mt-6 rounded-2xl bg-surface p-5">
                <h2 class="text-base font-bold text-ink">Para usar este beneficio</h2>
                <ol class="mt-3 space-y-2.5">
                  @for (paso of beneficio.pasos; track paso; let i = $index) {
                    <li class="flex items-center gap-3 text-sm text-ink">
                      <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{{ i + 1 }}</span>
                      {{ paso }}
                    </li>
                  }
                </ol>
              </div>

              @if (beneficio.tipo === "compra") {
                <div class="mt-6 rounded-2xl border border-border p-5">
                  <p class="text-lg font-extrabold text-ink">{{ puntos(beneficio.puntos ?? 0) }} puntos@if (beneficio.puntosOriginal) { <s class="ml-2 text-sm font-medium text-muted-foreground">{{ puntos(beneficio.puntosOriginal) }}</s> }</p>
                  <p class="mt-2 text-sm text-muted-foreground">Se canjea únicamente con puntos.</p>
                  <button type="button" (click)="agregarAlCarrito()"
                    class="mt-4 w-full rounded-full bg-primary py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02]">
                    Agregar al carrito
                  </button>
                </div>
              } @else if (cuponActivo(); as cupon) {
                <div class="mt-6">
                  <div class="mx-auto max-w-xs overflow-hidden rounded-2xl border border-border">
                    <div class="h-2 bg-primary"></div>
                    <div class="p-5 text-center">
                      <p class="text-sm text-ink">Presenta este QR a un encargado del local.</p>
                      <p class="mt-4 text-sm text-muted-foreground">Te quedan:</p>
                      <div class="mt-2"><app-countdown [expira]="cupon.expira" /></div>
                      <app-qr [valor]="cupon.codigo" clase="mx-auto mt-5 h-48 w-48" />
                      <p class="mt-2 text-lg font-extrabold text-ink">{{ cupon.codigo }}</p>
                    </div>
                  </div>
                  <div class="mt-4 flex justify-center gap-3">
                    <button type="button" aria-label="Descargar cupón" title="Descargar como imagen" (click)="descargarCuponImagen()" class="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><app-icon name="Image" class="h-4 w-4" /></button>
                    <button type="button" aria-label="Descargar cupón en PDF" title="Descargar en PDF" (click)="descargarCuponPdf()" class="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><app-icon name="Download" class="h-4 w-4" /></button>
                  </div>
                  <p class="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-ink">
                    <app-icon name="CheckCircle2" class="h-4 w-4 text-primary" /> Cupón generado. Este beneficio queda bloqueado hasta que expire.
                  </p>
                </div>
              } @else if (bloqueo(); as b) {
                <div role="status" class="mt-6 rounded-2xl border border-aviso-borde bg-aviso-fondo p-5">
                  <p class="flex items-start gap-2 text-sm font-semibold text-aviso"><app-icon name="AlertCircle" class="mt-0.5 h-5 w-5 shrink-0" /> <span>{{ b.mensaje }}</span></p>
                  @if (b.estado === "falta_provincia") {
                    <a routerLink="/perfil" class="mt-3 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground">Completar mis datos</a>
                  }
                </div>
                <button type="button" disabled class="mt-4 w-full cursor-not-allowed rounded-full bg-muted py-3.5 text-base font-bold uppercase tracking-wide text-muted-foreground">Generar cupón</button>
              } @else {
                <button type="button" (click)="confirmar.set(true)"
                  class="mt-6 w-full rounded-full bg-primary py-3.5 text-base font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02]">
                  Generar cupón
                </button>
              }
            </div>
          </article>

          <section class="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] lg:p-8">
            <h2 class="text-lg font-bold text-ink">Especificaciones</h2>
            <ul class="mt-4 space-y-1.5 text-sm text-ink">
              @for (e of beneficio.especificaciones; track e) { <li>• {{ e }}</li> }
            </ul>
          </section>

          @if (locales().length) {
            <section class="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] lg:p-8" data-testid="donde-canjearlo">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-lg font-bold text-ink">Dónde canjearlo</h2>
                <button type="button" (click)="ubicarme()" [disabled]="buscandoPos()"
                  class="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-4 text-sm font-bold text-primary transition-colors hover:bg-secondary disabled:opacity-60">
                  <app-icon name="MapPin" class="h-4 w-4" /> {{ miPos() ? 'Actualizar mi ubicación' : 'Ver el más cercano' }}
                </button>
              </div>
              <p class="mt-2 text-sm text-muted-foreground" [attr.role]="avisoPos() ? 'status' : null">{{ avisoPos() || 'Usamos tu ubicación solo en tu dispositivo, para ordenar los locales por cercanía. No la guardamos.' }}</p>
              <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <ul class="order-2 max-h-80 space-y-3 overflow-y-auto pr-1 lg:order-1" aria-label="Locales donde se canjea">
                  @for (l of localesOrdenados(); track l.id; let i = $index) {
                    <li>
                      <button type="button" (click)="localSel.set(l.id)" [attr.aria-pressed]="localSel() === l.id"
                        [class]="'w-full rounded-2xl border p-4 text-left text-sm transition-colors hover:border-primary ' + (localSel() === l.id ? 'border-primary bg-secondary/50 ring-2 ring-primary/30' : 'border-border')">
                        <span class="flex items-start justify-between gap-2">
                          <span class="font-bold text-ink">{{ l.nombre }}</span>
                          @if (l.distancia !== null) { <span class="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">{{ i === 0 ? 'Más cercano · ' : '' }}{{ distancia(l.distancia) }}</span> }
                        </span>
                        <span class="mt-2 flex items-start gap-2 text-ink"><app-icon name="MapPin" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ l.direccion }}, {{ l.distrito }}</span></span>
                        @if (l.horario) { <span class="mt-1 flex items-start gap-2 text-muted-foreground"><app-icon name="Clock" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ l.horario }}</span></span> }
                        @if (l.telefono) { <span class="mt-1 flex items-start gap-2 text-muted-foreground"><app-icon name="Phone" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ l.telefono }}</span></span> }
                      </button>
                    </li>
                  }
                </ul>
                <app-mapa-locales [locales]="locales()" [miPos]="miPos()" [(seleccionado)]="localSel" class="order-1 h-64 lg:order-2 lg:h-80" />
              </div>
            </section>
          }

          <section class="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] lg:p-8">
            <h2 class="text-lg font-bold text-ink">Términos y condiciones</h2>
            <p class="mt-4 text-sm leading-relaxed text-ink">{{ beneficio.terminos }}</p>
          </section>
        </div>
      </div>

      <app-modal [open]="confirmar()" title="Generar Cupón" (closed)="confirmar.set(false)">
        <p class="text-base text-ink">Estás a punto de generar un cupón para:</p>
        <p class="mt-3 rounded-2xl bg-muted px-5 py-4 text-lg font-semibold uppercase text-ink">{{ beneficio.marca }}</p>

        <div class="mt-5 rounded-2xl border border-aviso-borde bg-aviso-fondo p-5">
          <p class="flex items-center gap-2 text-base font-bold text-aviso"><app-icon name="AlertCircle" class="h-5 w-5" /> Importante</p>
          <ul class="mt-3 space-y-2 text-sm text-aviso">
            <li>• El cupón tendrá una validez de {{ horasCupon() }} {{ horasCupon() === 1 ? "hora" : "horas" }}</li>
            @if (reglaTexto(); as r) { <li>• {{ r }}</li> }
            <li>• Solo puedes tener un cupón activo a la vez</li>
            <li>• Debes presentarlo en el establecimiento junto con tu DNI</li>
          </ul>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" (click)="confirmar.set(false)"
            class="rounded-full bg-muted px-6 py-3 text-base font-bold uppercase tracking-wide text-ink transition-colors hover:bg-secondary">Cancelar</button>
          <button type="button" (click)="store.generarCupon(beneficio.id); confirmar.set(false)"
            class="rounded-full bg-primary px-6 py-3 text-base font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02]">Generar cupón</button>
        </div>
      </app-modal>

      <app-added-to-cart-modal [producto]="agregado() ? itemAgregado(beneficio) : null" (closed)="agregado.set(false)" />
    } @else if (catalog.cargado()) {
      <div class="bg-surface py-24 text-center">
        <h1 class="text-2xl font-extrabold text-ink">Beneficio no disponible</h1>
        <a routerLink="/beneficios" class="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-base font-bold uppercase tracking-wide text-primary-foreground">Volver al catálogo</a>
      </div>
    }
  `,
})
export class BeneficioDetallePage {
  protected readonly catalog = inject(CatalogService);
  protected readonly store = inject(StoreService);
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly brand = inject(BrandService);
  private readonly toast = inject(ToastService);
  /** Código QR del cupón como imagen (se dibuja en el navegador): lo usan el PDF y la imagen descargables. */
  protected readonly qrImagen = signal("");
  private readonly dibujarQr = effect(() => {
    const codigo = this.cuponActivo()?.codigo;
    if (!codigo) { this.qrImagen.set(""); return; }
    void cargarQr().then((m) => m.toDataURL(codigo, { width: 220, margin: 1, errorCorrectionLevel: "M" })).then((u) => this.qrImagen.set(u)).catch(() => this.qrImagen.set(""));
  });
  /** Tipo de documento de quien tiene la sesión (DNI, CE…). */
  protected readonly etiquetaDocumento = computed(() => this.store.perfil()?.tipoDocumento || this.brand.pais().documentos[0]?.label || "Documento");
  /** Documento ofuscado (solo los 4 últimos): el del cupón o, si es un cupón anterior que no lo guardó, el del participante con sesión. */
  protected readonly documentoCupon = computed(() => this.cuponActivo()?.documento || ofuscarDocumento(this.store.perfil()?.codigoParticipante));
  /** Datos del cupón para guardarlo como imagen o PDF: código, QR, documento ofuscado, vencimiento y locales. */
  private datosCupon(): DatosCupon | null {
    const b = this.beneficio();
    const c = this.cuponActivo();
    if (!b || !c) return null;
    const logo = this.brand.marca().logoOscuro;
    return {
      programa: this.brand.programa(),
      color: this.brand.tenant().tema.primario,
      banco: this.brand.marca().nombre,
      logo: logo ? new URL(logo, document.baseURI).href : undefined,
      beneficio: b.nombre,
      comercio: b.marca,
      descuento: b.descuento,
      codigo: c.codigo,
      qr: this.qrImagen() || undefined,
      documentoEtiqueta: this.etiquetaDocumento(),
      documento: this.documentoCupon(),
      venceEl: new Date(c.expira).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }),
      vigenciaHasta: b.hasta ? fechaLarga(b.hasta) : undefined,
      locales: this.locales().map((l) => ({ nombre: l.nombre, direccion: l.direccion, distrito: l.distrito, horario: l.horario })),
      terminos: b.terminos,
    };
  }
  /** PDF: descarga el cupón directamente como archivo (cupon-<código>.pdf). */
  protected async descargarCuponPdf() {
    const d = this.datosCupon();
    if (!d) return;
    try {
      descargarBlob(await cuponComoPdf(d), `cupon-${d.codigo}.pdf`);
      this.toast.show("Cupón descargado en PDF");
    } catch {
      this.toast.error("No pudimos generar el PDF. Prueba con la imagen.");
    }
  }
  /** Imagen: guarda el cupón como PNG (cupon-<código>.png). */
  protected async descargarCuponImagen() {
    const d = this.datosCupon();
    if (!d) return;
    try {
      descargarBlob(await cuponComoPng(d), `cupon-${d.codigo}.png`);
      this.toast.show("Cupón descargado como imagen");
    } catch {
      this.toast.error("No pudimos generar la imagen. Prueba con el PDF.");
    }
  }
  /** Horas de validez del cupón: las de este beneficio (o las generales del programa si no tiene regla propia). */
  protected readonly horasCupon = computed(() => this.beneficio()?.reglaCupon?.horas || this.catalog.config()?.cupon?.horas || 3);
  /** Qué le toca a este participante con este beneficio: disponible o el motivo por el que no puede canjearlo ahora. */
  protected readonly estado = signal<{ estado: string; mensaje: string } | null>(null);
  protected readonly bloqueo = computed(() => { const e = this.estado(); return e && e.estado !== "disponible" ? e : null; });
  private readonly cargarEstado = effect(() => {
    const b = this.beneficio();
    this.store.cupones(); // al generar un cupón se vuelve a preguntar (puede quedar bloqueado por el límite)
    if (!b || b.tipo === "compra" || !this.sesion.logged()) { this.estado.set(null); return; }
    this.api.get<{ estado: string; mensaje: string }>(`me/cupones/estado/${b.id}`).subscribe({ next: (e) => this.estado.set(e), error: () => this.estado.set(null) });
  });
  /** Lo que se le cuenta al participante antes de canjear: vigencia, provincias y cuántas veces puede hacerlo. */
  protected readonly datosReglas = computed(() => {
    const b = this.beneficio();
    if (!b) return null;
    const l: string[] = [];
    if (b.hasta) l.push(`Válido hasta el ${fechaLarga(b.hasta)}`);
    if (b.desde && b.vigencia === "programado") l.push(`Disponible desde el ${fechaLarga(b.desde)}`);
    if (b.provincias?.length) l.push(`Disponible en ${listaTexto(b.provincias)}`);
    const r = this.reglaTexto();
    if (r && b.tipo !== "compra") l.push(r);
    return l.length ? l : null;
  });
  /** "Puedes canjearlo 1 vez; para volver a hacerlo debes esperar 3 meses desde tu último canje." (vacío si no hay límite) */
  protected readonly reglaTexto = computed(() => {
    const r = this.beneficio()?.reglaCupon;
    if (!r || r.limite <= 0) return "";
    return `Puedes canjearlo ${r.limite === 1 ? "1 vez" : r.limite + " veces"}; después debes esperar ${r.meses} ${r.meses === 1 ? "mes" : "meses"} desde tu último canje para volver a hacerlo`;
  });
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
  protected readonly claseEtiqueta = claseEtiqueta;

  protected readonly foto = signal(0);
  protected readonly confirmar = signal(false);
  protected readonly agregado = signal(false);

  /** Un beneficio programado o vencido no está en el catálogo, pero su ficha sigue abierta para explicar por qué no se puede canjear. */
  private readonly fueraDelCatalogo = signal<Beneficio | undefined>(undefined);
  protected readonly beneficio = computed(() => this.catalog.beneficioPorId(this.id()) ?? this.fueraDelCatalogo());
  private readonly cargarFuera = effect(() => {
    const id = this.id();
    if (!this.catalog.cargado() || this.catalog.beneficioPorId(id)) return;
    this.api.get<Beneficio>(`catalogo/beneficios/${id}`).subscribe({ next: (b) => this.fueraDelCatalogo.set(b), error: () => this.fueraDelCatalogo.set(undefined) });
  });
  private readonly seo = inject(SeoService);
  private readonly analitica = inject(AnaliticaService);
  private vistoId = "";
  private readonly vista = effect(() => {
    const b = this.beneficio();
    if (!b || b.id === this.vistoId) return;
    this.vistoId = b.id;
    this.analitica.registrar({ tipo: "ver_item", itemId: b.id, itemTipo: "beneficio" });
  });
  private readonly seoBeneficio = effect(() => {
    const b = this.beneficio();
    if (!b) return;
    this.seo.detalle({
      titulo: `${b.nombre} en ${b.marca} | {programa}`,
      descripcion: (b.descripcion || `${b.nombre} en ${b.marca}: beneficio exclusivo para clientes de {banco}.`).slice(0, 300),
      imagen: b.imagen,
    });
  });
  protected readonly cupon = computed(() => this.store.cupones()[this.id()]);
  /** El QR se muestra mientras el cupón no haya vencido; vencido, vuelve el botón o el motivo del bloqueo. */
  protected readonly cuponActivo = computed(() => { const c = this.cupon(); return c && c.expira > Date.now() ? c : null; });
  /** Local elegido en «Dónde canjearlo» (se resalta en la lista y en el mapa). */
  protected readonly localSel = signal<string | null>(null);
  /** Locales de la marca donde se puede canjear (los que están publicados). */
  protected readonly locales = computed(() => { const b = this.beneficio(); return b ? this.catalog.localesDeBeneficio(b) : []; });

  /* ---- Ver el local más cercano (la ubicación se usa solo en el dispositivo, solo si la persona lo pide) ---- */
  protected readonly miPos = signal<{ lat: number; lng: number } | null>(null);
  protected readonly buscandoPos = signal(false);
  protected readonly avisoPos = signal("");
  protected readonly distancia = textoDistancia;
  /** Los locales con su distancia a la persona y, si compartió su ubicación, del más cercano al más lejano. */
  protected readonly localesOrdenados = computed(() => {
    const pos = this.miPos();
    const filas = this.locales().map((l) => ({ ...l, distancia: pos ? distanciaKm(pos, l) : (null as number | null) }));
    return pos ? filas.sort((a, b) => a.distancia! - b.distancia!) : filas;
  });
  protected ubicarme() {
    if (!navigator.geolocation) { this.avisoPos.set("Tu navegador no permite obtener la ubicación."); return; }
    this.buscandoPos.set(true);
    this.avisoPos.set("Obteniendo tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        this.buscandoPos.set(false);
        this.miPos.set({ lat: p.coords.latitude, lng: p.coords.longitude });
        this.avisoPos.set("Ordenados del más cercano al más lejano.");
        this.localSel.set(this.localesOrdenados()[0]?.id ?? null);
      },
      () => { this.buscandoPos.set(false); this.avisoPos.set("No pudimos acceder a tu ubicación. Puedes elegir el local en la lista o en el mapa."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  protected itemAgregado(b: { id: string; marca: string; nombre: string; imagen: string; puntos?: number | undefined }) {
    return { id: b.id, marca: b.marca, nombre: b.nombre, imagen: b.imagen, puntos: b.puntos ?? 0 };
  }

  protected agregarAlCarrito() {
    const b = this.beneficio();
    if (!b) return;
    this.store.add({
      id: b.id,
      tipo: "beneficio",
      nombre: b.nombre,
      marca: b.marca,
      imagen: b.imagen,
      puntos: b.puntos ?? 0,
      precio: b.precio ?? 0,
      digital: true,
      soloDinero: b.soloDinero ?? false,
    });
    this.agregado.set(true);
  }
}

/* ------------------------------------------------------------------ */
/* Búsqueda (/buscar?q=)                                               */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-buscar-page",
  imports: [EstadoErrorComponent, ProductCardComponent, BenefitCardComponent, AddedToCartModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Resultados para “{{ q() }}”</h1>
        <p class="mt-2 text-base text-muted-foreground">{{ prods().length + bens().length }} coincidencias en productos y beneficios.</p>

        @if (prods().length > 0) {
          <section class="mt-10">
            <h2 class="text-xl font-extrabold text-ink">Productos</h2>
            <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              @for (p of prods(); track p.id) { <app-product-card [producto]="p" (add)="onAdd($event)" /> }
            </div>
          </section>
        }

        @if (bens().length > 0) {
          <section class="mt-12">
            <h2 class="text-xl font-extrabold text-ink">Beneficios</h2>
            <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              @for (b of bens(); track b.id) { <app-benefit-card [beneficio]="b" /> }
            </div>
          </section>
        }

        @if (catalog.errorCarga() && !catalog.cargado()) { <app-estado-error (reintentar)="catalog.reintentar()" /> }
        @if (catalog.cargado() && prods().length + bens().length === 0) {
          <p class="mt-10 rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">
            No encontramos resultados. Intenta con otra marca o categoría.
          </p>
        }
      </div>
    </div>
    <app-added-to-cart-modal [producto]="agregado()" (closed)="agregado.set(null)" />
  `,
})
export class BuscarPage {
  protected readonly catalog = inject(CatalogService);
  private readonly store = inject(StoreService);
  /** Query param `q` (enlazado por withComponentInputBinding). */
  readonly q = input("");
  protected readonly agregado = signal<Producto | null>(null);

  private readonly t = computed(() => this.q().trim().toLowerCase());
  protected readonly prods = computed(() =>
    this.catalog.productos().filter((p) => `${p.nombre} ${p.marca} ${p.categoriaLabel}`.toLowerCase().includes(this.t())),
  );
  protected readonly bens = computed(() =>
    this.catalog.beneficios().filter((b) => `${b.nombre} ${b.marca} ${b.categoria}`.toLowerCase().includes(this.t())),
  );

  protected onAdd(p: Producto) {
    agregarProducto(this.store, p);
    this.agregado.set(p);
  }
}

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */
@Component({
  selector: "app-favoritos-page",
  imports: [ProductCardComponent, BenefitCardComponent, AddedToCartModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface py-10 lg:py-14">
      <div class="page-container">
        <h1 class="text-2xl font-extrabold text-ink lg:text-3xl">Mis favoritos</h1>
        <p class="mt-2 text-base text-muted-foreground">{{ visibles() !== total() ? visibles() + " de " + total() : total() }} elementos guardados.</p>

        <!-- Buscador solo con más de 8 favoritos y chips solo si hay productos y beneficios: con pocos, serían estorbo. -->
        @if (conBuscador()) {
          <input type="search" aria-label="Buscar en mis favoritos" placeholder="Buscar en mis favoritos" maxlength="60" [value]="texto()" (input)="texto.set($any($event.target).value)"
            class="mt-5 h-12 w-full max-w-xl rounded-full border border-border bg-card px-5 text-base text-ink outline-none focus:ring-2 focus:ring-primary/50" />
        }
        @if (conTipos()) {
          <div role="tablist" aria-label="Tipo de favoritos" class="mt-4 flex flex-wrap gap-2">
            @for (t of tiposFiltro(); track t.id) {
              <button role="tab" type="button" [attr.aria-selected]="tipoActivo() === t.id" (click)="tipo.set(t.id)"
                [class]="'min-h-10 rounded-full border px-5 text-sm font-bold ' + (tipoActivo() === t.id ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink hover:border-primary')">{{ t.label }}</button>
            }
          </div>
        }

        @if (total() > 0 && visibles() === 0) {
          <p class="mt-10 rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">No encontramos favoritos. Prueba con otra búsqueda o con otro tipo.</p>
        }

        @if (prods().length > 0) {
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            @for (p of prods(); track p.id) { <app-product-card [producto]="p" [nivel]="2" (add)="onAdd($event)" /> }
          </div>
        }
        @if (bens().length > 0) {
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            @for (b of bens(); track b.id) { <app-benefit-card [beneficio]="b" [nivel]="2" /> }
          </div>
        }
        @if (total() === 0) {
          <p class="mt-10 rounded-2xl bg-card p-8 text-center text-base text-muted-foreground shadow-[var(--shadow-card)]">
            Todavía no tienes favoritos. Toca el corazón en cualquier producto o beneficio.
          </p>
        }
      </div>
    </div>
    <app-added-to-cart-modal [producto]="agregado()" (closed)="agregado.set(null)" />
  `,
})
export class FavoritosPage {
  private readonly catalog = inject(CatalogService);
  private readonly store = inject(StoreService);
  protected readonly agregado = signal<Producto | null>(null);
  private readonly todosProds = computed(() => this.catalog.productos().filter((p) => this.store.favoritos().includes(p.id)));
  private readonly todosBens = computed(() => this.catalog.beneficios().filter((b) => this.store.favoritos().includes(b.id)));
  protected readonly total = computed(() => this.todosProds().length + this.todosBens().length);

  /** Búsqueda y tipo («todos», «productos» o «beneficios»). El buscador solo aparece con más de 8 favoritos. */
  protected readonly texto = signal("");
  protected readonly tipo = signal<"todos" | "productos" | "beneficios">("todos");
  protected readonly conBuscador = computed(() => this.total() > 8);
  /** Los chips de tipo solo tienen sentido si hay de los dos tipos. */
  protected readonly conTipos = computed(() => this.todosProds().length > 0 && this.todosBens().length > 0);
  protected readonly tipoActivo = computed(() => (this.conTipos() ? this.tipo() : "todos"));
  protected readonly tiposFiltro = computed(() => [
    { id: "todos" as const, label: "Todos" },
    { id: "productos" as const, label: `Productos (${this.todosProds().length})` },
    { id: "beneficios" as const, label: `Beneficios (${this.todosBens().length})` },
  ]);
  private readonly q = computed(() => (this.conBuscador() ? sinTildes(this.texto().trim()) : ""));
  protected readonly prods = computed(() =>
    this.tipoActivo() === "beneficios" ? [] : this.todosProds().filter((p) => !this.q() || sinTildes(`${p.marca} ${p.nombre}`).includes(this.q())),
  );
  protected readonly bens = computed(() =>
    this.tipoActivo() === "productos" ? [] : this.todosBens().filter((b) => !this.q() || sinTildes(`${b.marca} ${b.nombre}`).includes(this.q())),
  );
  protected readonly visibles = computed(() => this.prods().length + this.bens().length);

  protected onAdd(p: Producto) {
    agregarProducto(this.store, p);
    this.agregado.set(p);
  }
}

/** Minúsculas y sin tildes, para que «cafetera» encuentre «Cafetera» y «cámara» encuentre «camara». */
const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
