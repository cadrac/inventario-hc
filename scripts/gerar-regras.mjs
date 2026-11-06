// Gera firestore.rules a partir de firestore.rules.template,
// trocando __ACCESS_CODE__ pelo código do grupo (variável ACCESS_CODE).
// Assim o código não fica salvo no GitHub.
import { readFileSync, writeFileSync } from 'node:fs';

const codigo = process.env.ACCESS_CODE;
if (!codigo) {
  console.error('Defina ACCESS_CODE (no arquivo .env da raiz do projeto).');
  process.exit(1);
}
if (!/^[\w\-]{4,40}$/.test(codigo)) {
  console.error('ACCESS_CODE deve ter de 4 a 40 letras, números, "-" ou "_".');
  process.exit(1);
}

const modelo = readFileSync('firestore.rules.template', 'utf8');
writeFileSync('firestore.rules', modelo.replaceAll('__ACCESS_CODE__', codigo));
console.log('firestore.rules gerado.');
