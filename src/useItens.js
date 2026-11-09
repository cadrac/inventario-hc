import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';
import { EXTRA } from './comodos.js';

/**
 * Escuta todos os itens em tempo real (são poucos: ~280).
 * Os itens novos recebem o número na ordem em que chegaram ao servidor (279, 280...),
 * então todo mundo vê a mesma numeração. Enquanto não sincroniza, o número é provisório.
 */
export function useItens() {
  const [docs, setDocs] = useState(null);
  const [erro, setErro] = useState(null);
  const [doCache, setDoCache] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'itens'),
        { includeMetadataChanges: true },
        (snap) => {
          setDoCache(snap.metadata.fromCache);
          setDocs(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data({ serverTimestamps: 'estimate' }),
              pendente: d.metadata.hasPendingWrites,
            })),
          );
        },
        (e) => {
          console.error(e);
          setErro(e);
        },
      ),
    [],
  );

  const dados = useMemo(() => {
    if (!docs) return null;
    const originais = docs.filter((d) => !d.novo).sort((a, b) => a.ordem - b.ordem);
    const maior = originais.reduce((m, d) => Math.max(m, d.numero || 0), 0);
    const ms = (t) => (t?.toMillis ? t.toMillis() : Number.MAX_SAFE_INTEGER);
    const novos = docs
      .filter((d) => d.novo)
      .sort((a, b) => ms(a.criadoEm) - ms(b.criadoEm) || a.id.localeCompare(b.id))
      .map((d, i) => ({ ...d, numero: maior + i + 1, numeroProvisorio: d.pendente }));
    // Itens excluídos continuam com o número deles (os números nunca mudam),
    // mas saem da lista, dos contadores e da planilha.
    const todos = [...originais, ...novos];
    const ativos = todos.filter((d) => !d.excluido);
    const excluidos = todos
      .filter((d) => d.excluido)
      .sort((a, b) => ms(b.excluidoEm) - ms(a.excluidoEm));

    // Cômodos na ordem em que aparecem na planilha
    const comodos = new Map();
    for (const it of todos) {
      if (!comodos.has(it.comodoId)) comodos.set(it.comodoId, { id: it.comodoId, nome: it.comodo, total: 0, conferidos: 0 });
      if (it.excluido) continue;
      const c = comodos.get(it.comodoId);
      c.total++;
      if (it.conferido) c.conferidos++;
    }
    // "Extra" sempre existe (mesmo vazio) e fica por último.
    const extra = comodos.get(EXTRA.id) || { id: EXTRA.id, nome: EXTRA.nome, total: 0, conferidos: 0 };
    comodos.delete(EXTRA.id);
    return {
      itens: ativos,
      excluidos,
      comodos: [...comodos.values(), { ...extra, extra: true }],
      proximoNumero: maior + novos.length + 1,
      pendentes: docs.filter((d) => d.pendente).length,
    };
  }, [docs]);

  return { ...dados, carregando: !docs, erro, doCache };
}
