/**
 * Estados de un pedido. El panel maneja seis (Confirmado, Preparando, Enviado, Entregado, Digital enviado, Cancelado);
 * el participante ve cuatro, más simples. Este es el único lugar donde se define la equivalencia.
 */
export type EstadoPedidoPanel = "Confirmado" | "Preparando" | "Enviado" | "Entregado" | "Digital enviado" | "Cancelado";
export type EstadoPedidoParticipante = "Procesando" | "En camino" | "Entregado" | "Cancelado";

export function estadoParaParticipante(e: string | undefined): EstadoPedidoParticipante {
  switch (e) {
    case "Enviado":
      return "En camino";
    case "Entregado":
    case "Digital enviado":
      return "Entregado";
    case "Cancelado":
      return "Cancelado";
    default:
      return "Procesando"; // Confirmado y Preparando
  }
}
