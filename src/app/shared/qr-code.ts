import { ChangeDetectionStrategy, Component, effect, input, signal } from "@angular/core";
import { matrizQr, svgDeQr, urlDeSvg } from "../core/qr";

/** Código QR de `valor`, generado en el navegador. Mientras se calcula muestra un recuadro gris del mismo tamaño. */
@Component({
  selector: "app-qr",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    @if (src(); as s) {
      <img [src]="s" [alt]="'Código QR ' + valor()" width="220" height="220" [class]="clase()" />
    } @else {
      <div [class]="clase() + ' animate-pulse rounded-lg bg-muted'" aria-hidden="true"></div>
    }
  `,
})
export class QrCodeComponent {
  readonly valor = input.required<string>();
  /** Clases del recuadro (tamaño y márgenes). */
  readonly clase = input("mx-auto h-48 w-48");
  protected readonly src = signal<string | null>(null);

  constructor() {
    effect(() => {
      const v = this.valor();
      this.src.set(null);
      matrizQr(v).then(
        (m) => { if (v === this.valor()) this.src.set(urlDeSvg(svgDeQr(m))); },
        () => this.src.set(null),
      );
    });
  }
}
