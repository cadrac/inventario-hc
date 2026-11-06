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
