import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc } from "firebase/firestore";
const firebaseConfig = { apiKey: "AIzaSyCwWboZLQogyuUuiYTcJUEsDi2rMPMq-IE", authDomain: "esavi-sv-backend.firebaseapp.com", projectId: "esavi-sv-backend" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
async function main() {
  const c = await getDoc(doc(db, "casos", "ESAVI-2026-106"));
  console.log(JSON.stringify(c.data()));
}
main().catch(console.error);
