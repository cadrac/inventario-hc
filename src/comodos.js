// Normalização dos nomes de setor (usada na importação).
// O nome original fica salvo em "setorOriginal" e volta na exportação.

const CORRECOES = {
  'sala de musica': 'Sala de Música',
  'blibioteca': 'Biblioteca',
};

export function normalizarComodo(setor) {
  let s = String(setor || '')
    .replace(/\s+/g, ' ') // quebras de linha e espaços repetidos
    .trim()
    .replace(/([A-Za-zÀ-ú])(\d)/g, '$1 $2'); // "Feminino1° andar" -> "Feminino 1° andar"
  const chave = s.toLowerCase();
  if (CORRECOES[chave]) s = CORRECOES[chave];
  return s || 'Sem setor';
}

// Cômodos que não estavam na planilha original. Aparecem sempre no fim da lista,
// nesta ordem, mesmo sem itens. O id "extra" é do antigo cômodo "Extra":
// os itens que já estavam lá passam a aparecer com o nome novo.
export const COMODOS_FIXOS = [
  { id: 'brinquedoteca', nome: 'Brinquedoteca' },
  { id: 'extra', nome: 'Parte externa Teatro' },
];
const NOME_FIXO = Object.fromEntries(COMODOS_FIXOS.map((c) => [c.id, c.nome]));
export const nomeFixo = (id) => NOME_FIXO[id];

export function idComodo(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
