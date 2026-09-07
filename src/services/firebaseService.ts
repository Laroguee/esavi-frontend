import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, listAll } from 'firebase/storage';
import { db } from '../config/firebase';

export async function guardarEnSheets(tabla: string, datos: any) {
  // En Firestore, "tabla" será el nombre de la colección
  try {
    let collectionName = tabla;
    let docRef;

    if (tabla === 'EXPEDIENTES' && datos.id_caso) {
      docRef = doc(db, 'casos', datos.id_caso);
      await setDoc(docRef, datos, { merge: true });
    } else if ((tabla.startsWith('ANEXO') || tabla === 'MATRIZ_RIESGO' || tabla === 'ASIGNACIONES_ERR') && datos.id_caso) {
      // Guardar anexos, matriz y asignaciones como documentos separados con el ID del caso
      docRef = doc(db, tabla, datos.id_caso);
      await setDoc(docRef, datos, { merge: true });
    } else {
      await addDoc(collection(db, collectionName), datos);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando en Firestore:", error);
    return { success: false, error: error.message };
  }
}

export async function registrarLog(id_caso: string, usuario: string, accion: string) {
  try {
    await addDoc(collection(db, 'historial_cambios'), {
      id_log: `LOG-${Date.now()}`,
      id_caso,
      fecha: new Date().toISOString(),
      usuario,
      accion
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function crearCarpetaCaso(id_caso: string) {
  // Con Cloudinary no es necesario crear carpetas vacías previas
  return { success: true, data: { carpeta_principal: id_caso } };
}

export async function obtenerExpediente(id_caso: string) {
  try {
    const docSnap = await getDoc(doc(db, 'casos', id_caso));
    if (!docSnap.exists()) {
      return { success: false, error: 'Caso no encontrado' };
    }

    const casoData = docSnap.data();

    // 1. Matriz de Riesgo (MATRIZ_RIESGO)
    let matrizSnap = await getDoc(doc(db, 'MATRIZ_RIESGO', id_caso));
    let matriz = null;
    if (matrizSnap.exists()) {
      const mData = matrizSnap.data();
      matriz = mData.datos_formulario_json || mData;
    } else {
      // Fallback para registros antiguos guardados con ID autogenerado
      const qMatriz = query(collection(db, 'MATRIZ_RIESGO'), where('id_caso', '==', id_caso));
      const qMatrizSnap = await getDocs(qMatriz);
      if (!qMatrizSnap.empty) {
        const mData = qMatrizSnap.docs[0].data();
        matriz = mData.datos_formulario_json || mData;
      }
    }

    // 2. Asignación ERR
    let asigSnap = await getDoc(doc(db, 'ASIGNACIONES_ERR', id_caso));
    let asignaciones = null;
    if (asigSnap.exists()) {
      const aData = asigSnap.data();
      asignaciones = aData.datos_formulario_json ? aData.datos_formulario_json : aData;
    } else {
      // Fallback para registros antiguos guardados con ID autogenerado
      const qAsig = query(collection(db, 'ASIGNACIONES_ERR'), where('id_caso', '==', id_caso));
      const qAsigSnap = await getDocs(qAsig);
      if (!qAsigSnap.empty) {
        const aData = qAsigSnap.docs[0].data();
        asignaciones = aData.datos_formulario_json ? aData.datos_formulario_json : aData;
      }
    }

    // 3. Anexos
    const anexos = [];
    const anexoCollections = [
      { name: 'ANEXO_III', title: 'Anexo III - Logística' },
      { name: 'ANEXO_VACUNACION', title: 'Anexo V - Puesto de Vacunación' },
      { name: 'ANEXO_CAMPO', title: 'Anexo VI - Domicilio y Comunidad' },
      { name: 'ANEXO_CLINICO', title: 'Anexo VII - Clínico' },
      { name: 'ANEXO_FARMACO', title: 'Anexo VIII - Farmaco' },
      { name: 'ANEXO_LABORATORIO', title: 'Anexo IX - Laboratorio' },
      { name: 'ANEXO_ESQUEMA', title: 'Anexo X - Esquema' }
    ];

    for (const col of anexoCollections) {
      const snap = await getDoc(doc(db, col.name, id_caso));
      if (snap.exists()) {
        const data = snap.data();
        anexos.push({
          tipo_anexo: col.title,
          ...data
        });
      }
    }

    return { 
      success: true, 
      data: {
        expediente: casoData,
        matriz: matriz,
        asignaciones: asignaciones,
        anexos: anexos
      } 
    };
  } catch (error: any) {
    console.error('Error fetching expediente:', error);
    return { success: false, error: error.message };
  }
}

export async function subirArchivoEvidencia(id_caso: string, categoria: string, base64: string, mimeType: string, filename: string) {
  try {
    const url = `https://api.cloudinary.com/v1_1/dowejnpvd/auto/upload`;
    
    // Cloudinary expects file as a data URI
    const dataUri = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
    
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', 'esavi_docs');
    // Generar un ID público limpio (evitando espacios o caracteres raros de filename si es posible)
    const publicIdStr = `${id_caso}/${categoria}/${filename.split('.')[0]}_${Date.now()}`.replace(/\s+/g, '_');
    formData.append('public_id', publicIdStr);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Error en Cloudinary' };
    }
    
    const fileUrl = data.secure_url;
    const fileSize = data.bytes;
    
    // Registrar el archivo en el documento de Firestore
    const casoRef = doc(db, 'casos', id_caso);
    const casoSnap = await getDoc(casoRef);
    let anexos: any[] = [];
    
    if (casoSnap.exists() && casoSnap.data().archivosAdjuntos) {
      anexos = casoSnap.data().archivosAdjuntos;
    }
    
    const nuevoArchivo = {
      name: filename,
      url: fileUrl,
      mimeType: mimeType,
      size: fileSize || 0,
      categoria: categoria,
      fecha_subida: new Date().toISOString()
    };
    
    anexos.push(nuevoArchivo);
    await updateDoc(casoRef, { archivosAdjuntos: anexos });
    
    return { success: true, data: { url: fileUrl, file_id: data.public_id } };
  } catch (error: any) {
    console.error("Error subiendo a Cloudinary:", error);
    return { success: false, error: error.message };
  }
}

export async function listarArchivosCaso(id_caso: string) {
  try {
    const casoSnap = await getDoc(doc(db, 'casos', id_caso));
    if (!casoSnap.exists()) return { success: false, error: 'Caso no encontrado' };
    
    const data = casoSnap.data();
    const archivos = data.archivosAdjuntos || [];
    
    // Agrupar por categoría
    const carpetasMap: Record<string, any[]> = {};
    
    for (const file of archivos) {
      const cat = file.categoria || 'General';
      if (!carpetasMap[cat]) carpetasMap[cat] = [];
      carpetasMap[cat].push({
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size
      });
    }
    
    const estructura = Object.keys(carpetasMap).map(cat => ({
      carpeta: cat,
      archivos: carpetasMap[cat]
    }));
    
    return { success: true, data: estructura };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listarCasos() {
  try {
    const querySnapshot = await getDocs(collection(db, 'casos'));
    const casos = querySnapshot.docs.map(doc => doc.data());
    return { success: true, data: casos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listarReuniones() {
  try {
    const querySnapshot = await getDocs(collection(db, 'reuniones'));
    const reuniones = querySnapshot.docs.map(doc => doc.data());
    return { success: true, data: reuniones };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function actualizarCaso(id_caso: string, updates: any) {
  try {
    const docRef = doc(db, 'casos', id_caso);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function asignarCaso(id_caso: string, rol_destino: string, email_destino: string, notificacion_texto: string) {
  try {
    await addDoc(collection(db, 'asignaciones'), {
      id_caso, rol_destino, email_destino, notificacion_texto, fecha: new Date().toISOString()
    });
    // También creamos una notificación
    await crearNotificacion({ id_caso, rol_destino, texto: notificacion_texto, leido: false, fecha: new Date().toISOString() });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function obtenerExpedienteCompleto(id_caso: string) {
  try {
    const casoSnap = await getDoc(doc(db, 'casos', id_caso));
    if (!casoSnap.exists()) return { success: false, error: 'Caso no encontrado' };
    
    // Obtener anexos (simulado que guardamos en colecciones paralelas)
    const anexo2 = await getDoc(doc(db, 'ANEXO_II', id_caso));
    const anexo3 = await getDoc(doc(db, 'ANEXO_III', id_caso));
    
    return { 
      success: true, 
      data: { 
        base: casoSnap.data(), 
        anexos: {
          ANEXO_II: anexo2.exists() ? anexo2.data() : null,
          ANEXO_III: anexo3.exists() ? anexo3.data() : null,
        }
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listarNotificaciones(rol: string, _email: string) {
  try {
    // Para simplificar, obtenemos todas y luego filtramos, o hacemos query si el índice lo permite
    const q = query(collection(db, 'notificaciones'), where('rol_destino', '==', rol));
    const querySnapshot = await getDocs(q);
    const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: notifs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function crearNotificacion(item: any) {
  try {
    item.fecha = new Date().toISOString();
    item.leido = false;
    await addDoc(collection(db, 'notificaciones'), item);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function marcarNotificacionLeida(id: string | number) {
  try {
    const docRef = doc(db, 'notificaciones', String(id));
    await updateDoc(docRef, { leido: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function agendarReunion(item: any) {
  try {
    const docId = item.id || `REU-${Date.now()}`;
    await setDoc(doc(db, 'reuniones', docId), { ...item, id: docId });
    return { success: true, id: docId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listarHistoriales() {
  try {
    const querySnapshot = await getDocs(collection(db, 'historial_cambios'));
    const historiales = querySnapshot.docs.map(doc => doc.data());
    return { success: true, data: historiales };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper stub para apiRequest si algo todavía lo usa directamente
export async function apiRequest(payload: any) {
  console.warn("apiRequest llamado en Firebase Service. Revisa quién lo usa:", payload);
  return { success: false, error: "Migrado a Firebase" };
}
