import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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

async function run() {
  const usersToDelete = [
    "admin@srs.gob.sv",
    "experto@srs.gob.sv",
    "err@srs.gob.sv"
  ];

  for (const email of usersToDelete) {
    await deleteDoc(doc(db, "usuarios", email));
    console.log("Deleted:", email);
  }
  
  process.exit(0);
}

run().catch(console.error);
