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
    // MINSAL - Equipo Coordinador
    { email: "inmuno_inst@minsal.gob.sv", pass: "inmuno123", role: "INMUNO_INSTITUCIONAL", name: "Inmuno Institucional MINSAL", macro: "MINSAL", est: "Nivel Central MINSAL" },
    { email: "epidemio_inst@minsal.gob.sv", pass: "epidemio123", role: "EPIDEMIO_INSTITUCIONAL", name: "Epidemio Institucional MINSAL", macro: "MINSAL", est: "Nivel Central MINSAL" },
    // MINSAL - Miembros ERR
    { email: "err1@minsal.gob.sv", pass: "err123", role: "ERR", name: "Investigador ERR MINSAL 1", macro: "MINSAL", est: "ERR MINSAL" },
    
    // ISSS - Equipo Coordinador
    { email: "inmuno_inst@isss.gob.sv", pass: "inmuno123", role: "INMUNO_INSTITUCIONAL", name: "Inmuno Institucional ISSS", macro: "ISSS", est: "Nivel Central ISSS" },
    { email: "epidemio_inst@isss.gob.sv", pass: "epidemio123", role: "EPIDEMIO_INSTITUCIONAL", name: "Epidemio Institucional ISSS", macro: "ISSS", est: "Nivel Central ISSS" },
    // ISSS - Miembros ERR
    { email: "err1@isss.gob.sv", pass: "err123", role: "ERR", name: "Investigador ERR ISSS 1", macro: "ISSS", est: "ERR ISSS" }
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
