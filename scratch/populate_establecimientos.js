import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
  const establecimientos = [
    { id: 1, nombre: "Nivel Central MINSAL", tipo: "Nivel Central", sibasi: "N/A", institucionMacro: "MINSAL", activo: true },
    { id: 2, nombre: "ERR MINSAL", tipo: "Unidad", sibasi: "N/A", institucionMacro: "MINSAL", activo: true },
    { id: 3, nombre: "Nivel Central ISSS", tipo: "Nivel Central", sibasi: "N/A", institucionMacro: "ISSS", activo: true },
    { id: 4, nombre: "ERR ISSS", tipo: "Unidad", sibasi: "N/A", institucionMacro: "ISSS", activo: true }
  ];

  for (const est of establecimientos) {
    await setDoc(doc(db, "establecimientos", String(est.id)), est);
    console.log("Created Establecimiento:", est.nombre);
  }

  const users = [
    // MINSAL - Faltaba ESAVI (Farmacovigilancia Clínico)
    { email: "esavi_inst@minsal.gob.sv", pass: "esavi123", role: "ESAVI_INSTITUCIONAL", name: "Esavi Institucional MINSAL", macro: "MINSAL", est: "Nivel Central MINSAL" },
    // ISSS - Faltaba ESAVI (Farmacovigilancia Clínico)
    { email: "esavi_inst@isss.gob.sv", pass: "esavi123", role: "ESAVI_INSTITUCIONAL", name: "Esavi Institucional ISSS", macro: "ISSS", est: "Nivel Central ISSS" }
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
    console.log("Created/Updated User:", u.email);
  }
  
  process.exit(0);
}

run().catch(console.error);
