// Testa as regras do Firestore no emulador como se fosse outro celular.
//   docker compose run --rm tools node scripts/testar-regras.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, serverTimestamp,
} from 'firebase/firestore';

const [host] = (process.env.EMULATOR_HOST || 'localhost:8080').split(':');
const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-inventario', appId: 'teste' });
const auth = getAuth(app);
connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, host, 8080);

let falhas = 0;
async function espera(desc, deveFuncionar, fn) {
  try {
    await fn();
    console.log(deveFuncionar ? '  ok   ' : '  FALHA', desc, deveFuncionar ? '' : '(deveria ser bloqueado)');
    if (!deveFuncionar) falhas++;
  } catch (e) {
    console.log(deveFuncionar ? '  FALHA' : '  ok   ', desc, deveFuncionar ? e.code : '(bloqueado)');
    if (deveFuncionar) falhas++;
  }
}

const { user } = await signInAnonymously(auth);
const item = doc(db, 'itens', 'item-0118');
const edicao = (extra = {}) => ({
  especificacao: 'Divãs', qtd: '2', serie: '—', valor: 1899, observacoes: 'Assistência Social',
  conservacaoNova: 'R', conferido: true, editadoPor: 'Michele', editadoEm: serverTimestamp(), ...extra,
});

console.log('Sem código de acesso:');
await espera('ler item', false, () => getDoc(item));
await espera('entrar com código errado', false, () =>
  setDoc(doc(db, 'membros', user.uid), { codigo: 'xxxx', nome: 'Michele', entrouEm: serverTimestamp() }));
await espera('entrar com nome fora da lista', false, () =>
  setDoc(doc(db, 'membros', user.uid), { codigo: process.env.ACCESS_CODE, nome: 'Intruso', entrouEm: serverTimestamp() }));

console.log('Com código certo (Michele):');
await espera('entrar', true, () =>
  setDoc(doc(db, 'membros', user.uid), { codigo: process.env.ACCESS_CODE, nome: 'Michele', entrouEm: serverTimestamp() }));
await espera('ler item', true, () => getDoc(item));
await espera('editar item 118 (conservação R)', true, () => updateDoc(item, edicao()));
await espera('mudar data de aquisição', false, () => updateDoc(item, { ...edicao(), dataAquisicao: '01/01/2020' }));
await espera('mudar setor', false, () => updateDoc(item, { ...edicao(), setorOriginal: 'Outro' }));
await espera('conservação inválida', false, () => updateDoc(item, edicao({ conservacaoNova: 'X' })));
await espera('salvar sem conservação', false, () => updateDoc(item, edicao({ conservacaoNova: null })));
await espera('apagar item', false, () => deleteDoc(item));
await espera('adicionar objeto novo', true, () =>
  setDoc(doc(collection(db, 'itens')), {
    ...edicao({ especificacao: 'Cadeira de rodas (teste)', qtd: '1', valor: null, observacoes: '', conservacaoNova: 'B' }),
    novo: true, numero: null, comodo: 'Cantinho da saúde', comodoId: 'cantinho-da-saude',
    setorOriginal: 'Cantinho da saúde', dataAquisicao: '', conservacaoOriginal: null,
    criadoPor: 'Michele', criadoEm: serverTimestamp(),
  }));
await espera('adicionar com número forçado', false, () =>
  setDoc(doc(collection(db, 'itens')), {
    ...edicao(), novo: true, numero: 5, comodo: 'X', comodoId: 'x', setorOriginal: 'X', dataAquisicao: '',
    conservacaoOriginal: null, criadoPor: 'Michele', criadoEm: serverTimestamp(),
  }));
await espera('ler membro de outra pessoa', false, () => getDoc(doc(db, 'membros', 'outro-uid')));

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTodas as regras se comportaram como esperado.');
process.exit(falhas ? 1 : 0);
