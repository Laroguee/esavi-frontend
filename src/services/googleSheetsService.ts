export async function guardarEnSheets(tabla: string, datos: any) {
  let payload: any = { tabla, datos };
  if (tabla.startsWith('ANEXO')) {
    payload = {
      accion: 'GUARDAR_ANEXO',
      tipo_anexo: tabla,
      datos: datos
    };
  }
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    // Apps script redirects can sometimes return text/html or fail json parse
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, text };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected, attempting no-cors mode fallback...", error);
    try {
      // Fallback for strict CORS environments
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection (adblocker/antivirus/VPN):", fallbackError);
      // We return success: false, but WE DO NOT THROW so the UI doesn't get blocked
      return { success: false, error: fallbackError };
    }
  }
}

export async function registrarLog(id_caso: string, usuario: string, accion: string) {
  const payloadLog = {
    tabla: 'HISTORIAL_CAMBIOS',
    datos: {
      id_log: `LOG-${Date.now()}`,
      id_caso: id_caso,
      fecha: new Date().toISOString(),
      usuario: usuario,
      accion: accion
    }
  };
  return guardarEnSheets('HISTORIAL_CAMBIOS', payloadLog.datos);
}

export async function crearCarpetaCaso(id_caso: string) {
  const payload = { accion: 'CREAR_CARPETA', id_caso };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, text };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected, attempting no-cors mode fallback...", error);
    try {
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection:", fallbackError);
      return { success: false, error: fallbackError };
    }
  }
}

export async function obtenerExpediente(id_caso: string) {
  const payload = { accion: 'OBTENER_EXPEDIENTE', id_caso };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: 'Error decodificando el expediente' };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected, attempting no-cors mode fallback...", error);
    try {
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: false, error: 'La red bloqueó la conexión y el modo sin CORS no permite leer datos.' };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection:", fallbackError);
      return { success: false, error: fallbackError };
    }
  }
}

export async function subirArchivoEvidencia(id_caso: string, categoria: string, base64: string, mimeType: string, filename: string) {
  const payload = { 
    accion: 'SUBIR_EVIDENCIA', 
    id_caso,
    categoria,
    base64,
    mimeType,
    filename
  };
  
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: 'Error decodificando la subida' };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected...", error);
    try {
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection:", fallbackError);
      return { success: false, error: fallbackError };
    }
  }
}

export async function listarArchivosCaso(id_caso: string) {
  const payload = { accion: 'LISTAR_ARCHIVOS_CASO', id_caso };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: 'Error decodificando la lista de archivos' };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected...", error);
    try {
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: false, error: 'La red bloqueó la conexión y el modo sin CORS no permite leer datos.' };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection:", fallbackError);
      return { success: false, error: fallbackError };
    }
  }
}

// --- INTEGRACIÓN CORE ---

export async function listarCasos() {
  const payload = { accion: 'LISTAR_CASOS' };
  return apiRequest(payload);
}

export async function listarReuniones() {
  const payload = { accion: 'LISTAR_REUNIONES' };
  return apiRequest(payload);
}

export async function actualizarCaso(id_caso: string, updates: any) {
  const payload = { accion: 'ACTUALIZAR_CASO', id_caso, updates };
  return apiRequest(payload);
}

export async function asignarCaso(id_caso: string, rol_destino: string, email_destino: string, notificacion_texto: string) {
  const payload = {
    accion: 'ASIGNAR_CASO',
    id_caso,
    rol_destino,
    email_destino,
    notificacion_texto
  };
  return apiRequest(payload);
}

// NUEVO: Obtener todo el expediente (datos base, anexos, matriz) para Fase 6
export async function obtenerExpedienteCompleto(id_caso: string) {
  const payload = {
    accion: 'OBTENER_EXPEDIENTE',
    id_caso
  };
  return apiRequest(payload);
}

export async function listarNotificaciones(rol: string, email: string) {
  const payload = { accion: 'LISTAR_NOTIFICACIONES', rol, email };
  return apiRequest(payload);
}

export async function crearNotificacion(item: any) {
  const payload = { accion: 'CREAR_NOTIFICACION', item };
  return apiRequest(payload);
}

export async function marcarNotificacionLeida(id: string | number) {
  const payload = { accion: 'MARCAR_NOTIFICACION_LEIDA', id };
  return apiRequest(payload);
}

export async function agendarReunion(item: any) {
  const payload = { accion: 'AGENDAR_REUNION', item };
  return apiRequest(payload);
}

// Helper genérico para peticiones fetch
export async function apiRequest(payload: any) {
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: 'Error decodificando la respuesta', raw: text };
    }
  } catch (error) {
    console.warn("CORS/Fetch error detected...", error);
    try {
      await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { success: false, error: 'La red bloqueó la conexión y el modo sin CORS no permite leer datos.' };
    } catch (fallbackError) {
      console.error("Network forcefully closed the connection:", fallbackError);
      return { success: false, error: fallbackError };
    }
  }
}
