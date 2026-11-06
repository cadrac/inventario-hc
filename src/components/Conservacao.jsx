import { CONSERVACAO, nomeConservacao } from '../util.js';

export function SeloConservacao({ letra, apagado }) {
  if (!letra) return <span className="selo vazio" title="Sem informação">—</span>;
  return (
    <span className={`selo c-${letra}` + (apagado ? ' apagado' : '')} title={nomeConservacao(letra)}>
      {letra} <small>{nomeConservacao(letra)}</small>
    </span>
  );
}

/** Os 5 botões O, B, R, P, I (um campo só). */
export function BotoesConservacao({ valor, aoMudar }) {
  return (
    <div className="botoes-conservacao" role="radiogroup" aria-label="Conservação atual">
      {CONSERVACAO.map(({ letra, nome }) => (
        <button
          key={letra}
          type="button"
          role="radio"
          aria-checked={valor === letra}
          aria-label={`${letra} – ${nome}`}
          className={`botao-cons c-${letra}` + (valor === letra ? ' marcado' : '')}
          onClick={() => aoMudar(letra)}
        >
          <span className="letra">{letra}</span>
          <span className="nome">{nome}</span>
        </button>
      ))}
    </div>
  );
}
