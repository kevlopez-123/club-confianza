/** Contexto que recibe cada handler del backend simulado. */
export type Ctx = { body: any; params: Record<string, string>; query: URLSearchParams };
export type Handler = (ctx: Ctx) => unknown;
export type Route = [method: string, path: string, handler: Handler];

/** Código de error por defecto según el estado HTTP, cuando el caso no define uno propio. */
export function codigoPorEstado(status: number): string {
  switch (status) {
    case 400: return "solicitud_invalida";
    case 401: return "no_autenticado";
    case 403: return "prohibido";
    case 404: return "no_encontrado";
    case 409: return "conflicto";
    case 412: return "version_obsoleta";
    case 422: return "datos_invalidos";
    default: return status >= 500 ? "error_interno" : "error";
  }
}

/**
 * Error del API. Todo error responde `{ codigo, mensaje, message }`: `codigo` es estable (para que la app distinga el caso y
 * decida qué mostrar), `mensaje` es el texto para la persona y `message` repite el mismo texto para los clientes que ya lo leen.
 */
export class ApiError extends Error {
  readonly codigo: string;
  constructor(
    readonly status: number,
    message: string,
    codigo?: string,
  ) {
    super(message);
    this.codigo = codigo ?? codigoPorEstado(status);
  }
}

/** Cuerpo JSON de un error del API. */
export const cuerpoDeError = (e: ApiError) => ({ codigo: e.codigo, mensaje: e.message, message: e.message });