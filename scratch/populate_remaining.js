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
  const users = [
    // Autoridades Nacionales (SRS)
    { email: "secretariado@srs.gob.sv", pass: "admin123", role: "SECRETARIADO", name: "Secretariado Ejecutivo", macro: "SRS", est: "Nivel Central SRS" },
    { email: "err@srs.gob.sv", pass: "err123", role: "ERR", name: "Equipo de Respuesta Rápida (ERR)", macro: "SRS", est: "Nivel Central SRS" },
    { email: "comite@srs.gob.sv", pass: "comite123", role: "COMITE_EXTERNO", name: "Comité Asesor de Prácticas de Inmunización", macro: "CAPI", est: "Externo" },
    
    // Perfiles Específicos Locales (por si se requieren en formularios específicos)
    { email: "inmuno@minsal.gob.sv", pass: "inmuno123", role: "INMUNO_LOCAL", name: "Inmunizaciones Local", macro: "MINSAL", est: "Hospital Rosales" },
    { email: "epidemio@minsal.gob.sv", pass: "epidemio123", role: "EPIDEMIO_LOCAL", name: "Epidemiología Local", macro: "MINSAL", est: "Hospital Rosales" }
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
    console.log("Created/Updated:", u.email);
  }
  
  process.exit(0);
}

run().catch(console.error);
