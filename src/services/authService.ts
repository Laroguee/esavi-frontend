import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(email: string, passwordPlain: string) {
  try {
    // 1. Autenticar con Firebase Auth
    await signInWithEmailAndPassword(auth, email, passwordPlain);

    // 2. Obtener el perfil extendido desde Firestore
    const docRef = doc(db, 'usuarios', email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const user = docSnap.data();
      
      if (user.activo === false || String(user.activo).toLowerCase() === 'false') {
        return { success: false, error: "Usuario inactivo" };
      }
      return { success: true, user };
    } else {
      return { success: false, error: "Perfil de usuario no encontrado en la base de datos" };
    }
  } catch (error: any) {
    let errorMessage = error.message;
    if (error.code === 'auth/invalid-credential') errorMessage = 'Credenciales incorrectas';
    if (error.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado';
    if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
    return { success: false, error: errorMessage };
  }
}
