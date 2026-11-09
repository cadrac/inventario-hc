// Deixa o banco "puro" de novo: igual à planilha inventario.ods, sem nenhuma
// conferência, edição, item novo, exclusão, histórico, presença ou login.
//
// ANTES de apagar, salva um backup completo em backups/AAAA-MM-DD_HH-MM-SS_<alvo>.json
//
//   docker compose run --rm tools node scripts/zerar-banco.mjs                       -> emulador
//   docker compose run --rm tools node scripts/zerar-banco.mjs --producao --confirmo -> banco REAL
//   ... --simular  só mostra o que seria apagado, não apaga nada
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { lerInventario } from './ods.mjs';

const args = process.argv.slice(2);
const producao = args.includes('--producao');
const simular = args.includes('--simular');
const COLECOES = ['itens', 'historico', 'presenca', 'membros'];

if (producao && !simular && !args.includes('--confirmo')) {
  console.error('Para zerar o banco REAL, rode de novo com --producao --confirmo');
  process.exit(1);
}

if (producao) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  if (!existsSync('service-account.json')) {
    console.error('Arquivo service-account.json não encontrado na raiz do projeto.');
    process.exit(1);
  }
  const conta = JSON.parse(readFileSync('service-account.json', 'utf8'));
  initializeApp({ credential: cert(conta), projectId: conta.project_id });
  console.log(`Alvo: banco REAL (${conta.project_id})`);
} else {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.EMULATOR_HOST || 'localhost:8080';
  initializeApp({ projectId: 'demo-inventario' });
  console.log(`Alvo: emulador (${process.env.FIRESTORE_EMULATOR_HOST})`);
}
const db = getFirestore();

// 1) Backup de tudo
const backup = {};
for (const nome of COLECOES) {
  const snap = await db.collection(nome).get();
  backup[nome] = Object.fromEntries(
    snap.docs.map((d) => [
      d.id,
      JSON.parse(JSON.stringify(d.data(), (k, v) => (v instanceof Timestamp ? v.toDate().toISOString() : v))),
    ]),
  );
}
const itens = Object.values(backup.itens);
console.log('\nSituação atual:');
console.log(`  itens: ${itens.length} (${itens.filter((i) => i.novo).length} novos, ${itens.filter((i) => i.conferido).length} conferidos, ${itens.filter((i) => i.excluido).length} na lixeira)`);
console.log(`  histórico: ${Object.keys(backup.historico).length} registros`);
console.log(`  presença: ${Object.keys(backup.presenca).length} aparelhos`);
console.log(`  logins (membros): ${Object.keys(backup.membros).length}`);
if (simular) {
  console.log('\n--simular: nada foi apagado.');
  process.exit(0);
}
mkdirSync('backups', { recursive: true });
const carimbo = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const arquivo = `backups/${carimbo}_${producao ? 'producao' : 'emulador'}.json`;
// Os códigos de acesso não vão para o backup.
for (const m of Object.values(backup.membros)) delete m.codigo;
writeFileSync(arquivo, JSON.stringify(backup, null, 2));
console.log(`\nBackup salvo em ${arquivo}`);

// 2) Apaga tudo
for (const nome of COLECOES) {
  const refs = (await db.collection(nome).get()).docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 400) {
    const lote = db.batch();
    refs.slice(i, i + 400).forEach((r) => lote.delete(r));
    await lote.commit();
  }
  console.log(`  ${nome}: ${refs.length} apagados`);
}

// 3) Importa a planilha de novo, do zero
const novos = await lerInventario('inventario.ods');
for (let i = 0; i < novos.length; i += 400) {
  const lote = db.batch();
  novos.slice(i, i + 400).forEach(({ id, ...dados }) => lote.set(db.collection('itens').doc(id), dados));
  await lote.commit();
}
console.log(`\nPronto: ${novos.length} itens importados da planilha. Banco puro de novo.`);
process.exit(0);
