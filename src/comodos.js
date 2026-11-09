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

// Cômodo especial, sempre no fim da lista: para objetos que estão em lugares
// que não existem na planilha (o cômodo de verdade vai nas observações).
export const EXTRA = { id: 'extra', nome: 'Extra' };
export const ehExtra = (c) => c === EXTRA.id || c === EXTRA.nome || c?.id === EXTRA.id;

export function idComodo(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
