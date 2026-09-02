import { hashPassword } from './authService';
import type { MockUser } from '../store/useAuthStore';
import { apiRequest } from './googleSheetsService';

export async function listarUsuarios() {
  const payload = { accion: 'LISTAR_USUARIOS' };
  return apiRequest(payload);
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
  return apiRequest(payload);
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
  return apiRequest(payload);
}

// ==========================================
// CATÁLOGO DE ESTABLECIMIENTOS
// ==========================================

export async function listarEstablecimientos() {
  const payload = { accion: 'LISTAR_ESTABLECIMIENTOS' };
  return apiRequest(payload);
}

export async function crearEstablecimiento(item: any) {
  const payload = { accion: 'CREAR_ESTABLECIMIENTO', item };
  return apiRequest(payload);
}

export async function editarEstablecimiento(id: number, item: any) {
  const payload = { accion: 'EDITAR_ESTABLECIMIENTO', id, item };
  return apiRequest(payload);
}

