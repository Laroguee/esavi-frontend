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
  const institucionEmail = "institucional@isss.gob.sv";
  const pass = await hashPassword("isss123");
  
  await setDoc(doc(db, "usuarios", institucionEmail), {
    email: institucionEmail,
    password: pass,
    role: "ESAVI_INSTITUCIONAL",
    name: "Enlace Institucional ISSS",
    institucionMacro: "ISSS",
    establecimiento: "Oficina Central ISSS",
    activo: true
  });
  console.log("Institucional user created:", institucionEmail);
  
  process.exit(0);
}

run().catch(console.error);
