import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.js';
import { PESSOAS, quando } from '../util.js';

export const TIPOS = {
  conferencia: { verbo: 'conferiu', rotulo: 'Conferência' },
  edicao: { verbo: 'editou', rotulo: 'Edição' },
  adicao: { verbo: 'adicionou', rotulo: 'Adição' },
  exclusao: { verbo: 'excluiu', rotulo: 'Exclusão' },
  restauracao: { verbo: 'restaurou', rotulo: 'Restauração' },
};

/** Histórico (log) de tudo o que foi feito: quem, quando e o quê. */
export default function Historico({ comodoAtual }) {
  const [entradas, setEntradas] = useState(null);
  const [erro, setErro] = useState(null);
  const [pessoa, setPessoa] = useState('');
  const [tipo, setTipo] = useState('');
  const [soComodo, setSoComodo] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'historico'), orderBy('em', 'desc'), limit(1000)),
        (snap) => setEntradas(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }), pendente: d.metadata.hasPendingWrites }))),
        (e) => {
          console.error(e);
          setErro(e);
        },
      ),
    [],
  );

  const filtradas = useMemo(
    () =>
      (entradas || []).filter(
        (e) => (!pessoa || e.por === pessoa) && (!tipo || e.tipo === tipo) && (!soComodo || e.comodo === comodoAtual?.nome),
      ),
    [entradas, pessoa, tipo, soComodo, comodoAtual],
  );

  return (
    <section className="painel" aria-labelledby="titulo-historico">
      <div className="painel-cabecalho">
        <h2 id="titulo-historico">Histórico</h2>
        <div className="filtros">
          <select value={pessoa} onChange={(e) => setPessoa(e.target.value)} aria-label="Filtrar por pessoa">
            <option value="">Todas as pessoas</option>
            {PESSOAS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todas as ações</option>
            {Object.entries(TIPOS).map(([k, t]) => (
              <option key={k} value={k}>
                {t.rotulo}
              </option>
            ))}
          </select>
          {comodoAtual && (
            <label className="filtro">
              <input type="checkbox" checked={soComodo} onChange={(e) => setSoComodo(e.target.checked)} />
              Só {comodoAtual.nome}
            </label>
          )}
        </div>
      </div>

      {erro ? (
        <div className="mensagem erro">Erro ao carregar o histórico: {erro.message}</div>
      ) : !entradas ? (
        <div className="mensagem">Carregando…</div>
      ) : !filtradas.length ? (
        <div className="lista vazia">Nada registrado{pessoa || tipo || soComodo ? ' com esses filtros' : ' ainda'}.</div>
      ) : (
        <div className="lista" tabIndex={0} aria-label="Registros do histórico">
          <ol className="log">
            {filtradas.map((e) => (
              <li key={e.id} className={`log-item t-${e.tipo}`}>
                <div className="log-linha">
                  <span className={`log-tipo t-${e.tipo}`}>{TIPOS[e.tipo]?.rotulo || e.tipo}</span>
                  <span className="log-quando">{e.pendente ? 'aguardando envio' : quando(e.em?.toDate?.())}</span>
                </div>
                <div>
                  <strong>{e.por}</strong> {TIPOS[e.tipo]?.verbo || e.tipo} o item <span className="mono">{e.numero ?? 's/nº'}</span>{' '}
                  — {e.especificacao}
                </div>
                <div className="sub">{e.comodo}</div>
                {e.mudancas?.length > 0 && (
                  <ul className="log-mudancas">
                    {e.mudancas.map((m, i) => (
                      <li key={i}>
                        <span className="log-campo">{m.campo}:</span> <span className="de">{m.de}</span> → <span className="para">{m.para}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {e.tipo === 'conferencia' && !e.mudancas?.length && <div className="sub">Sem alterações.</div>}
                {e.motivo && <div className="motivo">Motivo: {e.motivo}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
