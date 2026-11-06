// Teste rápido: lê o .ods, simula 2 edições e 1 item novo, e gera teste-exportacao.xlsx.
//   docker compose run --rm tools npm run test:export
import ExcelJS from 'exceljs';
import { lerInventario } from './ods.mjs';
import { adicionarRegistro, montarPlanilha, ordenarParaExportar } from '../src/exportar.js';

const itens = await lerInventario('inventario.ods');
const agora = new Date();
const editar = (num, campos) => Object.assign(itens.find((i) => i.numero === num), campos, { conferido: true, editadoPor: 'Pedro', editadoEm: agora });
editar(1, { conservacaoNova: 'B', observacoes: 'Assistência Social - risco no tampo' });
editar(174, { conservacaoNova: 'R', qtd: '9mil' });
itens.push({
  novo: true, numero: 279, comodo: 'Cozinha', comodoId: 'cozinha', setorOriginal: 'Cozinha', dataAquisicao: '',
  especificacao: 'Liquidificador (teste)', qtd: '1', serie: '', valor: 150, observacoes: '',
  conservacaoOriginal: null, conservacaoNova: 'O', conferido: true, editadoPor: 'Michele', editadoEm: agora,
});

const ordem = ordenarParaExportar(itens);
const wb = montarPlanilha(ExcelJS, ordem);
adicionarRegistro(wb, ordem);
await wb.xlsx.writeFile('teste-exportacao.xlsx');

// Confere lendo de volta
const lido = new ExcelJS.Workbook();
await lido.xlsx.readFile('teste-exportacao.xlsx');
const ws = lido.getWorksheet('Planilha1 - Auxiliar');
const linha = (n) => ws.getRow(n).values.slice(1).map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v));
console.log('Linha 5 :', JSON.stringify(linha(5)));
console.log('Linha 6 :', JSON.stringify(linha(6)));
console.log('Linha 187:', JSON.stringify(linha(187)));
const ult = 6 + ordem.length - 1;
console.log(`Linha ${ult}:`, JSON.stringify(linha(ult)));
console.log(`Rodapé linha ${ult + 15}:`, JSON.stringify(String(ws.getCell(`A${ult + 15}`).value).slice(0, 60)));
console.log(`Legenda M${ult + 15}:`, JSON.stringify(ws.getCell(`M${ult + 15}`).value));
console.log('OK: teste-exportacao.xlsx gerado com', ordem.length, 'itens.');
