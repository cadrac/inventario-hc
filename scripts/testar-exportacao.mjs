// Teste rápido: lê o .ods, simula edições, 2 itens novos e 1 excluído, e gera teste-exportacao.xlsx.
//   docker compose run --rm tools npm run test:export
import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { lerInventario } from './ods.mjs';
import { adicionarExcluidos, adicionarHistorico, adicionarRegistro, montarPlanilha, ordenarParaExportar } from '../src/exportar.js';

const itens = await lerInventario('inventario.ods');
const agora = new Date();
const editar = (num, campos) => Object.assign(itens.find((i) => i.numero === num), campos, { conferido: true, editadoPor: 'Pedro', editadoEm: agora });
editar(1, { conservacaoNova: 'B', observacoes: 'Assistência Social - risco no tampo' });
editar(174, { conservacaoNova: 'R', qtd: '9mil' });
const novo = (numero, especificacao, comodo, valor) => ({
  novo: true, numero, comodo, comodoId: comodo.toLowerCase(), setorOriginal: comodo, dataAquisicao: '',
  especificacao, qtd: '1', serie: '', valor, observacoes: '',
  conservacaoOriginal: null, conservacaoNova: 'O', conferido: true, editadoPor: 'Michele', editadoEm: agora,
});
itens.push(novo(279, 'Liquidificador (exemplo de item novo)', 'Cozinha', 150));
itens.push(novo(280, 'Estante de aço (exemplo de item novo)', 'Galpão', 1250.5));

// Um item excluído: sai da aba oficial e vai só para a aba "Excluídos"
const excluido = itens.find((i) => i.numero === 2);
Object.assign(excluido, { excluido: true, excluidoPor: 'Gabriel', excluidoEm: agora, motivoExclusao: 'Exemplo: lançado em duplicidade' });

const logoBase64 = 'data:image/png;base64,' + readFileSync('public/logo-hc.png').toString('base64');
const ordem = ordenarParaExportar(itens.filter((i) => !i.excluido));
const wb = montarPlanilha(ExcelJS, ordem, { logoBase64 });
adicionarRegistro(wb, ordem);
adicionarExcluidos(wb, [excluido]);
adicionarHistorico(wb, [
  { tipo: 'conferencia', numero: 1, comodo: 'Presidência', especificacao: 'Mesa', por: 'Pedro', em: agora, mudancas: [{ campo: 'Conservação 11/2026', de: '—', para: 'B Bom' }], motivo: '' },
  { tipo: 'exclusao', numero: 2, comodo: 'Presidência', especificacao: 'Conexão', por: 'Gabriel', em: agora, mudancas: [], motivo: 'Exemplo: lançado em duplicidade' },
]);
await wb.xlsx.writeFile('teste-exportacao.xlsx');

// Confere lendo de volta
const lido = new ExcelJS.Workbook();
await lido.xlsx.readFile('teste-exportacao.xlsx');
const ws = lido.getWorksheet('Planilha1 - Auxiliar');
const linhaDo = (num) => { for (let r = 6; r < 400; r++) if (ws.getCell(`A${r}`).value === num) return r; };
let coloridas = 0;
ws.eachRow((row) => row.eachCell((c) => { if (c.fill?.fgColor) coloridas++; }));
console.log('Abas:', lido.worksheets.map((w) => w.name).join(' | '));
console.log('Imagens (logos):', ws.getImages().length);
console.log('Título A1:', ws.getCell('A1').value, '| fonte', ws.getCell('A1').font.name, ws.getCell('A1').font.size);
console.log('Linha 3 (sem legenda):', JSON.stringify(ws.getCell('A3').value));
console.log('Células coloridas na aba oficial:', coloridas);
console.log('Item 2 (excluído) na aba oficial:', linhaDo(2) ? 'SIM (erro)' : 'não');
console.log('Item 2 na aba Excluídos:', lido.getWorksheet('Excluídos').getCell('A2').value === 2 ? 'sim' : 'NÃO (erro)');
console.log('Item 279 (novo) na linha', linhaDo(279));
console.log('Painéis congelados:', lido.worksheets.some((w) => (w.views || []).some((v) => v.state === 'frozen')) ? 'SIM' : 'nenhum');
console.log('OK: teste-exportacao.xlsx gerado com', ordem.length, 'itens.');
