import { useEffect, useMemo, useState } from 'react';
import { useItens } from '../useItens.js';
import { guardar } from '../util.js';
import { usandoEmulador } from '../firebase.js';
import BotaoTema from './BotaoTema.jsx';
import SeletorComodo from './SeletorComodo.jsx';
import ListaItens from './ListaItens.jsx';
import ModalItem from './ModalItem.jsx';
import StatusConexao from './StatusConexao.jsx';

export default function Principal({ nome, tema, alternarTema, trocarPessoa }) {
  const { itens, comodos, proximoNumero, pendentes, carregando, erro, doCache } = useItens();
  const [comodoId, setComodoId] = useState(() => guardar.ler('inventario.comodo'));
  const [modal, setModal] = useState(null); // { item } para editar, { novo: true } para adicionar
  const [soPendentes, setSoPendentes] = useState(false);
  const [aviso, setAviso] = useState('');
  const [exportando, setExportando] = useState(false);

  useEffect(() => guardar.gravar('inventario.comodo', comodoId), [comodoId]);

  const comodo = comodos?.find((c) => c.id === comodoId) || null;
  const doComodo = useMemo(
    () => (itens || []).filter((i) => i.comodoId === comodoId && (!soPendentes || !i.conferido)),
    [itens, comodoId, soPendentes],
  );

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function exportar() {
    setExportando(true);
    try {
      const { baixarPlanilha } = await import('../exportar-navegador.js');
      await baixarPlanilha(itens);
      setAviso('Planilha exportada.');
    } catch (e) {
      console.error(e);
      setAviso('Erro ao exportar: ' + e.message);
    } finally {
      setExportando(false);
    }
  }

  const totalGeral = itens?.length || 0;
  const conferidosGeral = itens?.filter((i) => i.conferido).length || 0;

  return (
    <div className="principal">
      <header className="topo">
        <div className="topo-barra">
          <div className="pessoa-atual">
            <span className="avatar" aria-hidden="true">
              {nome[0]}
            </span>
            <div>
              <strong>{nome}</strong>
              <button type="button" className="link" onClick={trocarPessoa}>
                trocar pessoa
              </button>
            </div>
          </div>
          <div className="topo-acoes">
            <StatusConexao pendentes={pendentes || 0} doCache={doCache} />
            <BotaoTema tema={tema} alternar={alternarTema} />
          </div>
        </div>

        <div className="topo-comodo">
          <SeletorComodo comodos={comodos || []} valor={comodoId} aoEscolher={setComodoId} />
        </div>
      </header>

      <main className="conteudo">
        {erro ? (
          <div className="mensagem erro">
            <p>
              {erro.code === 'permission-denied'
                ? 'Sem permissão para ver os itens. Entre de novo com o código do grupo.'
                : 'Erro ao carregar: ' + erro.message}
            </p>
            <button className="botao primario" onClick={trocarPessoa}>
              Entrar de novo
            </button>
          </div>
        ) : carregando ? (
          <div className="mensagem">Carregando itens…</div>
        ) : itens.length === 0 ? (
          <div className="mensagem">
            Nenhum item no banco ainda. Rode a importação da planilha (veja o README).
          </div>
        ) : !comodo ? (
          <div className="mensagem">
            <p>
              <strong>Escolha seu cômodo</strong> no seletor acima para ver os itens.
            </p>
            <p className="sub">
              {conferidosGeral} de {totalGeral} itens conferidos no total.
            </p>
          </div>
        ) : (
          <>
            <div className="lista-cabecalho">
              <div>
                <h2>{comodo.nome}</h2>
                <div className="progresso" aria-label={`${comodo.conferidos} de ${comodo.total} conferidos`}>
                  <div className="progresso-barra">
                    <div style={{ width: `${(comodo.conferidos / comodo.total) * 100}%` }} />
                  </div>
                  <span>
                    {comodo.conferidos} de {comodo.total} conferidos
                  </span>
                </div>
              </div>
              <label className="filtro">
                <input type="checkbox" checked={soPendentes} onChange={(e) => setSoPendentes(e.target.checked)} />
                Só não conferidos
              </label>
            </div>

            <ListaItens itens={doComodo} aoEditar={(item) => setModal({ item })} />

            <div className="rodape-acoes">
              <button type="button" className="botao adicionar grande" onClick={() => setModal({ novo: true })}>
                + Adicionar objeto a esta área
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="rodape">
        <span className="sub">
          {conferidosGeral} de {totalGeral} conferidos no total
          {usandoEmulador && ' · modo de teste (emulador)'}
        </span>
        <button type="button" className="botao secundario" onClick={exportar} disabled={!itens?.length || exportando}>
          {exportando ? 'Gerando…' : 'Exportar planilha'}
        </button>
      </footer>

      {modal && comodo && (
        <ModalItem
          item={modal.item}
          comodo={comodo}
          nome={nome}
          numeroPrevisto={proximoNumero}
          fechar={() => setModal(null)}
          avisar={setAviso}
        />
      )}

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
