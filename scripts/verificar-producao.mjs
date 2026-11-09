// Verifica o banco REAL como se fosse um celular (só leitura, não altera itens).
//   docker compose run --rm tools node scripts/verificar-producao.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';

const e = process.env;
const app = initializeApp({
  apiKey: e.VITE_FIREBASE_API_KEY,
  authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID,
  appId: e.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const { user } = await signInAnonymously(auth);
console.log('login anônimo: ok');

try {
  await getDocs(collection(db, 'itens'));
  console.log('FALHA: leu itens sem código');
} catch {
  console.log('sem código, leitura bloqueada: ok');
}
try {
  await setDoc(doc(db, 'membros', user.uid), { codigo: 'errado', nome: 'Pedro', entrouEm: serverTimestamp() });
  console.log('FALHA: aceitou código errado');
} catch {
  console.log('código errado recusado: ok');
}
await setDoc(doc(db, 'membros', user.uid), { codigo: (e.CODIGO_PEDRO || '').toLowerCase(), nome: 'Pedro', entrouEm: serverTimestamp() });
console.log('código certo aceito: ok');
const snap = await getDocs(collection(db, 'itens'));
console.log(`itens lidos: ${snap.size}`);
process.exit(0);
