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
  const adminEmail = "admin@srs.gob.sv";
  const pass = await hashPassword("admin123");
  
  const adminUser = {
    email: adminEmail,
    password: pass,
    role: "SECRETARIADO",
    name: "Administrador Sistema",
    institucionMacro: "SRS",
    establecimiento: "Nivel Central",
    activo: true
  };

  await setDoc(doc(db, "usuarios", adminEmail), adminUser);
  console.log("Admin user created:", adminEmail);
  
  // Create an ERR user as well
  const errEmail = "experto@srs.gob.sv";
  const pass2 = await hashPassword("err123");
  await setDoc(doc(db, "usuarios", errEmail), {
    email: errEmail,
    password: pass2,
    role: "ERR",
    name: "Experto ERR",
    institucionMacro: "SRS",
    establecimiento: "Nivel Central",
    activo: true
  });
  console.log("ERR user created:", errEmail);
  
  // Create a local user
  const localEmail = "local@minsal.gob.sv";
  const pass3 = await hashPassword("local123");
  await setDoc(doc(db, "usuarios", localEmail), {
    email: localEmail,
    password: pass3,
    role: "ESAVI_LOCAL",
    name: "Enlace Local MINSAL",
    institucionMacro: "MINSAL",
    establecimiento: "Hospital Rosales",
    activo: true
  });
  console.log("Local user created:", localEmail);
  
  process.exit(0);
}

run().catch(console.error);
