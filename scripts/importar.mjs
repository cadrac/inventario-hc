// Importa o inventario.ods para o Firestore.
//
//   docker compose run --rm tools npm run import                  -> emulador
//   docker compose run --rm tools npm run import -- --producao    -> banco real
//   ... -- --simular   só mostra o resumo, não grava nada
//   ... -- --forcar    apaga os itens existentes e importa de novo (CUIDADO: perde a visita)
import { existsSync, readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { lerInventario } from './ods.mjs';

const args = process.argv.slice(2);
const producao = args.includes('--producao');
const simular = args.includes('--simular');
const forcar = args.includes('--forcar');
const ARQUIVO = 'inventario.ods';
const CHAVE = 'service-account.json';

const itens = await lerInventario(ARQUIVO);

// Resumo
const comodos = new Map();
for (const it of itens) comodos.set(it.comodo, (comodos.get(it.comodo) || 0) + 1);
console.log(`${itens.length} itens lidos (${itens.filter((i) => i.numero == null).length} sem número), ${comodos.size} cômodos:`);
for (const [nome, n] of comodos) console.log(`  ${String(n).padStart(3)}  ${nome}`);
const maior = Math.max(...itens.map((i) => i.numero || 0));
console.log(`Maior número de item: ${maior} (novos começam em ${maior + 1})`);
if (simular) process.exit(0);

// Conexão
if (producao) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  if (!existsSync(CHAVE)) {
    console.error(`\nArquivo ${CHAVE} não encontrado na raiz do projeto. Veja o README (passo "Chave de serviço").`);
    process.exit(1);
  }
  const conta = JSON.parse(readFileSync(CHAVE, 'utf8'));
  initializeApp({ credential: cert(conta), projectId: conta.project_id });
  console.log(`\nDestino: banco REAL (${conta.project_id})`);
} else {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.EMULATOR_HOST || 'localhost:8080';
  initializeApp({ projectId: 'demo-inventario' });
  console.log(`\nDestino: emulador (${process.env.FIRESTORE_EMULATOR_HOST})`);
}
const db = getFirestore();
const col = db.collection('itens');

const existentes = await col.get();
if (!existentes.empty && !forcar) {
  console.error(`\nJá existem ${existentes.size} itens no banco. Nada foi gravado.`);
  console.error('Para apagar tudo e importar de novo, use --forcar (perde as conferências feitas).');
  process.exit(1);
}

let lote = db.batch();
let n = 0;
async function gravar(op) {
  op(lote);
  if (++n % 400 === 0) {
    await lote.commit();
    lote = db.batch();
  }
}
for (const d of existentes.docs) await gravar((b) => b.delete(d.ref));
for (const { id, ...dados } of itens) await gravar((b) => b.set(col.doc(id), dados));
await lote.commit();
console.log(`Pronto: ${itens.length} itens gravados.`);
process.exit(0);
