import { restaurarItem } from '../acoes.js';
import { formatarValor, quando } from '../util.js';

export default function Lixeira({ excluidos, nome, avisar }) {
  function restaurar(it) {
    const rotulo = `item ${it.numero ?? 's/nº'}`;
    if (!window.confirm(`Restaurar o ${rotulo} (${it.especificacao}) para "${it.comodo}"?`)) return;
    restaurarItem(it, nome).catch((e) => avisar('Não foi possível restaurar: ' + (e.code || e.message)));
    avisar(`${rotulo[0].toUpperCase() + rotulo.slice(1)} restaurado.`);
  }

  return (
    <section className="painel" aria-labelledby="titulo-lixeira">
      <div className="painel-cabecalho">
        <h2 id="titulo-lixeira">Lixeira</h2>
        <p className="sub">
          {excluidos.length
            ? `${excluidos.length} ${excluidos.length === 1 ? 'item excluído' : 'itens excluídos'}. Itens na lixeira não entram na planilha exportada.`
            : 'Nenhum item excluído.'}
        </p>
      </div>
      {excluidos.length > 0 && (
        <div className="lista" tabIndex={0} aria-label="Itens excluídos">
          <ul className="cartoes">
            {excluidos.map((it) => (
              <li key={it.id} className="cartao excluido">
                <div className="cartao-topo">
                  <span className="cartao-numero">
                    Item {it.numero ?? 's/nº'}
                    {it.novo && <span className="etiqueta novo">novo</span>}
                  </span>
                  <button type="button" className="botao secundario" onClick={() => restaurar(it)}>
                    Restaurar
                  </button>
                </div>
                <div className="espec">{it.especificacao}</div>
                <div className="sub">
                  {it.comodo} · Qtd <span className="mono">{it.qtd || '—'}</span> · <span className="mono">{formatarValor(it.valor)}</span>
                </div>
                <div className="situacao excluido-info">
                  {it.pendente ? 'Excluído neste aparelho · aguardando envio' : `Excluído por ${it.excluidoPor} ${quando(it.excluidoEm?.toDate?.())}`}
                </div>
                {it.motivoExclusao && <div className="motivo">Motivo: {it.motivoExclusao}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
