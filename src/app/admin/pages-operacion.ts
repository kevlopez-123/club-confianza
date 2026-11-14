import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { textoHoras } from '../core/limites-programa';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { leer } from '../core/leer';
import { CatalogService } from '../core/catalog.service';
import { CargaMasivaComponent } from './carga-masiva';
import { BrandService } from '../core/brand.service';
import { AdminSession } from './session';
import { formatPuntos, formatUSD, nivelPorPuntos } from '../core/format';
import { estadoLabels, tipoLabels } from '../core/labels';
import type {
  BeneficioUsuario,
  Compra,
  Cotizacion,
  Direccion,
  EstadoPedido,
  Movimiento,
  Participante,
} from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { LimpiarFiltrosComponent } from '../shared/limpiar-filtros';
import {
  AdminApi,
  Paginado,
  PagerComponent,
  descargarTabla,
  AdminModalComponent,
  BtnDirective,
  ConfirmComponent,
  DrawerComponent,
  DrawerTitleComponent,
  FieldComponent,
  INPUT_CLS,
  PageHeaderComponent,
  PillComponent,
  StatComponent,
  ToastService,
  FilaEsqueletoComponent,
  OrdenColumnaComponent,
  abrirDesdeUrl,
} from './kit';

const ahora = () => new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

/* ------------------------------------------------------------------ */
/* Participantes                                                       */
/* ------------------------------------------------------------------ */
type Ajuste = { fecha: string; puntos: number; motivo: string; usuario: string };
type Ficha = Participante & { direcciones: Direccion[]; ajustes: Ajuste[] };
@Component({
  selector: 'a-participantes-page',
  imports: [CargaMasivaComponent, RouterLink, OrdenColumnaComponent, 
    IconComponent,
    PageHeaderComponent,
    PillComponent,
    BtnDirective,
    PagerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a-header vista="participantes" title="Participantes" [desc]="pag.total().toLocaleString('es') + ' participantes registrados'">
      <a routerLink="/admin/participantes/solicitudes-eliminacion" aBtn variant="outline">
        <app-icon name="Trash2" class="h-4 w-4" /> Solicitudes de eliminación
      </a>
      <button aBtn variant="outline" (click)="ajusteMasivo.set(true)">
        <app-icon name="Upload" class="h-4 w-4" /> Ajuste masivo de puntos
      </button>
      <button aBtn variant="outline" (click)="carga.set(true)">
        <app-icon name="Upload" class="h-4 w-4" /> Carga masiva
      </button>
    </a-header>

    <div class="adm-filtros"><div class="adm-busca">
      <app-icon
        name="Search"
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        [class]="input + ' pl-9'"
        placeholder="Buscar por nombre o DNI"
        aria-label="Buscar participante"
        (input)="pag.buscar($any($event.target).value)"
      />
    </div></div>

    <div class="adm-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th aOrden="nombre" [pag]="pag" etiquetaOrden="Participante">Participante</th>
            <th aOrden="estado" [pag]="pag" etiquetaOrden="Estado">Estado</th>
            <th aOrden="canal" [pag]="pag" etiquetaOrden="Canal">Canal</th>
            <th aOrden="cedula" [pag]="pag" etiquetaOrden="DNI">DNI</th>
            <th aOrden="puntos" [pag]="pag" etiquetaOrden="Saldo">Saldo</th>
            <th aOrden="acumulados12m" [pag]="pag" etiquetaOrden="Nivel">Nivel</th>
            <th aria-label="Ficha"></th>
          </tr>
        </thead>
        <tbody>
          @for (r of pag.items(); track r.id) {
            <tr>
              <td>
                <a [routerLink]="['/admin/participantes', r.id]" class="block text-left">
                  <b class="hover:underline">{{ r.nombre }}</b>
                  <p class="text-xs text-muted-foreground">{{ r.email }}</p>
                </a>
              </td>
              <!-- Tarjeta: nombre y estado arriba; canal junto a la cédula; saldo junto al nivel; el ojo lleva a la ficha. -->
              <td class="det-completo det-chip">
                <a-pill [tone]="r.estado === 'Activo' ? 'ok' : 'bad'">{{ r.estado }}</a-pill>
              </td>
              <td>{{ r.canal }}</td>
              <td>{{ r.cedula }}</td>
              <td>
                <b>{{ puntos(r.puntos) }}</b>
              </td>
              <td>{{ nivel(r.acumulados12m) }}</td>
              <td class="det-ojo"><a [routerLink]="['/admin/participantes', r.id]" [attr.aria-label]="'Ver ficha de ' + r.nombre" title="Ver ficha" class="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><app-icon name="Eye" class="h-4 w-4" /></a></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <a-pager [p]="pag" />

    <a-carga-masiva tipo="ajustes" [abierto]="ajusteMasivo()" (cerrado)="ajusteMasivo.set(false)" (terminada)="pag.recargar()" />
    <a-carga-masiva tipo="participantes" [abierto]="carga()" (cerrado)="carga.set(false)" (terminada)="pag.recargar()" />
  `,
})
export class ParticipantesPage {
  private readonly session = inject(AdminSession);
  protected readonly toast = inject(ToastService);
  private readonly admin = inject(AdminApi);
  private readonly api = inject(ApiService);
  private readonly catalog = inject(CatalogService);
  protected readonly input = INPUT_CLS;
  protected readonly puntos = formatPuntos;
  protected readonly pag = new Paginado<Ficha>(inject(ApiService), 'participantes');

  protected readonly carga = signal(false);
  protected readonly ajusteMasivo = signal(false);
  constructor() {
    this.pag.recargar();
  }

  protected nivel(acum: number) {
    const n = this.catalog.niveles();
    return n.length ? nivelPorPuntos(n, acum).nombre : '';
  }
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */
type Pedido = Compra & {
  cliente: string;
  email: string;
  estadoAdmin: EstadoPedido;
  digital: boolean;
  guia: string;
  historial: { estado: EstadoPedido; fecha: string; nota?: string }[];
};
const flujoFisico: EstadoPedido[] = ['Confirmado', 'Preparando', 'Enviado', 'Entregado'];
const flujoDigital: EstadoPedido[] = ['Confirmado', 'Digital enviado'];

@Component({
  selector: 'a-pedidos-page',
  imports: [OrdenColumnaComponent, FilaEsqueletoComponent, 
    LimpiarFiltrosComponent,
    IconComponent,
    PageHeaderComponent,
    PillComponent,
    BtnDirective,
    FieldComponent,
    ConfirmComponent,
    DrawerComponent,
    DrawerTitleComponent,
    PagerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a-header vista="pedidos" title="Pedidos" desc="Canjes de productos y beneficios desde la web.">
      <button aBtn variant="outline" (click)="exportar()">
        <app-icon name="Download" class="h-4 w-4" /> Descargar
      </button>
    </a-header>
    <div class="adm-filtros">
      <div class="adm-busca">
        <app-icon
          name="Search"
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          [class]="input + ' pl-9'"
          placeholder="Código o cliente"
          aria-label="Buscar pedido"
          (input)="pag.buscar($any($event.target).value)"
        />
      </div>
      <select
        aria-label="Estado"
        [class]="input + ' w-auto'"
        (change)="pag.filtrar('estadoAdmin', $any($event.target).value)"
      >
        <option value="">Todos los estados</option>
        @for (e of estados; track e) {
          <option>{{ e }}</option>
        }
      </select>
      <app-limpiar-filtros [activo]="pag.activo()" (limpiar)="pag.limpiar()" />
    </div>

    <div class="adm-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th aOrden="codigo" [pag]="pag" etiquetaOrden="Código">Código</th>
            <th aOrden="estadoAdmin" [pag]="pag" etiquetaOrden="Estado">Estado</th>
            <th aOrden="fechaISO" [pag]="pag" etiquetaOrden="Fecha">Fecha</th>
            <th aOrden="cliente" [pag]="pag" etiquetaOrden="Cliente">Cliente</th>
            <th aOrden="digital" [pag]="pag" etiquetaOrden="Tipo">Tipo</th>
            <th>Items</th>
            <th>Pago</th>
            <th aria-label="Detalle"></th>
          </tr>
        </thead>
        <tbody>
          @for (r of pag.items(); track r.codigo) {
            <tr>
              <td>
                <button class="font-bold hover:underline" (click)="abrir(r.codigo)">
                  {{ r.codigo }}
                </button>
              </td>
              <td class="det-completo det-chip">
                <a-pill
                  [tone]="
                    r.estadoAdmin === 'Cancelado'
                      ? 'bad'
                      : r.estadoAdmin === 'Entregado' || r.estadoAdmin === 'Digital enviado'
                        ? 'ok'
                        : 'warn'
                  "
                  >{{ r.estadoAdmin }}</a-pill
                >
              </td>
              <td>{{ r.fecha }}@if ($any(r).hora) { · {{ $any(r).hora }} }</td>
              <td>{{ r.cliente }}</td>
              <td>{{ r.digital ? 'Digital' : 'Físico' }}</td>
              <td>{{ r.items.length }}</td>
              <td>{{ r.montoUSD ? usd(r.montoUSD) : puntos(r.puntosUsados) + ' pts' }}</td>
              <td class="det-ojo"><button type="button" class="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" [attr.aria-label]="'Ver detalle de ' + r.codigo" title="Ver detalle" (click)="abrir(r.codigo)"><app-icon name="Eye" class="h-4 w-4" /></button></td>
            </tr>
          } @empty {
            @if (pag.cargando()) { @for (n of [1, 2, 3, 4, 5]; track n) { <tr aEsqueleto [cols]="8"></tr> } } @else { <tr><td colspan="8" class="adm-empty">No hay pedidos con estos filtros</td></tr> }
          }
        </tbody>
      </table>
    </div>
    <a-pager [p]="pag" />

    <a-drawer [open]="!!sel()" (closed)="selCod.set(null)">
      @if (sel(); as s) {
        <a-drawer-title (closed)="selCod.set(null)">
          <p class="text-sm text-muted-foreground">Pedido</p>
          <h2 class="text-2xl font-bold">{{ s.codigo }}</h2>
          <p class="text-sm text-muted-foreground">{{ s.fecha }} · {{ s.cliente }}</p>
        </a-drawer-title>

        <h3 class="mt-6 font-semibold">Seguimiento</h3>
        <ol class="mt-3 space-y-0">
          @for (e of pasos(); track e; let i = $index; let last = $last) {
            <li class="relative flex gap-3 pb-5 last:pb-0">
              @if (!last) {
                <span
                  [class]="
                    'absolute left-[13px] top-7 h-full w-0.5 ' +
                    (hist(e) ? 'bg-primary' : 'bg-border')
                  "
                ></span>
              }
              <span
                [class]="
                  'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ' +
                  (e === 'Cancelado'
                    ? 'border-destructive bg-destructive text-destructive-foreground'
                    : hist(e)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card')
                "
              >
                @if (hist(e)) {
                  <app-icon [name]="e === 'Cancelado' ? 'X' : 'Check'" class="h-4 w-4" />
                }
              </span>
              <div>
                <p [class]="'font-semibold ' + (!hist(e) ? 'text-muted-foreground' : '')">
                  {{ e }}
                </p>
                @if (hist(e); as h) {
                  <p class="text-xs text-muted-foreground">
                    {{ h.fecha }}{{ h.nota ? ' · ' + h.nota : '' }}
                  </p>
                }
              </div>
            </li>
          }
        </ol>

        <h3 class="mt-6 font-semibold">Productos</h3>
        <ul class="mt-2 divide-y divide-border rounded-xl border border-border">
          @for (it of s.items; track it.nombre) {
            <li class="flex items-center gap-3 p-3">
              <img [src]="it.imagen" alt="" class="h-12 w-12 rounded-lg object-cover" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold">{{ it.nombre }}</p>
                <p class="text-xs text-muted-foreground">{{ it.marca }} · x{{ it.cantidad }}</p>
              </div>
              <b>{{ puntos(it.puntos * it.cantidad) }} pts</b>
            </li>
          }
        </ul>
        <div class="mt-3 flex justify-between rounded-xl bg-muted/60 p-3 font-semibold">
          <span>Total</span
          ><span>{{ s.montoUSD ? usd(s.montoUSD) : puntos(s.puntosUsados) + ' puntos' }}</span>
        </div>

        <h3 class="mt-6 font-semibold">Entrega</h3>
        @if (s.digital) {
          <p class="mt-2 flex items-center gap-2 rounded-xl bg-muted/60 p-3">
            <app-icon name="Mail" class="h-4 w-4" /> Envío digital a {{ s.email }}
          </p>
        } @else {
          <div class="mt-2 flex gap-2 rounded-xl bg-muted/60 p-3">
            <app-icon name="MapPin" class="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p class="font-semibold">Recibe {{ s.cliente }}</p>
              <p class="text-sm text-muted-foreground">{{ s.entrega }}</p>
            </div>
          </div>
          <a-field label="Número de guía (courier)" class="mt-3">
            <input
              [class]="input"
              [value]="s.guia"
              (input)="patch({ guia: $any($event.target).value })"
              placeholder="Ej. SERV-48210"
              [disabled]="s.estadoAdmin === 'Cancelado'"
            />
          </a-field>
        }

        @if (s.estadoAdmin !== 'Cancelado') {
          <div class="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            @if (siguiente(); as sig) {
              <button aBtn [disabled]="sig === 'Enviado' && !s.guia" (click)="avanzar(sig)">
                Marcar como {{ sig }}
              </button>
            }
            @if (s.estadoAdmin !== 'Entregado' && s.estadoAdmin !== 'Digital enviado') {
              <button aBtn variant="peligro" (click)="cancelar.set(true)">Cancelar pedido</button>
            }
            @if (siguiente() === 'Enviado' && !s.guia) {
              <p class="w-full text-sm text-muted-foreground">
                Ingresa el número de guía para marcarlo como enviado.
              </p>
            }
          </div>
        }
      }
    </a-drawer>

    <a-confirm
      [open]="cancelar()"
      [danger]="true"
      title="¿Cancelar este pedido?"
      confirmLabel="Sí, cancelar"
      (closed)="cancelar.set(false); motivo.set('')"
      (confirmed)="avanzar('Cancelado', motivo() || 'Sin motivo')"
    >
      <p>
        Se devolverán
        <b class="text-foreground">{{ puntos(sel()?.puntosUsados ?? 0) }} puntos</b> al participante
        @if (sel()?.montoUSD) {
          y se reembolsarán <b class="text-foreground">{{ usd(sel()!.montoUSD) }}</b> a su tarjeta
        }
        . Esta acción no se puede deshacer.
      </p>
      <a-field label="Motivo" class="mt-4"
        ><input
          [class]="input"
          [value]="motivo()"
          (input)="motivo.set($any($event.target).value)"
          placeholder="Ej. sin stock del proveedor"
      /></a-field>
    </a-confirm>
  `,
})
export class PedidosPage {
  /** Descarga en CSV los pedidos de la página y filtros actuales. */
  protected exportar() {
    descargarTabla('pedidos', [['Código', 'Fecha', 'Cliente', 'Estado', 'Puntos usados', 'Monto'], ...this.pag.items().map((p) => [p.codigo, p.fecha, p.cliente, p.estadoAdmin, p.puntosUsados, p.montoUSD])], 'Pedidos');
  }
  protected readonly toast = inject(ToastService);
  private readonly admin = inject(AdminApi);
  protected readonly input = INPUT_CLS;
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
  protected readonly estados: EstadoPedido[] = [
    'Confirmado',
    'Preparando',
    'Enviado',
    'Entregado',
    'Digital enviado',
    'Cancelado',
  ];

  private readonly api = inject(ApiService);
  protected readonly pag = new Paginado<Pedido>(inject(ApiService), 'pedidos');
  private readonly selPedido = signal<Pedido | null>(null);
  protected readonly selCod = signal<string | null>(null);
  protected readonly cancelar = signal(false);
  protected readonly motivo = signal('');

  protected readonly sel = computed(() => (this.selCod() ? this.selPedido() : null));
  private readonly flujo = computed(() => (this.sel()?.digital ? flujoDigital : flujoFisico));
  protected readonly pasos = computed(() => {
    const s = this.sel();
    return s?.estadoAdmin === 'Cancelado' ? s.historial.map((h) => h.estado) : this.flujo();
  });
  protected readonly siguiente = computed(() => {
    const s = this.sel();
    if (!s || s.estadoAdmin === 'Cancelado') return null;
    const flujo = this.flujo();
    const idx = flujo.indexOf(s.estadoAdmin);
    return idx < flujo.length - 1 ? flujo[idx + 1]! : null;
  });

  constructor() {
    this.pag.recargar();
    abrirDesdeUrl((c) => this.abrir(c));
  }

  protected abrir(codigo: string) {
    this.selCod.set(codigo);
    this.api.get<Pedido>(`admin/c/pedidos/${codigo}`).subscribe((p) => this.selPedido.set(p));
  }

  protected hist(e: EstadoPedido) {
    return this.sel()?.historial.find((x) => x.estado === e);
  }
  protected patch(p: Partial<Pedido>) {
    const s = this.selPedido();
    if (!s) return;
    const nuevo = { ...s, ...p };
    this.selPedido.set(nuevo);
    this.api.put(`admin/c/pedidos/${nuevo.codigo}`, nuevo).subscribe(() => this.pag.recargar());
  }
  protected avanzar(e: EstadoPedido, nota?: string) {
    const s = this.sel();
    if (!s) return;
    this.patch({
      estadoAdmin: e,
      historial: [...s.historial, { estado: e, fecha: ahora(), ...(nota ? { nota } : {}) }],
    });
    this.toast.show(
      e === 'Cancelado'
        ? `Pedido cancelado · ${formatPuntos(s.puntosUsados)} puntos devueltos`
        : `Estado actualizado a ${e} · se notificó al cliente`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Compras de puntos                                                   */
/* ------------------------------------------------------------------ */
type CompraPuntosFila = { codigo: string; fecha: string; fechaISO: string; cliente: string; email: string; cantidad: number; monto: number; estado: string; intentos?: number; motivo?: string; referencia?: string; participanteId?: string };

@Component({
  selector: 'a-compras-puntos-page',
  imports: [AdminModalComponent, RouterLink, OrdenColumnaComponent, FilaEsqueletoComponent,
    LimpiarFiltrosComponent,IconComponent, PageHeaderComponent, PillComponent, BtnDirective, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a-header vista="compras-puntos" title="Compras de puntos" [desc]="pag.total().toLocaleString('es') + ' operaciones · cada compra del participante queda registrada aquí y en su historial de puntos'">
      <button aBtn variant="outline" (click)="exportar()"><app-icon name="Download" class="h-4 w-4" /> Descargar</button>
    </a-header>
    <div class="adm-filtros">
      <div class="adm-busca">
        <app-icon name="Search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input aria-label="Buscar compra" [class]="input + ' pl-9'" placeholder="Operación, participante o correo" (input)="pag.buscar($any($event.target).value)" />
      </div>
      <select aria-label="Filtrar por estado" [class]="input + ' w-auto'" (change)="pag.filtrar('estado', $any($event.target).value)">
        <option value="">Todos los estados</option>
        <option>Aprobada</option><option>Pendiente</option><option>Fallida</option>
      </select>
      <input type="date" aria-label="Desde" [class]="input + ' w-auto'" (input)="pag.filtrar('desde', $any($event.target).value)" />
      <input type="date" aria-label="Hasta" [class]="input + ' w-auto'" (input)="pag.filtrar('hasta', $any($event.target).value)" />
      <app-limpiar-filtros [activo]="pag.activo()" (limpiar)="pag.limpiar()" />
    </div>
    <div class="adm-wrap">
      <table class="adm-table">
        <thead><tr><th aOrden="codigo" [pag]="pag" etiquetaOrden="Operación">Operación</th><th aOrden="estado" [pag]="pag" etiquetaOrden="Estado">Estado</th><th aOrden="fechaISO" [pag]="pag" etiquetaOrden="Fecha">Fecha</th><th aOrden="cliente" [pag]="pag" etiquetaOrden="Participante">Participante</th><th aOrden="cantidad" [pag]="pag" etiquetaOrden="Puntos">Puntos</th><th aOrden="monto" [pag]="pag" etiquetaOrden="Monto pagado">Monto pagado</th><th>Pago</th><th aria-label="Detalle"></th></tr></thead>
        <tbody>
          @for (c of pag.items(); track c.codigo) {
            <tr>
              <td><button type="button" class="font-bold hover:underline" [attr.aria-label]="'Ver detalle de la operación ' + c.codigo" (click)="detalle.set(c)">{{ c.codigo }}</button></td>
              <td class="det-completo det-chip"><a-pill [tone]="c.estado === 'Aprobada' ? 'ok' : c.estado === 'Pendiente' ? 'warn' : c.estado === 'Fallida' ? 'bad' : 'muted'">{{ c.estado }}</a-pill></td>
              <td>{{ c.fecha }}@if ($any(c).hora) { · {{ $any(c).hora }} }</td>
              <td>{{ c.cliente }}<span class="block text-xs text-muted-foreground">{{ c.email }}</span></td>
              <td>{{ puntos(c.cantidad) }}</td>
              <td>{{ usd(c.monto) }}</td>
              <td class="det-completo">
                @if (c.estado === 'Aprobada') { <span class="text-xs text-muted-foreground">{{ c.intentos ? c.intentos + ' intento(s)' : '—' }}</span> }
                @else {
                  <span class="block text-xs text-muted-foreground">{{ c.motivo || (c.intentos ? 'Sin confirmar' : 'Aún sin pagar') }}@if (c.intentos) { · {{ c.intentos }} intento(s) }</span>
                  @if (c.estado === 'Pendiente' && c.intentos) {
                    <span class="mt-1 flex flex-wrap gap-1">
                      <button aBtn variant="outline" [attr.aria-label]="'Confirmar pago ' + c.codigo" (click)="resolver(c, 'aprobado')">Confirmar pago</button>
                      <button aBtn variant="ghost" [attr.aria-label]="'Rechazar pago ' + c.codigo" (click)="resolver(c, 'rechazado')">Rechazar</button>
                    </span>
                  }
                }
              </td>
              <td class="det-ojo"><button type="button" class="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" [attr.aria-label]="'Ver detalle de la operación ' + c.codigo" title="Ver detalle" (click)="detalle.set(c)"><app-icon name="Eye" class="h-4 w-4" /></button></td>
            </tr>
          } @empty {
            @if (pag.cargando()) { @for (n of [1, 2, 3, 4, 5]; track n) { <tr aEsqueleto [cols]="8"></tr> } } @else { <tr><td colspan="8" class="adm-empty">Aún no hay compras de puntos</td></tr> }
          }
        </tbody>
      </table>
    </div>
    <a-pager [p]="pag" />
    <a-modal [open]="!!detalle()" [wide]="true" [title]="'Operación ' + (detalle()?.codigo ?? '')" (closed)="detalle.set(null)">
      @if (detalle(); as c) {
        <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Participante</dt><dd class="text-sm font-semibold">{{ c.cliente }}</dd><dd class="text-xs text-muted-foreground">{{ c.email }}</dd></div>
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Fecha</dt><dd class="text-sm font-semibold">{{ c.fecha }}</dd></div>
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Puntos</dt><dd class="text-sm font-semibold">{{ puntos(c.cantidad) }}</dd></div>
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Monto</dt><dd class="text-sm font-semibold">{{ usd(c.monto) }}</dd></div>
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Estado</dt><dd><a-pill [tone]="c.estado === 'Aprobada' ? 'ok' : c.estado === 'Pendiente' ? 'warn' : c.estado === 'Fallida' ? 'bad' : 'muted'">{{ c.estado }}</a-pill></dd></div>
          <div><dt class="text-xs font-semibold uppercase text-muted-foreground">Intentos de pago</dt><dd class="text-sm font-semibold">{{ c.intentos ?? 0 }}</dd></div>
          @if (c.referencia) { <div class="sm:col-span-2"><dt class="text-xs font-semibold uppercase text-muted-foreground">Referencia de la pasarela</dt><dd class="break-all font-mono text-sm">{{ c.referencia }}</dd></div> }
        </dl>
        @if (c.motivo) { <p class="mt-4 rounded-xl bg-muted/60 p-3 text-sm"><b>Motivo:</b> {{ c.motivo }}</p> }
        <div class="det-pie">
          @if (c.estado === 'Pendiente' && c.intentos) {
            <button aBtn variant="outline" (click)="resolver(c, 'aprobado'); detalle.set(null)">Confirmar pago</button>
            <button aBtn variant="ghost" (click)="resolver(c, 'rechazado'); detalle.set(null)">Rechazar</button>
          }
          @if (c.participanteId) { <a [routerLink]="['/admin/participantes', c.participanteId]" class="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Ver ficha del participante</a> }
        </div>
      }
    </a-modal>
  `,
})
export class ComprasPuntosPage {
  protected readonly detalle = signal<CompraPuntosFila | null>(null);
  protected readonly input = INPUT_CLS;
  protected readonly puntos = formatPuntos;
  protected readonly usd = formatUSD;
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  protected readonly pag = new Paginado<CompraPuntosFila>(this.api, 'comprasPuntos');

  constructor() {
    this.pag.recargar();
    abrirDesdeUrl((c) => this.api.get<CompraPuntosFila>(`admin/c/comprasPuntos/${c}`).subscribe((f) => this.detalle.set(f)));
  }
  /** Simula lo que haría el aviso (webhook) de la pasarela: confirmar o rechazar un pago que quedó pendiente. */
  protected resolver(c: CompraPuntosFila, resultado: 'aprobado' | 'rechazado') {
    this.api.post(`admin/compras-puntos/${c.codigo}/resolver`, { resultado }).subscribe({
      next: () => {
        this.toast.show(resultado === 'aprobado' ? `Pago ${c.codigo} confirmado y puntos acreditados` : `Pago ${c.codigo} rechazado`);
        this.pag.recargar();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'No se pudo resolver el pago.'),
    });
  }
  /** Descarga en CSV las operaciones de la página y filtros actuales. */
  protected exportar() {
    descargarTabla('compras-de-puntos', [['Operación', 'Fecha', 'Participante', 'Correo', 'Puntos', 'Monto', 'Estado'], ...this.pag.items().map((c) => [c.codigo, c.fecha, c.cliente, c.email, c.cantidad, c.monto, c.estado])], 'Compras de puntos');
  }
}
