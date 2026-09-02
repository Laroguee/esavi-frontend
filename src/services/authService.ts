export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

import { apiRequest } from './googleSheetsService';

export async function login(email: string, passwordPlain: string) {
  // NOTA: Para propósitos de testing y porque las contraseñas en Google Sheets
  // están en texto plano actualmente, enviamos la contraseña original. 
  // (Idealmente deberían hashearse también en la base de datos).
  
  const payload = {
    accion: 'LOGIN',
    email,
    password: passwordPlain
  };

  return apiRequest(payload);
}
