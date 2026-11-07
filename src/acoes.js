// Todas as gravações do app. Cada ação grava o item E uma entrada no histórico
// na mesma operação (writeBatch): ou as duas vão, ou nenhuma vai.
// Não esperamos o servidor: offline, fica no aparelho e é enviado depois.
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { formatarValor, nomeConservacao } from './util.js';

const CAMPOS = {
  especificacao: 'Especificação',
  qtd: 'Qtd',
  serie: 'Nº de série',
  valor: 'Valor total',
  observacoes: 'Observações',
  conservacaoNova: 'Conservação 11/2026',
};

function mostrar(campo, v) {
  if (v == null || v === '') return '—';
  if (campo === 'valor') return formatarValor(v);
  if (campo === 'conservacaoNova') return `${v} ${nomeConservacao(v)}`;
  return String(v);
}

function mudancas(antes, depois) {
  return Object.keys(CAMPOS)
    .filter((k) => (antes?.[k] ?? null) !== (depois[k] ?? null) && !((antes?.[k] ?? '') === '' && (depois[k] ?? '') === ''))
    .map((k) => ({ campo: CAMPOS[k], de: mostrar(k, antes?.[k]), para: mostrar(k, depois[k]) }));
}

function registro(tipo, item, nome, extra = {}) {
  return {
    tipo,
    itemId: item.id,
    numero: item.numero ?? null,
    comodo: item.comodo,
    especificacao: item.especificacao,
    por: nome,
    em: serverTimestamp(),
    mudancas: [],
    motivo: '',
    ...extra,
  };
}

function gravar(ops) {
  const lote = writeBatch(db);
  for (const [tipo, ref, dados] of ops) lote[tipo](ref, dados);
  return lote.commit();
}

const novoLog = () => doc(collection(db, 'historico'));

/** Salvar o modal de edição: conta como "conferência" na primeira vez, depois "edição". */
export function salvarEdicao(item, campos, nome) {
  const dados = { ...campos, conferido: true, editadoPor: nome, editadoEm: serverTimestamp() };
  const tipo = item.conferido ? 'edicao' : 'conferencia';
  const log = registro(tipo, { ...item, especificacao: campos.especificacao }, nome, {
    mudancas: mudancas(item, campos),
  });
  return gravar([
    ['update', doc(db, 'itens', item.id), dados],
    ['set', novoLog(), log],
  ]);
}

export function adicionarItem(comodo, campos, nome, numeroPrevisto) {
  const ref = doc(collection(db, 'itens'));
  const item = {
    ...campos,
    conferido: true,
    editadoPor: nome,
    editadoEm: serverTimestamp(),
    novo: true,
    numero: null,
    comodo: comodo.nome,
    comodoId: comodo.id,
    setorOriginal: comodo.nome,
    dataAquisicao: '',
    conservacaoOriginal: null,
    criadoPor: nome,
    criadoEm: serverTimestamp(),
  };
  const log = registro('adicao', { id: ref.id, numero: numeroPrevisto, comodo: comodo.nome, especificacao: campos.especificacao }, nome, {
    mudancas: mudancas({}, campos),
  });
  return gravar([
    ['set', ref, item],
    ['set', novoLog(), log],
  ]);
}

/** Exclusão "mole": o item vai para a lixeira e pode ser restaurado. */
export function excluirItem(item, nome, motivo) {
  return gravar([
    ['update', doc(db, 'itens', item.id), { excluido: true, excluidoPor: nome, excluidoEm: serverTimestamp(), motivoExclusao: motivo }],
    ['set', novoLog(), registro('exclusao', item, nome, { motivo })],
  ]);
}

export function restaurarItem(item, nome) {
  return gravar([
    ['update', doc(db, 'itens', item.id), { excluido: false, excluidoPor: nome, excluidoEm: serverTimestamp(), motivoExclusao: '' }],
    ['set', novoLog(), registro('restauracao', item, nome)],
  ]);
}
