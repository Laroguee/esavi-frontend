import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc, deleteDoc } from 'firebase/firestore';
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
    const id_log = `LOG-${Date.now()}`;
    const docId = `${id_caso}_${id_log}`;
    await setDoc(doc(db, 'historial_cambios', docId), {
      id_log,
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

export async function guardarAuditoriaFase5(id_caso: string, usuario: string, estado_final: string, evaluaciones: Record<string, any>) {
  try {
    await addDoc(collection(db, 'AUDITORIAS_CALIDAD'), {
      id_auditoria: `QA-${Date.now()}`,
      id_caso,
      fecha_auditoria: new Date().toISOString(),
      auditor: usuario,
      estado_final,
      evaluaciones_anexos: evaluaciones
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando auditoria de Fase 5:", error);
    return { success: false, error: error.message };
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
      matriz = typeof mData.datos_formulario_json === 'string' ? JSON.parse(mData.datos_formulario_json) : (mData.datos_formulario_json || mData);
    } else {
      // Fallback para registros antiguos guardados con ID autogenerado
      const qMatriz = query(collection(db, 'MATRIZ_RIESGO'), where('id_caso', '==', id_caso));
      const qMatrizSnap = await getDocs(qMatriz);
      if (!qMatrizSnap.empty) {
        const mData = qMatrizSnap.docs[0].data();
        matriz = typeof mData.datos_formulario_json === 'string' ? JSON.parse(mData.datos_formulario_json) : (mData.datos_formulario_json || mData);
      }
    }

    // 2. Asignación ERR
    let asigSnap = await getDoc(doc(db, 'ASIGNACIONES_ERR', id_caso));
    let asignaciones = null;
    if (asigSnap.exists()) {
      const aData = asigSnap.data();
      asignaciones = typeof aData.datos_formulario_json === 'string' ? JSON.parse(aData.datos_formulario_json) : (aData.datos_formulario_json || aData);
    } else {
      // Fallback para registros antiguos guardados con ID autogenerado
      const qAsig = query(collection(db, 'ASIGNACIONES_ERR'), where('id_caso', '==', id_caso));
      const qAsigSnap = await getDocs(qAsig);
      if (!qAsigSnap.empty) {
        const aData = qAsigSnap.docs[0].data();
        asignaciones = typeof aData.datos_formulario_json === 'string' ? JSON.parse(aData.datos_formulario_json) : (aData.datos_formulario_json || aData);
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
        if (typeof data.datos_formulario_json === 'string') {
          try {
            data.datos_formulario_json = JSON.parse(data.datos_formulario_json);
          } catch (e) {
            // keep as is
          }
        }
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

export async function subirArchivoEvidencia(id_caso: string, categoria: string, base64: string, mimeType: string, filename: string, usuario: string = 'Desconocido') {
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
      fecha_subida: new Date().toISOString(),
      uploadedBy: usuario
    };
    
    anexos.push(nuevoArchivo);
    await updateDoc(casoRef, { archivosAdjuntos: anexos });
    
    return { success: true, data: { url: fileUrl, file_id: data.public_id } };
  } catch (error: any) {
    console.error("Error subiendo a Cloudinary:", error);
    return { success: false, error: error.message };
  }
}

export async function borrarArchivoEvidencia(id_caso: string, fileUrl: string, usuario: string, fileName: string) {
  try {
    const casoRef = doc(db, 'casos', id_caso);
    const casoSnap = await getDoc(casoRef);
    if (!casoSnap.exists()) return { success: false, error: 'Caso no encontrado' };

    let anexos: any[] = casoSnap.data().archivosAdjuntos || [];
    const anexoToDelete = anexos.find(a => a.url === fileUrl);
    
    anexos = anexos.filter(a => a.url !== fileUrl);
    await updateDoc(casoRef, { archivosAdjuntos: anexos });
    
    await registrarLog(id_caso, usuario, `Eliminó el archivo "${fileName || (anexoToDelete ? anexoToDelete.name : '')}" del Gestor de Evidencias.`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error borrando archivo:", error);
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
        size: file.size,
        uploadedBy: file.uploadedBy || 'Desconocido'
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

export async function eliminarCaso(idCaso: string) {
  try {
    // 1. Eliminar caso principal
    await deleteDoc(doc(db, 'casos', idCaso));
    await deleteDoc(doc(db, 'EXPEDIENTES', idCaso));

    // 2. Eliminar documentos relacionados (anexos, matrices)
    const tabls = ['ANEXO_II', 'ANEXO_III', 'ANEXO_VACUNACION', 'ANEXO_CAMPO', 'ANEXO_CLINICO', 'ANEXO_FARMACO', 'ANEXO_LABORATORIO', 'ANEXO_ESQUEMA', 'MATRIZ_RIESGO', 'ASIGNACIONES_ERR'];
    for (const tb of tabls) {
      await deleteDoc(doc(db, tb, idCaso));
    }

    // 3. Eliminar historiales, reuniones y notificaciones huérfanas
    const coleccionesLimpiar = ['historial_cambios', 'notificaciones', 'reuniones'];
    for (const col of coleccionesLimpiar) {
      const q = query(collection(db, col), where('id_caso', '==', idCaso));
      const snaps = await getDocs(q);
      snaps.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
    }

    return { success: true };
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
    const notifId = `NOTIF-${Date.now()}`;
    const docId = item.id_caso ? `${item.id_caso}_${notifId}` : notifId;
    await setDoc(doc(db, 'notificaciones', docId), item);
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
    const reuId = item.id || `REU-${Date.now()}`;
    const docId = item.id_caso ? `${item.id_caso}_${reuId}` : reuId;
    await setDoc(doc(db, 'reuniones', docId), { ...item, id: reuId });
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

export async function verificarDuplicado(pacienteDUI: string, nombrePaciente: string, nombreVacuna: string, fechaAplicacion: string, nombreNotificador: string) {
  try {
    const casosRef = collection(db, 'casos');
    
    // As in Firebase we cannot do complex OR/AND queries easily on multiple full-text fields without compound indexes,
    // we fetch all active cases (not closed) and filter in memory, since this is a relatively small dataset per year.
    const querySnapshot = await getDocs(casosRef);
    const duplicados = querySnapshot.docs.filter(doc => {
      let data = doc.data();
      // Only check active cases
      if (data.estado_flujo === 'CERRADO' || data.estado_flujo === 'CERRADO_DICTAMINADO') return false;
      
      // Retrocompatibilidad: Extraer de datos_fase1_json si las columnas nativas no existen en un caso antiguo
      if (!data.nombre_paciente && data.datos_fase1_json) {
        try {
          const jsonParsed = JSON.parse(data.datos_fase1_json);
          data = {
            ...data,
            nombre_paciente: jsonParsed.nombrePaciente || '',
            nombre_vacuna: jsonParsed.nombreVacuna || '',
            fecha_vacunacion: jsonParsed.fechaAdministracion || '',
            nombre_notificador: jsonParsed.nombreNotificador || '',
            paciente_dui: jsonParsed.pacienteDUI || ''
          };
        } catch (e) {
          // Silencioso en caso de error de parseo
        }
      }

      // El DUI se evalúa contra la columna correcta (paciente_dui). Si no se ingresó, no rompe la cadena pero exige que los otros 4 coincidan.
      const matchDUI = pacienteDUI ? data.paciente_dui?.trim() === pacienteDUI.trim() : true; 
      
      // Se utiliza trim() y toLowerCase() para evitar que espacios invisibles pasen la validación
      const matchPaciente = nombrePaciente && data.nombre_paciente?.trim().toLowerCase() === nombrePaciente.trim().toLowerCase();
      const matchVacuna = nombreVacuna && data.nombre_vacuna?.trim().toLowerCase() === nombreVacuna.trim().toLowerCase();
      const matchFecha = fechaAplicacion && data.fecha_vacunacion?.trim() === fechaAplicacion.trim();
      const matchNotificador = nombreNotificador && data.nombre_notificador?.trim().toLowerCase() === nombreNotificador.trim().toLowerCase();

      // Criterio de duplicidad estricto (5 variables)
      const isDuplicado = matchDUI && matchPaciente && matchVacuna && matchFecha && matchNotificador;
      return isDuplicado;
    });

    if (duplicados.length > 0) {
      return { success: true, isDuplicado: true, id_caso: duplicados[0].id };
    }

    return { success: true, isDuplicado: false };
  } catch (error: any) {
    console.error("Error verificando duplicado:", error);
    return { success: false, error: error.message };
  }
}
