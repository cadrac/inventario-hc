import { useEffect, useMemo, useState } from 'react';
import { useItens } from '../useItens.js';
import { guardar } from '../util.js';
import { usandoEmulador } from '../firebase.js';
import BotaoTema from './BotaoTema.jsx';
import SeletorComodo from './SeletorComodo.jsx';
import ListaItens from './ListaItens.jsx';
import ModalItem from './ModalItem.jsx';
import StatusConexao from './StatusConexao.jsx';
import Lixeira from './Lixeira.jsx';
import Historico from './Historico.jsx';
import Equipe from './Equipe.jsx';
import { usePresenca } from '../presenca.js';
import NomeComodo from './NomeComodo.jsx';

export default function Principal({ nome, tema, alternarTema, trocarPessoa }) {
  const { itens, excluidos, comodos, proximoNumero, pendentes, carregando, erro, doCache } = useItens();
  const [comodoId, setComodoId] = useState(() => guardar.ler('inventario.comodo'));
  const [aba, setAba] = useState('itens'); // itens | lixeira | historico
  const [modal, setModal] = useState(null); // { item } para editar, { novo: true } para adicionar
  const [soPendentes, setSoPendentes] = useState(false);
  const [aviso, setAviso] = useState('');
  const [exportando, setExportando] = useState(false);

  useEffect(() => guardar.gravar('inventario.comodo', comodoId), [comodoId]);

  const comodo = comodos?.find((c) => c.id === comodoId) || null;
  usePresenca(nome, comodo?.nome);
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
      await baixarPlanilha(itens, excluidos);
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

  function conteudoItens() {
    if (!comodo) {
      return (
        <div className="mensagem">
          <p>
            <strong>Escolha seu cômodo</strong> no seletor acima para ver os itens.
          </p>
          <p className="sub">
            {conferidosGeral} de {totalGeral} itens conferidos no total.
          </p>
        </div>
      );
    }
    return (
      <>
        <div className="lista-cabecalho">
          <div className="lista-titulo">
            <h2><NomeComodo nome={comodo.nome} /></h2>
            <div className="progresso" aria-label={`${comodo.conferidos} de ${comodo.total} conferidos`}>
              <div className="progresso-barra">
                <div style={{ width: `${comodo.total ? (comodo.conferidos / comodo.total) * 100 : 0}%` }} />
              </div>
              <span>
                {comodo.conferidos} de {comodo.total} conferidos
              </span>
            </div>
          </div>
          <button
            type="button"
            className="botao adicionar"
            onClick={() => setModal({ novo: true })}
            aria-label={`Adicionar objeto em ${comodo.nome}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="rotulo-adicionar">Adicionar ao cômodo</span>
          </button>
        </div>

        <label className="filtro">
          <input type="checkbox" checked={soPendentes} onChange={(e) => setSoPendentes(e.target.checked)} />
          Só não conferidos
        </label>

        <ListaItens
          itens={doComodo}
          aoEditar={(item) => setModal({ item })}
          vazio={
            comodo.extra && !soPendentes
              ? 'Aqui entram objetos que estão em lugares que não existem na lista de cômodos. Toque no + para adicionar e escreva nas observações onde o objeto está.'
              : undefined
          }
        />
      </>
    );
  }

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
          <SeletorComodo
            comodos={comodos || []}
            valor={comodoId}
            aoEscolher={(id) => {
              setComodoId(id);
              setAba('itens');
            }}
          />
        </div>

        <nav className="abas" aria-label="Seções">
          {[
            ['itens', 'Itens'],
            ['historico', 'Histórico'],
            ['lixeira', `Lixeira${excluidos?.length ? ` (${excluidos.length})` : ''}`],
            ['equipe', 'Equipe'],
          ].map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              className={'aba' + (aba === id ? ' ativa' : '')}
              aria-current={aba === id ? 'page' : undefined}
              onClick={() => setAba(id)}
            >
              {rotulo}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">
        {erro ? (
          <div className="mensagem erro">
            <p>
              {erro.code === 'permission-denied'
                ? 'Sem permissão para ver os itens. Seu código pode ter sido trocado: entre de novo com o seu código.'
                : 'Erro ao carregar: ' + erro.message}
            </p>
            <button className="botao primario" onClick={trocarPessoa}>
              Entrar de novo
            </button>
          </div>
        ) : carregando ? (
          <div className="mensagem">Carregando itens…</div>
        ) : aba === 'lixeira' ? (
          <Lixeira excluidos={excluidos} nome={nome} avisar={setAviso} />
        ) : aba === 'historico' ? (
          <Historico comodoAtual={comodo} />
        ) : aba === 'equipe' ? (
          <Equipe />
        ) : itens.length === 0 && !excluidos.length ? (
          <div className="mensagem">Nenhum item no banco ainda. Rode a importação da planilha (veja o README).</div>
        ) : (
          conteudoItens()
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
