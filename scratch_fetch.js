import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
  console.log("Fetching MATRIZ_RIESGO...");
  let querySnapshot = await getDocs(collection(db, "MATRIZ_RIESGO"));
  console.log("Found", querySnapshot.size, "documents in MATRIZ_RIESGO");
  querySnapshot.forEach((doc) => {
    console.log(doc.id, "=>", JSON.stringify(doc.data(), null, 2));
  });

  console.log("Fetching ASIGNACIONES_ERR...");
  querySnapshot = await getDocs(collection(db, "ASIGNACIONES_ERR"));
  console.log("Found", querySnapshot.size, "documents in ASIGNACIONES_ERR");
  querySnapshot.forEach((doc) => {
    console.log(doc.id, "=>", JSON.stringify(doc.data(), null, 2));
  });
}

main().catch(console.error);
