import { useEffect, useState } from 'react';
import { formatarValor, quando } from '../util.js';
import { SeloConservacao } from './Conservacao.jsx';

function useLargo() {
  const consulta = '(min-width: 900px)';
  const [largo, setLargo] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const f = () => setLargo(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return largo;
}

function Numero({ item }) {
  if (item.numero == null) return <span className="sem-numero">s/nº</span>;
  return (
    <>
      {item.numero}
      {item.novo && <span className="etiqueta novo">{item.numeroProvisorio ? 'novo · provisório' : 'novo'}</span>}
    </>
  );
}

function Conservacao({ item }) {
  return (
    <div className="conservacao-par">
      <span className="rotulo-mini">Original</span>
      <SeloConservacao letra={item.conservacaoOriginal} apagado />
      <span className="seta" aria-hidden="true">→</span>
      <span className="rotulo-mini">11/2026</span>
      <SeloConservacao letra={item.conservacaoNova} />
    </div>
  );
}

function Situacao({ item }) {
  if (item.pendente) return <span className="situacao pendente">Salvo no aparelho · aguardando envio</span>;
  if (item.conferido)
    return (
      <span className="situacao conferido">
        ✓ Conferido · editado por {item.editadoPor} {quando(item.editadoEm?.toDate?.())}
      </span>
    );
  return <span className="situacao a-conferir">Não conferido</span>;
}

export default function ListaItens({ itens, aoEditar }) {
  const largo = useLargo();

  if (!itens.length) {
    return <div className="lista vazia">Nenhum item para mostrar neste cômodo.</div>;
  }

  if (largo) {
    return (
      <div className="lista" tabIndex={0} aria-label="Itens do cômodo">
        <table className="tabela">
          <thead>
            <tr>
              <th>Item</th>
              <th>Especificação</th>
              <th>Qtd</th>
              <th>Nº de série</th>
              <th>Data de aquisição</th>
              <th>Conservação</th>
              <th className="num">Valor total</th>
              <th>Observações</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className={it.conferido ? 'conferido' : ''}>
                <td className="col-item">
                  <Numero item={it} />
                </td>
                <td>
                  <div className="espec">{it.especificacao}</div>
                  <Situacao item={it} />
                </td>
                <td className="mono">{it.qtd || "—"}</td>
                <td>{it.serie || '—'}</td>
                <td className="data">{it.dataAquisicao || "—"}</td>
                <td>
                  <Conservacao item={it} />
                </td>
                <td className="num">{formatarValor(it.valor)}</td>
                <td>{it.observacoes || '—'}</td>
                <td>
                  <button type="button" className="botao editar" onClick={() => aoEditar(it)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="lista" tabIndex={0} aria-label="Itens do cômodo">
      <ul className="cartoes">
        {itens.map((it) => (
          <li key={it.id} className={'cartao' + (it.conferido ? ' conferido' : '')}>
            <div className="cartao-topo">
              <span className="cartao-numero">
                Item <Numero item={it} />
              </span>
              <button type="button" className="botao editar" onClick={() => aoEditar(it)}>
                Editar
              </button>
            </div>
            <div className="espec">{it.especificacao}</div>
            <Situacao item={it} />
            <dl className="cartao-dados">
              <div>
                <dt>Qtd</dt>
                <dd className="mono">{it.qtd || "—"}</dd>
              </div>
              <div>
                <dt>Nº de série</dt>
                <dd>{it.serie || '—'}</dd>
              </div>
              <div>
                <dt>Aquisição</dt>
                <dd className="data">{it.dataAquisicao || "—"}</dd>
              </div>
              <div>
                <dt>Valor total</dt>
                <dd className="mono">{formatarValor(it.valor)}</dd>
              </div>
              <div className="largo">
                <dt>Conservação</dt>
                <dd>
                  <Conservacao item={it} />
                </dd>
              </div>
              {it.observacoes && (
                <div className="largo">
                  <dt>Observações</dt>
                  <dd>{it.observacoes}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
