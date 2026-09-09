import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "dummy",
    authDomain: "esavi-7f0ad.firebaseapp.com",
    projectId: "esavi-7f0ad",
    storageBucket: "esavi-7f0ad.appspot.com",
    messagingSenderId: "123",
    appId: "123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    console.log("Checking ASIGNACIONES_ERR...");
    const asigSnap = await getDocs(collection(db, "ASIGNACIONES_ERR"));
    asigSnap.forEach(d => console.log("ASIGNACIONES_ERR Doc:", d.id, d.data()));

    console.log("Checking MATRIZ_RIESGO...");
    const matrizSnap = await getDocs(collection(db, "MATRIZ_RIESGO"));
    matrizSnap.forEach(d => console.log("MATRIZ_RIESGO Doc:", d.id, d.data()));
}

check().then(() => process.exit(0)).catch(console.error);
