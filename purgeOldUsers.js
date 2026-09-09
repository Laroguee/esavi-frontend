import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const correosValidos = new Set([
  "clinico.local@minsal.gob.sv",
  "inmuno.local@minsal.gob.sv",
  "epidemio.local@minsal.gob.sv",
  "clinico.local@isss.gob.sv",
  "inmuno.local@isss.gob.sv",
  "epidemio.local@isss.gob.sv",
  "institucional@minsal.gob.sv",
  "institucional@isss.gob.sv",
  "secretariado@srs.gob.sv",
  "comite@srs.gob.sv"
]);

async function purge() {
  try {
    const snapshot = await getDocs(collection(db, "usuarios"));
    let count = 0;
    
    for (const docSnap of snapshot.docs) {
      const email = docSnap.id;
      if (!correosValidos.has(email)) {
        console.log(`Purgando usuario obsoleto: ${email}`);
        await deleteDoc(doc(db, "usuarios", email));
        count++;
      }
    }
    console.log(`\nPurga completada. Se eliminaron ${count} usuarios obsoletos de Firestore.`);
    process.exit(0);
  } catch (err) {
    console.error("Error durante la purga:", err);
    process.exit(1);
  }
}

purge();
