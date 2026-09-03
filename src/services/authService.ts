import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(email: string, passwordPlain: string) {
  try {
    const docRef = doc(db, 'usuarios', email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const user = docSnap.data();
      const hashedInput = await hashPassword(passwordPlain);
      
      // Permitimos iniciar si coinciden los hashes o si la contraseña es la original (para transiciones)
      if (user.password === hashedInput || user.password === passwordPlain) {
        if (user.activo === false || String(user.activo).toLowerCase() === 'false') {
          return { success: false, error: "Usuario inactivo" };
        }
        return { success: true, user };
      } else {
        return { success: false, error: "Credenciales incorrectas" };
      }
    } else {
      return { success: false, error: "Usuario no encontrado" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
