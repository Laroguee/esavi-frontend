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
    // MINSAL
    { email: "local@minsal.gob.sv", pass: "local123", role: "ESAVI_LOCAL", name: "Enlace Local MINSAL", macro: "MINSAL", est: "Hospital Rosales" },
    { email: "institucional@minsal.gob.sv", pass: "inst123", role: "ESAVI_INSTITUCIONAL", name: "Enlace Institucional MINSAL", macro: "MINSAL", est: "Nivel Central MINSAL" },
    
    // ISSS
    { email: "local@isss.gob.sv", pass: "local123", role: "ESAVI_LOCAL", name: "Enlace Local ISSS", macro: "ISSS", est: "Hospital Policlínico" },
    { email: "institucional@isss.gob.sv", pass: "isss123", role: "ESAVI_INSTITUCIONAL", name: "Enlace Institucional ISSS", macro: "ISSS", est: "Nivel Central ISSS" },
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
