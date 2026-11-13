import { useEffect, useRef, useState } from 'react';
import { normalizarBusca } from '../util.js';

/** Seletor "Escolha seu cômodo" com busca. */
export default function SeletorComodo({ comodos, valor, aoEscolher }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const raiz = useRef(null);
  const campo = useRef(null);
  const atual = comodos.find((c) => c.id === valor);

  useEffect(() => {
    if (!aberto) return;
    campo.current?.focus();
    const fora = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    };
    const esc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const termo = normalizarBusca(busca);
  const filtrados = comodos.filter((c) => normalizarBusca(c.nome).includes(termo));

  function escolher(id) {
    aoEscolher(id);
    setAberto(false);
    setBusca('');
  }

  return (
    <div className="seletor" ref={raiz}>
      <span className="seletor-rotulo" id="rotulo-comodo">
        Escolha seu cômodo
      </span>
      <button
        type="button"
        className="seletor-botao"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-labelledby="rotulo-comodo"
        onClick={() => setAberto((a) => !a)}
      >
        <span className="seletor-valor">{atual ? atual.nome : 'Selecione…'}</span>
        {atual && (
          <span className={'contador' + (atual.conferidos === atual.total ? ' completo' : '')}>
            {atual.conferidos}/{atual.total}
          </span>
        )}
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {aberto && (
        <div className="seletor-painel">
          <input
            ref={campo}
            type="search"
            className="seletor-busca"
            placeholder="Buscar cômodo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtrados.length) escolher(filtrados[0].id);
            }}
          />
          <ul role="listbox" className="seletor-lista">
            {filtrados.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.id === valor}
                  className={'seletor-opcao' + (c.id === valor ? ' ativa' : '')}
                  onClick={() => escolher(c.id)}
                >
                  <span>{c.nome}</span>
                  <span className={'contador' + (c.conferidos === c.total ? ' completo' : '')}>
                    {c.conferidos}/{c.total}
                  </span>
                </button>
              </li>
            ))}
            {!filtrados.length && <li className="seletor-vazio">Nenhum cômodo encontrado</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
