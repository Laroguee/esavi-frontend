import { hashPassword } from './authService';
import type { MockUser } from '../store/useAuthStore';

export async function listarUsuarios() {
  const payload = { accion: 'LISTAR_USUARIOS' };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error listarUsuarios:", error);
    return { success: false, error: "Error de conexión" };
  }
}

export async function crearUsuario(user: Partial<MockUser>) {
  // Hasheamos la contraseña antes de enviarla
  if (user.password) {
    user.password = await hashPassword(user.password);
  }
  
  const payload = { 
    accion: 'CREAR_USUARIO',
    user
  };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error crearUsuario:", error);
    return { success: false, error: "Error de conexión" };
  }
}

export async function editarUsuario(emailOriginal: string, updates: Partial<MockUser>) {
  // Si están cambiando la contraseña desde el panel de admin, encriptarla
  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }
  
  const payload = { 
    accion: 'EDITAR_USUARIO',
    email_original: emailOriginal,
    user: updates
  };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error editarUsuario:", error);
    return { success: false, error: "Error de conexión" };
  }
}

// ==========================================
// CATÁLOGO DE ESTABLECIMIENTOS
// ==========================================

export async function listarEstablecimientos() {
  const payload = { accion: 'LISTAR_ESTABLECIMIENTOS' };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error listarEstablecimientos:", error);
    return { success: false, error: "Error de conexión" };
  }
}

export async function crearEstablecimiento(item: any) {
  const payload = { accion: 'CREAR_ESTABLECIMIENTO', item };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error crearEstablecimiento:", error);
    return { success: false, error: "Error de conexión" };
  }
}

export async function editarEstablecimiento(id: number, item: any) {
  const payload = { accion: 'EDITAR_ESTABLECIMIENTO', id, item };
  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error("Error editarEstablecimiento:", error);
    return { success: false, error: "Error de conexión" };
  }
}

