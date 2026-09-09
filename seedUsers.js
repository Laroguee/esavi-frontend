import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwWboZLQogyuUuiYTcJUEsDi2rMPMq-IE",
  authDomain: "esavi-sv-backend.firebaseapp.com",
  projectId: "esavi-sv-backend",
  storageBucket: "esavi-sv-backend.firebasestorage.app",
  messagingSenderId: "939471115863",
  appId: "1:939471115863:web:20ead13a564f02b136f512"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  // ===================== EQUIPOS LOCALES MINSAL =====================
  {
    email: "clinico.local@minsal.gob.sv",
    password: "Password123!",
    role: "ESAVI_LOCAL",
    name: "Dr. Clínico Minsal",
    institucionMacro: "MINSAL",
    establecimiento: "UCSF San Jacinto",
    id_establecimiento: 6,
    activo: true
  },
  {
    email: "inmuno.local@minsal.gob.sv",
    password: "Password123!",
    role: "INMUNO_LOCAL",
    name: "Lic. Inmunizaciones Minsal",
    institucionMacro: "MINSAL",
    establecimiento: "UCSF San Jacinto",
    id_establecimiento: 6,
    activo: true
  },
  {
    email: "epidemio.local@minsal.gob.sv",
    password: "Password123!",
    role: "EPIDEMIO_LOCAL",
    name: "Dra. Epidemiología Minsal",
    institucionMacro: "MINSAL",
    establecimiento: "UCSF San Jacinto",
    id_establecimiento: 6,
    activo: true
  },

  // ===================== EQUIPOS LOCALES ISSS =====================
  {
    email: "clinico.local@isss.gob.sv",
    password: "Password123!",
    role: "ESAVI_LOCAL",
    name: "Dr. Clínico ISSS",
    institucionMacro: "ISSS",
    establecimiento: "Clínica Comunal San Jacinto",
    id_establecimiento: 7,
    activo: true
  },
  {
    email: "inmuno.local@isss.gob.sv",
    password: "Password123!",
    role: "INMUNO_LOCAL",
    name: "Lic. Inmunizaciones ISSS",
    institucionMacro: "ISSS",
    establecimiento: "Clínica Comunal San Jacinto",
    id_establecimiento: 7,
    activo: true
  },
  {
    email: "epidemio.local@isss.gob.sv",
    password: "Password123!",
    role: "EPIDEMIO_LOCAL",
    name: "Dra. Epidemiología ISSS",
    institucionMacro: "ISSS",
    establecimiento: "Clínica Comunal San Jacinto",
    id_establecimiento: 7,
    activo: true
  },

  // ===================== NIVEL CENTRAL =====================
  {
    email: "institucional@minsal.gob.sv",
    password: "Password123!",
    role: "ESAVI_INSTITUCIONAL",
    name: "Dr. Central Minsal",
    institucionMacro: "MINSAL",
    establecimiento: "Oficina Central MINSAL",
    id_establecimiento: 1,
    activo: true
  },
  {
    email: "institucional@isss.gob.sv",
    password: "Password123!",
    role: "ESAVI_INSTITUCIONAL",
    name: "Dra. Central ISSS",
    institucionMacro: "ISSS",
    establecimiento: "Oficina Central ISSS",
    id_establecimiento: 2,
    activo: true
  },
  // ===================== NIVEL REGULADOR (SRS) =====================
  {
    email: "secretariado@srs.gob.sv",
    password: "Password123!",
    role: "SECRETARIADO",
    name: "Secretariado Técnico SNFV",
    institucionMacro: "SRS",
    establecimiento: "Oficina Central SRS",
    id_establecimiento: 1, // You might need to change this if they have a specific SRS establishment ID
    activo: true
  },
  {
    email: "comite@srs.gob.sv",
    password: "Password123!",
    role: "COMITE_EXTERNO",
    name: "Miembro del Comité Externo",
    institucionMacro: "SRS",
    establecimiento: "Oficina Central SRS",
    id_establecimiento: 1,
    activo: true
  }
];

async function seed() {
  for (const u of users) {
    try {
      console.log(`Creando ${u.email}...`);
      await createUserWithEmailAndPassword(auth, u.email, u.password);
      
      const { password, ...firestoreData } = u;
      await setDoc(doc(db, "usuarios", u.email), firestoreData);
      console.log(`Exito: ${u.email}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
         console.log(`El usuario ${u.email} ya existe en Auth, actualizando Firestore...`);
         const { password, ...firestoreData } = u;
         await setDoc(doc(db, "usuarios", u.email), firestoreData);
      } else {
         console.error(`Error con ${u.email}:`, err.message);
      }
    }
  }
  process.exit(0);
}

seed();
