// Leitura do inventario.ods (aba "Planilha1 - Auxiliar") sem dependências pesadas.
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { normalizarComodo, idComodo } from '../src/comodos.js';

const NS_T = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
const NS_O = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const NS_X = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';

const MAX_LINHAS = 400;
const MAX_COLUNAS = 20;
const LETRAS = ['O', 'B', 'R', 'P', 'I'];

function textoDo(no) {
  let s = '';
  for (let n = no.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3) s += n.nodeValue;
    else if (n.nodeType === 1) {
      if (n.namespaceURI === NS_X && n.localName === 's') s += ' '.repeat(Number(n.getAttributeNS(NS_X, 'c') || 1));
      else if (n.namespaceURI === NS_X && n.localName === 'tab') s += '\t';
      else if (n.namespaceURI === NS_X && n.localName === 'line-break') s += '\n';
      else s += textoDo(n);
    }
  }
  return s;
}

function lerCelula(c) {
  const ps = [];
  for (let n = c.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && n.namespaceURI === NS_X && n.localName === 'p') ps.push(textoDo(n));
  }
  return {
    texto: ps.join('\n'),
    tipo: c.getAttributeNS(NS_O, 'value-type') || '',
    valor: c.getAttributeNS(NS_O, 'value') || '',
    data: c.getAttributeNS(NS_O, 'date-value') || '',
  };
}

/** Retorna a aba como matriz [linha][coluna] (índices a partir de 0). */
export async function lerAba(caminho, nomeAba) {
  const zip = await JSZip.loadAsync(readFileSync(caminho));
  const xml = await zip.file('content.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tabelas = doc.getElementsByTagNameNS(NS_T, 'table');
  let tabela = null;
  for (let i = 0; i < tabelas.length; i++) {
    if (tabelas[i].getAttributeNS(NS_T, 'name') === nomeAba) tabela = tabelas[i];
  }
  if (!tabela) throw new Error(`Aba "${nomeAba}" não encontrada no ${caminho}`);

  const vazia = { texto: '', tipo: '', valor: '', data: '' };
  const linhas = [];
  for (let r = tabela.firstChild; r && linhas.length < MAX_LINHAS; r = r.nextSibling) {
    if (r.nodeType !== 1 || r.localName !== 'table-row') continue;
    const rep = Number(r.getAttributeNS(NS_T, 'number-rows-repeated') || 1);
    const cells = [];
    for (let c = r.firstChild; c && cells.length < MAX_COLUNAS; c = c.nextSibling) {
      if (c.nodeType !== 1 || !c.localName.endsWith('table-cell')) continue;
      const crep = Number(c.getAttributeNS(NS_T, 'number-columns-repeated') || 1);
      const cel = lerCelula(c);
      for (let k = 0; k < crep && cells.length < MAX_COLUNAS; k++) cells.push(cel);
    }
    while (cells.length < MAX_COLUNAS) cells.push(vazia);
    for (let k = 0; k < rep && linhas.length < MAX_LINHAS; k++) linhas.push(cells);
  }
  return linhas;
}

function dataBR(iso) {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function marcada(cels) {
  const i = cels.findIndex((c) => /x/i.test(c.texto));
  return i >= 0 ? LETRAS[i] : null;
}

/**
 * Converte a aba "Planilha1 - Auxiliar" em itens.
 * Colunas: A item | B setor | C espec | D qt | E série | F data | G-K conservação |
 *          L valor | M observações | N (vazia) | O-S atualização 11/2026
 */
export async function lerInventario(caminho) {
  const linhas = await lerAba(caminho, 'Planilha1 - Auxiliar');
  const itens = [];
  for (let i = 5; i < linhas.length; i++) {
    const c = linhas[i];
    if (!c[0].texto.trim() && !c[1].texto.trim() && !c[2].texto.trim()) break; // fim dos itens
    const linha = i + 1; // linha da planilha (1 = primeira)

    let numero = null;
    if (c[0].tipo === 'float') numero = Number(c[0].valor);
    else if (/^\d+$/.test(c[0].texto.trim())) numero = Number(c[0].texto.trim());

    let dataAquisicao = c[5].texto.trim();
    if (c[5].tipo === 'date' && c[5].data) dataAquisicao = dataBR(c[5].data);

    let valor = null;
    if (['currency', 'float', 'percentage'].includes(c[11].tipo) && c[11].valor !== '') valor = Number(c[11].valor);

    const setorOriginal = c[1].texto;
    const comodo = normalizarComodo(setorOriginal);
    const dados = {
      especificacao: c[2].texto.trim(),
      qtd: c[3].texto.trim(),
      serie: c[4].texto.trim(),
      valor,
      observacoes: c[12].texto.trim(),
    };
    itens.push({
      id: numero != null ? `item-${String(numero).padStart(4, '0')}` : `linha-${String(linha).padStart(4, '0')}`,
      numero,
      ordem: linha,
      novo: false,
      setorOriginal,
      comodo,
      comodoId: idComodo(comodo),
      dataAquisicao,
      conservacaoOriginal: marcada(c.slice(6, 11)),
      ...dados,
      original: dados,
      conservacaoNova: marcada(c.slice(14, 19)),
      conferido: false,
      editadoPor: null,
      editadoEm: null,
    });
  }
  return itens;
}
