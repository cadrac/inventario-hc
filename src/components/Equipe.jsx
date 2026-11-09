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
  const { aparelhos, carregando, agora } = usePresencas();

  // Só as sessões ativas (app aberto agora). Sessões antigas não aparecem.
  const pessoas = useMemo(
    () =>
      PESSOAS.map((nome) => {
        const deles = aparelhos.filter((a) => a.nome === nome);
        const ativas = deles.filter((a) => a.online).sort((a, b) => b.este - a.este || b.visto - a.visto);
        const ultimo = Math.max(0, ...deles.map((a) => a.visto));
        return { nome, ativas, online: ativas.length > 0, ultimo, nunca: deles.length === 0 };
      }).sort((a, b) => b.online - a.online || b.ultimo - a.ultimo),
    [aparelhos],
  );
  const pessoasOnline = pessoas.filter((p) => p.online).length;

  return (
    <section className="painel" aria-labelledby="titulo-equipe">
      <div className="painel-cabecalho">
        <h2 id="titulo-equipe">Equipe</h2>
        <p className="sub">
          {carregando
            ? 'Carregando…'
            : `${pessoasOnline} de ${PESSOAS.length} ${pessoasOnline === 1 ? 'pessoa online' : 'pessoas online'} agora.`}
        </p>
      </div>

      <div className="lista" tabIndex={0} aria-label="Pessoas da equipe">
        <ul className="equipe">
          {pessoas.flatMap((p) =>
            p.online
              ? // Uma linha por sessão ativa: "● Pedro · Cozinha"  ...  aparelho (discreto, à direita)
                p.ativas.map((a) => (
                  <li key={a.uid} className="membro">
                    <span className="bolinha on" aria-hidden="true" />
                    <span className="membro-texto">
                      <strong>{p.nome}</strong>
                      <span className="ponto" aria-hidden="true">
                        ·
                      </span>
                      {a.comodo ? (
                        <span className="selo-comodo" title={a.comodo}>
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
                          </svg>
                          <span className="selo-comodo-nome">{a.comodo}</span>
                        </span>
                      ) : (
                        <span className="sub">escolhendo o cômodo</span>
                      )}
                    </span>
                    <span className="membro-aparelho" title="Sistema e navegador desta sessão">
                      {a.aparelho}
                      {a.este && <span className="etiqueta novo">você</span>}
                    </span>
                  </li>
                ))
              : [
                  <li key={p.nome} className="membro off">
                    <span className="bolinha" aria-hidden="true" />
                    <span className="membro-texto">
                      <strong>{p.nome}</strong>
                      <span className="ponto" aria-hidden="true">
                        ·
                      </span>
                      <span className="sub">{p.nunca ? 'ainda não abriu o app' : `offline, visto ${haQuanto(agora - p.ultimo)}`}</span>
                    </span>
                  </li>,
                ],
          )}
        </ul>
      </div>
    </section>
  );
}
