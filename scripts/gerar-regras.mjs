// Gera firestore.rules a partir de firestore.rules.template, trocando
// __CODIGO_<NOME>__ pelo código individual de cada pessoa (variáveis de ambiente).
// Assim os códigos não ficam salvos no GitHub.
import { readFileSync, writeFileSync } from 'node:fs';

const PESSOAS = ['PEDRO', 'MICHELE', 'MERCIA', 'CARLOS', 'GABRIEL'];
const erros = [];
const codigos = {};
for (const p of PESSOAS) {
  const v = process.env[`CODIGO_${p}`];
  if (!v) erros.push(`Defina CODIGO_${p} (no arquivo .env da raiz do projeto).`);
  else if (!/^[\w-]{4,40}$/.test(v)) erros.push(`CODIGO_${p} deve ter de 4 a 40 letras, números, "-" ou "_".`);
  else codigos[p] = v.toLowerCase(); // a tela de entrada também converte para minúsculas
}
const repetidos = Object.values(codigos).filter((v, i, a) => a.indexOf(v) !== i);
if (repetidos.length) erros.push('Cada pessoa precisa de um código diferente.');
if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}

let regras = readFileSync('firestore.rules.template', 'utf8');
for (const [p, v] of Object.entries(codigos)) regras = regras.replaceAll(`__CODIGO_${p}__`, v);
if (/__CODIGO_\w+__/.test(regras)) {
  console.error('Sobrou algum __CODIGO_...__ sem substituir no modelo de regras.');
  process.exit(1);
}
writeFileSync('firestore.rules', regras);
console.log('firestore.rules gerado (5 códigos individuais).');
