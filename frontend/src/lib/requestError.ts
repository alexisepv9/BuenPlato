/** Mensajes seguros: separa errores de negocio de páginas HTML del proxy y fallos de red. */
export function requestErrorMessage(status: number | undefined, data: unknown, path: string,
  code: string | undefined, reference: unknown, method = "GET"): string {
  const login = path === "/auth/login";
  const writing = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const messages: Record<number, string> = {
    400: "Revisa los datos del formulario; alguno no es válido.",
    401: login ? "Correo o contraseña incorrectos. Revisa tus datos e inténtalo nuevamente." : "Tu sesión venció. Vuelve a iniciar sesión para continuar.",
    403: "No tienes permiso para esta operación o el servidor rechazó el origen de la solicitud.",
    404: "No se encontró el recurso solicitado. Actualiza la página y revisa si sigue disponible.",
    405: "El servidor no admite esta operación. Comprueba que frontend y backend estén actualizados.",
    409: "Los datos cambiaron o ya existe un registro equivalente. Revisa antes de guardar nuevamente.",
    413: "El archivo supera el tamaño permitido. Elige una imagen más pequeña.",
    415: "El servidor no admite el formato enviado. Revisa el archivo o actualiza la aplicación.",
    422: "Revisa los campos indicados antes de guardar.",
    429: "Hay demasiadas solicitudes. Espera un momento antes de intentar nuevamente.",
    500: "El servidor no pudo completar la operación. Contacta al administrador con la referencia del error.",
    502: "El servicio no está disponible (502). El servidor intermediario no obtuvo una respuesta válida del backend.",
    503: "El servicio está temporalmente fuera de servicio (503). Espera unos instantes.",
    504: "El backend no respondió a tiempo (504). Puede estar iniciándose o sobrecargado.",
  };
  let message = status ? messages[status] ?? "No se pudo completar la solicitud." :
    code === "ECONNABORTED" || code === "ETIMEDOUT" ? "Se agotó el tiempo de espera del servidor." : "No se pudo conectar con el servidor. Comprueba tu conexión.";
  // Solo mensajes breves de negocio en 4xx. Nunca HTML, SQL, trazas o cuerpos 5xx.
  if (status && status >= 400 && status < 500 && status !== 401) {
    const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const candidate = body.message;
    if (typeof candidate === "string" && candidate.length <= 500 && !/[<>]|Exception|\bSQL\b|\bat\s+\w+\./i.test(candidate)) message = candidate;
  }
  if (writing && !login && (!status || status >= 500)) message += " No se confirmó el guardado: revisa el listado antes de reintentar para evitar duplicados.";
  const safeReference = typeof reference === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(reference) ? reference : "";
  return `${message}${status ? ` [HTTP ${status}]` : ""}${safeReference ? ` Referencia: ${safeReference}.` : ""}`;
}
