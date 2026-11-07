import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { ONLINE_ATE_MS } from '../presenca.js';
import { PESSOAS } from '../util.js';

function haQuanto(ms) {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/** Ouve a presença de todos os aparelhos. Só roda com a aba Equipe aberta (economiza leituras). */
function usePresencas() {
  const [lista, setLista] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'presenca'),
        (snap) => setLista(snap.docs.map((d) => ({ uid: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
        (e) => console.warn('Presença:', e.code || e.message),
      ),
    [],
  );
  // Atualiza "online / visto há X" sozinho, sem precisar de nova gravação.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    const aparelhos = (lista || []).map((p) => {
      const visto = p.vistoEm?.toMillis ? p.vistoEm.toMillis() : 0;
      return { ...p, visto, online: agora - visto < ONLINE_ATE_MS, este: p.uid === auth.currentUser?.uid };
    });
    return { aparelhos, carregando: !lista, agora, online: aparelhos.filter((a) => a.online).length };
  }, [lista, agora]);
}

export default function Equipe() {
  const { aparelhos, carregando, agora, online } = usePresencas();

  const pessoas = useMemo(
    () =>
      PESSOAS.map((nome) => {
        const deles = aparelhos.filter((a) => a.nome === nome).sort((a, b) => b.online - a.online || b.visto - a.visto);
        return { nome, aparelhos: deles, online: deles.some((a) => a.online), ultimo: deles[0]?.visto || 0 };
      }).sort((a, b) => b.online - a.online || b.ultimo - a.ultimo),
    [aparelhos],
  );

  return (
    <section className="painel" aria-labelledby="titulo-equipe">
      <div className="painel-cabecalho">
        <h2 id="titulo-equipe">Equipe</h2>
        <p className="sub">
          {carregando
            ? 'Carregando…'
            : `${online} ${online === 1 ? 'aparelho online' : 'aparelhos online'} agora · ${aparelhos.length} ${aparelhos.length === 1 ? 'aparelho já entrou' : 'aparelhos já entraram'}. Online = app aberto nos últimos 3 minutos.`}
        </p>
      </div>

      <div className="lista" tabIndex={0} aria-label="Pessoas e aparelhos">
        <ul className="equipe">
          {pessoas.map((p) => (
            <li key={p.nome} className="pessoa">
              <div className="pessoa-cabecalho">
                <span className={'bolinha' + (p.online ? ' on' : '')} aria-hidden="true" />
                <strong>{p.nome}</strong>
                <span className="sub">
                  {p.aparelhos.length === 0
                    ? 'ainda não abriu o app'
                    : `${p.aparelhos.length} ${p.aparelhos.length === 1 ? 'aparelho' : 'aparelhos'}`}
                </span>
              </div>
              {p.aparelhos.length > 0 && (
                <ul className="aparelhos">
                  {p.aparelhos.map((a) => (
                    <li key={a.uid}>
                      <span className={'bolinha pequena' + (a.online ? ' on' : '')} aria-hidden="true" />
                      <span className="aparelho-nome">
                        {a.aparelho}
                        {a.este && <span className="etiqueta novo">este aparelho</span>}
                      </span>
                      <span className={'aparelho-quando' + (a.online ? ' on' : '')}>
                        {a.online ? 'online agora' : a.visto ? `visto ${haQuanto(agora - a.visto)}` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
