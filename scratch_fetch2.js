import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";

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
  const q = query(collection(db, "ANEXO_CLINICO"), limit(5));
  let querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, "=>", JSON.stringify(doc.data()));
  });
}

main().catch(console.error);
