import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function main() {
  const docId = `REU-ESAVI-2026-106-1234567`;
  await setDoc(doc(db, "reuniones", docId), {
    id: docId,
    id_caso: "ESAVI-2026-106",
    fase_relacionada: "Fase 6",
    fecha: "2026-09-07",
    hora: "10:00",
    tema: "Reunión de prueba insertada",
    modalidad: "Virtual",
    enlace_lugar: "meet.google.com/test",
    convocados: []
  });
  console.log("Inserted meeting!");
}
main().catch(console.error);
