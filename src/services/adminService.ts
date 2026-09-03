import { collection, doc, setDoc, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { hashPassword } from './authService';
import type { MockUser } from '../store/useAuthStore';

export async function listarUsuarios() {
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    const usuarios = querySnapshot.docs.map(doc => doc.data());
    return { success: true, data: usuarios };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function crearUsuario(user: Partial<MockUser>) {
  try {
    if (user.password) {
      user.password = await hashPassword(user.password);
    }
    // Usamos el email como ID del documento para que sea único
    await setDoc(doc(db, 'usuarios', user.email as string), user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editarUsuario(emailOriginal: string, updates: Partial<MockUser>) {
  try {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    const docRef = doc(db, 'usuarios', emailOriginal);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// CATÁLOGO DE ESTABLECIMIENTOS
// ==========================================

export async function listarEstablecimientos() {
  try {
    const querySnapshot = await getDocs(collection(db, 'establecimientos'));
    const establecimientos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: establecimientos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function crearEstablecimiento(item: any) {
  try {
    // Generar un ID numérico o usar el de firebase
    const docId = Date.now().toString();
    item.id = Number(docId);
    await setDoc(doc(db, 'establecimientos', docId), item);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editarEstablecimiento(id: number, item: any) {
  try {
    const docRef = doc(db, 'establecimientos', String(id));
    await updateDoc(docRef, item);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
