import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import type { MockUser } from '../store/useAuthStore';
import { useAuthStore } from '../store/useAuthStore';

// Guardia de seguridad: evita ejecución no autorizada si se invoca desde la consola del navegador
function assertAdminRole() {
  const role = useAuthStore.getState().currentRole;
  if (role !== 'SECRETARIADO') {
    throw new Error('Operación no autorizada: requiere privilegios de SECRETARIADO.');
  }
}

// Secondary app para no desloguear al admin actual
const createSecondaryApp = () => {
  const apps = getApps();
  const secondaryApp = apps.find(app => app.name === 'SecondaryAdminApp');
  if (secondaryApp) return secondaryApp;
  return initializeApp(firebaseConfig, 'SecondaryAdminApp');
};

export async function listarUsuarios() {
  try {
    assertAdminRole();
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    const usuarios = querySnapshot.docs.map(doc => doc.data());
    return { success: true, data: usuarios };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function crearUsuario(user: Partial<MockUser>) {
  try {
    assertAdminRole();
    if (!user.email || !user.password) throw new Error("Email y contraseña obligatorios");
    
    const secondaryApp = createSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);

    const emailClean = user.email.trim().toLowerCase();
    const passwordClean = user.password.trim();

    // Crear en Firebase Auth
    await createUserWithEmailAndPassword(secondaryAuth, emailClean, passwordClean);

    // Guardar perfil extendido en Firestore, PERO NO guardar la contraseña
    const userToSave = { ...user, email: emailClean };
    delete userToSave.password; // Por seguridad

    await setDoc(doc(db, 'usuarios', emailClean), userToSave);
    
    // Cerramos la sesión secundaria preventivamente para que no estorbe
    await secondaryAuth.signOut();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function editarUsuario(emailOriginal: string, updates: Partial<MockUser>) {
  try {
    assertAdminRole();
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
    assertAdminRole();
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
    assertAdminRole();
    const docRef = doc(db, 'establecimientos', String(id));
    await updateDoc(docRef, item);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
