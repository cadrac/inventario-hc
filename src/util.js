export const PESSOAS = ['Pedro', 'Michele', 'Mércia', 'Carlos', 'Gabriel'];

export const CONSERVACAO = [
  { letra: 'O', nome: 'Ótimo' },
  { letra: 'B', nome: 'Bom' },
  { letra: 'R', nome: 'Regular' },
  { letra: 'P', nome: 'Precário' },
  { letra: 'I', nome: 'Inservível' },
];

export const nomeConservacao = (l) => CONSERVACAO.find((c) => c.letra === l)?.nome || '';

// localStorage pode falhar (aba anônima, bloqueio): nunca deixa o app quebrar.
export const guardar = {
  ler(chave) {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  },
  gravar(chave, valor) {
    try {
      if (valor == null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, valor);
    } catch {
      /* ignora */
    }
  },
};

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatarValor = (v) => (v == null || Number.isNaN(v) ? '—' : moeda.format(v));

export const valorParaCampo = (v) =>
  v == null ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1.250,50" | "1250.5" | "R$ 300" -> número; "" -> null; inválido -> NaN */
export function lerValor(texto) {
  let s = String(texto || '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100) / 100;
}

/**
 * Máscara de moeda enquanto digita: "1500" -> "1.500", "1500,5" -> "1.500,5".
 * A vírgula começa os centavos (no máximo 2). Ponto digitado no fim vira vírgula
 * (alguns teclados de celular só têm ponto).
 */
const contarPontos = (s) => (String(s || '').match(/\./g) || []).length;

/**
 * Se a pessoa digitou/colou um ponto NOVO (alguns teclados de celular só têm ponto)
 * e ele está no fim ou seguido de só 1-2 dígitos, ele vira a vírgula dos centavos:
 * "1500." -> "1500,"  "1500.5" -> "1500,5". Seguido de 3 dígitos continua milhar.
 * Pontos que já estavam lá (os da máscara) nunca viram vírgula: apagar um dígito
 * de "1.500" dá "1.50" -> "150", e não "1,50".
 */
export function normalizarDecimal(texto, anterior = '') {
  const s = String(texto || '');
  if (s.includes(',') || contarPontos(s) <= contarPontos(anterior)) return s;
  const m = /\.(\d{0,2})$/.exec(s);
  return m ? s.slice(0, m.index) + ',' + m[1] : s;
}

export function mascararValor(texto, anterior = '') {
  let s = normalizarDecimal(texto, anterior);
  s = s.replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  let inteiro = i >= 0 ? s.slice(0, i) : s;
  const decimais = i >= 0 ? s.slice(i + 1).replace(/,/g, '').slice(0, 2) : null;
  inteiro = inteiro.replace(/^0+(?=\d)/, '').slice(0, 9); // até 999.999.999
  let fmt = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (decimais !== null) fmt = (fmt || '0') + ',' + decimais;
  return fmt;
}

export function quando(data) {
  if (!data) return '';
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) return `às ${hora}`;
  return `em ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
}

export const normalizarBusca = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
