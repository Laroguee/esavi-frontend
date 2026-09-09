import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import type { MockUser } from '../store/useAuthStore';

// Secondary app para no desloguear al admin actual
const createSecondaryApp = () => {
  const apps = getApps();
  const secondaryApp = apps.find(app => app.name === 'SecondaryAdminApp');
  if (secondaryApp) return secondaryApp;
  return initializeApp(firebaseConfig, 'SecondaryAdminApp');
};

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
    if (!user.email || !user.password) throw new Error("Email y contraseña obligatorios");
    
    const secondaryApp = createSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);

    // Crear en Firebase Auth
    await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);

    // Guardar perfil extendido en Firestore, PERO NO guardar la contraseña
    const userToSave = { ...user };
    delete userToSave.password; // Por seguridad

    await setDoc(doc(db, 'usuarios', user.email), userToSave);
    
    // Cerramos la sesión secundaria preventivamente para que no estorbe
    await secondaryAuth.signOut();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editarUsuario(emailOriginal: string, updates: Partial<MockUser>) {
  try {
    const docRef = doc(db, 'usuarios', emailOriginal);
    const updatesToSave = { ...updates };
    
    // En Firebase Auth puro desde frontend no podemos cambiar el password de OTRO usuario.
    // Solo podemos actualizar su perfil de Firestore.
    if (updatesToSave.password) {
      delete updatesToSave.password; 
    }
    
    await updateDoc(docRef, updatesToSave);
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
