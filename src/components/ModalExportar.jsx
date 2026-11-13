import { useEffect, useRef, useState } from 'react';

/** Modal para escolher quais cômodos entram na planilha exportada. */
export default function ModalExportar({ comodos, atual, exportar, fechar }) {
  // Começa com todos marcados: o caso mais comum é exportar tudo.
  const [marcados, setMarcados] = useState(() => new Set(comodos.map((c) => c.id)));
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && fecharRef.current();
    document.addEventListener('keydown', esc);
    document.body.classList.add('sem-rolagem');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('sem-rolagem');
    };
  }, []);

  const alternar = (id) =>
    setMarcados((m) => {
      const n = new Set(m);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const todos = marcados.size === comodos.length;
  const itensMarcados = comodos.filter((c) => marcados.has(c.id)).reduce((s, c) => s + c.total, 0);
  const atualExiste = comodos.some((c) => c.id === atual);

  function enviar(e) {
    e.preventDefault();
    if (marcados.size) exportar(comodos.filter((c) => marcados.has(c.id)).map((c) => c.id));
  }

  return (
    <div className="modal-fundo" onPointerDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-exportar" onSubmit={enviar}>
        <div className="modal-cabecalho">
          <h2 id="titulo-exportar">Exportar planilha</h2>
          <button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="modal-corpo exportar">
          <p className="sub" style={{ margin: 0 }}>Escolha os cômodos que vão para a planilha.</p>
          <div className="exportar-atalhos">
            <button
              type="button"
              className="botao secundario"
              onClick={() => setMarcados(todos ? new Set() : new Set(comodos.map((c) => c.id)))}
            >
              {todos ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
            {atualExiste && (
              <button type="button" className="botao secundario" onClick={() => setMarcados(new Set([atual]))}>
                Só o meu cômodo
              </button>
            )}
            <span className="sub">
              {marcados.size} de {comodos.length}
            </span>
          </div>

          <ul className="exportar-lista">
            {comodos.map((c) => (
              <li key={c.id}>
                <label className="exportar-opcao">
                  <input type="checkbox" checked={marcados.has(c.id)} onChange={() => alternar(c.id)} />
                  <span className="nome">{c.nome}</span>
                  <span className={'contador' + (c.total && c.conferidos === c.total ? ' completo' : '')}>
                    {c.conferidos}/{c.total}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-rodape">
          <button type="button" className="botao secundario" onClick={fechar}>
            Cancelar
          </button>
          <button type="submit" className="botao primario" disabled={!marcados.size}>
            {!marcados.size
              ? 'Escolha um cômodo'
              : todos
                ? 'Exportar tudo'
                : `Exportar ${itensMarcados} ${itensMarcados === 1 ? 'item' : 'itens'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
