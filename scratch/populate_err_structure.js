import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import crypto from "crypto";

const firebaseConfig = {
  apiKey: "AIzaSyCwWboZLQogyuUuiYTcJUEsDi2rMPMq-IE",
  authDomain: "esavi-sv-backend.firebaseapp.com",
  projectId: "esavi-sv-backend",
  storageBucket: "esavi-sv-backend.firebasestorage.app",
  messagingSenderId: "939471115863",
  appId: "1:939471115863:web:20ead13a564f02b136f512"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function run() {
  console.log("Limpiando establecimientos antiguos (ERR MINSAL/ISSS)...");
  try {
    const snap = await getDocs(collection(db, "establecimientos"));
    for (const d of snap.docs) {
      if (d.data().nombre.includes("ERR ")) {
        await deleteDoc(d.ref);
        console.log("Eliminado:", d.data().nombre);
      }
    }
  } catch(e) { console.error("Error limpiando:", e); }

  console.log("Creando instituciones físicas...");
  const establecimientos = [
    { id: 1, nombre: "Nivel Central MINSAL", tipo: "Nivel Central", sibasi: "N/A", institucionMacro: "MINSAL", activo: true },
    { id: 10, nombre: "Hospital Nacional Rosales", tipo: "Hospital Nacional", sibasi: "Centro", institucionMacro: "MINSAL", activo: true },
    { id: 11, nombre: "Unidad de Salud San Jacinto", tipo: "Unidad de Salud", sibasi: "Centro", institucionMacro: "MINSAL", activo: true },
    
    { id: 3, nombre: "Nivel Central ISSS", tipo: "Nivel Central", sibasi: "N/A", institucionMacro: "ISSS", activo: true },
    { id: 30, nombre: "Hospital Médico Quirúrgico ISSS", tipo: "Hospital Especializado", sibasi: "N/A", institucionMacro: "ISSS", activo: true },
    { id: 31, nombre: "Clínica Comunitaria ISSS Santa Tecla", tipo: "Clínica", sibasi: "N/A", institucionMacro: "ISSS", activo: true }
  ];

  for (const est of establecimientos) {
    await setDoc(doc(db, "establecimientos", String(est.id)), est);
    console.log("Creado Establecimiento:", est.nombre);
  }

  console.log("Creando personal ERR local...");
  const users = [
    // MINSAL - Hospital Rosales
    { email: "err_clinico_rosales@minsal.gob.sv", pass: "err123", role: "ERR_ESAVI", name: "Clínico ERR Rosales", macro: "MINSAL", est: "Hospital Nacional Rosales" },
    { email: "err_inmuno_rosales@minsal.gob.sv", pass: "err123", role: "ERR_INMUNO", name: "Inmuno ERR Rosales", macro: "MINSAL", est: "Hospital Nacional Rosales" },
    { email: "err_epidemio_rosales@minsal.gob.sv", pass: "err123", role: "ERR_EPIDEMIO", name: "Epidemiólogo ERR Rosales", macro: "MINSAL", est: "Hospital Nacional Rosales" },

    // MINSAL - US San Jacinto
    { email: "err_clinico_sanjacinto@minsal.gob.sv", pass: "err123", role: "ERR_ESAVI", name: "Clínico ERR San Jacinto", macro: "MINSAL", est: "Unidad de Salud San Jacinto" },
    { email: "err_inmuno_sanjacinto@minsal.gob.sv", pass: "err123", role: "ERR_INMUNO", name: "Inmuno ERR San Jacinto", macro: "MINSAL", est: "Unidad de Salud San Jacinto" },
    { email: "err_epidemio_sanjacinto@minsal.gob.sv", pass: "err123", role: "ERR_EPIDEMIO", name: "Epidemiólogo ERR San Jacinto", macro: "MINSAL", est: "Unidad de Salud San Jacinto" },

    // ISSS - Médico Quirúrgico
    { email: "err_clinico_hmq@isss.gob.sv", pass: "err123", role: "ERR_ESAVI", name: "Clínico ERR HMQ", macro: "ISSS", est: "Hospital Médico Quirúrgico ISSS" },
    { email: "err_inmuno_hmq@isss.gob.sv", pass: "err123", role: "ERR_INMUNO", name: "Inmuno ERR HMQ", macro: "ISSS", est: "Hospital Médico Quirúrgico ISSS" },
    { email: "err_epidemio_hmq@isss.gob.sv", pass: "err123", role: "ERR_EPIDEMIO", name: "Epidemiólogo ERR HMQ", macro: "ISSS", est: "Hospital Médico Quirúrgico ISSS" },

    // ISSS - Clínica Santa Tecla
    { email: "err_clinico_st@isss.gob.sv", pass: "err123", role: "ERR_ESAVI", name: "Clínico ERR Santa Tecla", macro: "ISSS", est: "Clínica Comunitaria ISSS Santa Tecla" },
    { email: "err_inmuno_st@isss.gob.sv", pass: "err123", role: "ERR_INMUNO", name: "Inmuno ERR Santa Tecla", macro: "ISSS", est: "Clínica Comunitaria ISSS Santa Tecla" },
    { email: "err_epidemio_st@isss.gob.sv", pass: "err123", role: "ERR_EPIDEMIO", name: "Epidemiólogo ERR Santa Tecla", macro: "ISSS", est: "Clínica Comunitaria ISSS Santa Tecla" }
  ];

  for (const u of users) {
    const hashed = await hashPassword(u.pass);
    await setDoc(doc(db, "usuarios", u.email), {
      email: u.email,
      password: hashed,
      role: u.role,
      name: u.name,
      institucionMacro: u.macro,
      establecimiento: u.est,
      activo: true
    });
    console.log("Creado/Actualizado Usuario:", u.email);
  }
  
  console.log("¡Migración Completada!");
  process.exit(0);
}

run().catch(console.error);
