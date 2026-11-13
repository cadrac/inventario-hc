import { useEffect, useRef, useState } from 'react';
import { adicionarItem, excluirItem, salvarEdicao } from '../acoes.js';
import { lerValor, nomeConservacao, valorParaCampo } from '../util.js';
import { BotoesConservacao, SeloConservacao } from './Conservacao.jsx';
import CampoValor from './CampoValor.jsx';

/** Modal de editar (item) ou adicionar (item vazio). */
export default function ModalItem({ item, comodo, nome, numeroPrevisto, fechar, avisar }) {
  const novo = !item;
  const [inicial] = useState(() => ({
    especificacao: item?.especificacao || '',
    qtd: item?.qtd || (novo ? '1' : ''),
    serie: item?.serie || '',
    valor: valorParaCampo(item?.valor),
    observacoes: item?.observacoes || '',
    conservacaoNova: item?.conservacaoNova || null,
  }));
  const [f, setF] = useState(inicial);
  const [erros, setErros] = useState({});
  const [excluindo, setExcluindo] = useState(false);
  const [motivo, setMotivo] = useState('');

  // Não perder o que foi digitado: pergunta antes de fechar com alterações.
  const alterado = Object.keys(inicial).some((k) => inicial[k] !== f[k]);
  const tentarFechar = () => {
    if (excluindo) return setExcluindo(false);
    if (!alterado || window.confirm('Descartar as alterações deste item?')) fechar();
  };
  const fecharRef = useRef(tentarFechar);
  fecharRef.current = tentarFechar;

  const mudar = (campo) => (e) => setF((v) => ({ ...v, [campo]: e.target.value }));
  const nomeItem = novo ? '' : `item ${item.numero ?? 's/nº'}`;

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && fecharRef.current();
    document.addEventListener('keydown', esc);
    document.body.classList.add('sem-rolagem');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('sem-rolagem');
    };
  }, []);

  const falhou = (err) => {
    console.error(err);
    avisar('Não foi possível salvar no servidor: ' + (err.code || err.message));
  };

  function salvar(e) {
    e.preventDefault();
    const valor = lerValor(f.valor);
    const errosNovos = {};
    if (!f.especificacao.trim()) errosNovos.especificacao = 'Descreva o objeto.';
    if (!f.conservacaoNova) errosNovos.conservacao = 'Marque a conservação atual.';
    if (Number.isNaN(valor)) errosNovos.valor = 'Valor inválido.';
    setErros(errosNovos);
    if (Object.keys(errosNovos).length) return;

    const campos = {
      especificacao: f.especificacao.trim(),
      qtd: f.qtd.trim(),
      serie: f.serie.trim(),
      valor,
      observacoes: f.observacoes.trim(),
      conservacaoNova: f.conservacaoNova,
    };
    if (novo) {
      adicionarItem(comodo, campos, nome, numeroPrevisto).catch(falhou);
      avisar('Objeto adicionado.');
    } else {
      salvarEdicao(item, campos, nome).catch(falhou);
      avisar(`${nomeItem[0].toUpperCase() + nomeItem.slice(1)} salvo.`);
    }
    fechar();
  }

  function confirmarExclusao() {
    const m = motivo.trim();
    if (m.length < 3) {
      setErros((x) => ({ ...x, motivo: 'Escreva o motivo da exclusão.' }));
      return;
    }
    excluirItem(item, nome, m.slice(0, 300)).catch(falhou);
    avisar(`${nomeItem[0].toUpperCase() + nomeItem.slice(1)} foi para a lixeira.`);
    fechar();
  }

  const titulo = novo ? 'Adicionar objeto' : `Editar ${nomeItem}`;

  return (
    <div className="modal-fundo" onPointerDown={(e) => e.target === e.currentTarget && tentarFechar()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onSubmit={salvar}>
        <div className="modal-cabecalho">
          <h2 id="modal-titulo">{excluindo ? `Excluir ${nomeItem}?` : titulo}</h2>
          <button type="button" className="botao-icone" onClick={tentarFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        {excluindo ? (
          <>
            <div className="modal-corpo">
              <div className="confirmar-exclusao">
                <p>
                  <strong>{item.especificacao}</strong>
                  <br />
                  <span className="sub">{comodo.nome}</span>
                </p>
                <p className="sub">
                  O item sai da lista e da planilha exportada, mas fica na <strong>Lixeira</strong>, de onde qualquer
                  pessoa do grupo pode restaurá-lo. A exclusão fica registrada no histórico.
                </p>
              </div>
              <label className="campo">
                <span>Motivo da exclusão (obrigatório)</span>
                <textarea
                  rows={2}
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (erros.motivo) setErros((x) => ({ ...x, motivo: undefined }));
                  }}
                  placeholder="ex.: lançado em duplicidade, item não existe mais…"
                  maxLength={300}
                  required
                  aria-invalid={!!erros.motivo}
                  autoFocus
                />
                {erros.motivo && <em className="erro">{erros.motivo}</em>}
              </label>
            </div>
            <div className="modal-rodape">
              <button type="button" className="botao secundario" onClick={() => setExcluindo(false)}>
                Voltar
              </button>
              <button type="button" className="botao perigo" onClick={confirmarExclusao}>
                Excluir item
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-corpo">
              <dl className="somente-leitura">
                <div>
                  <dt>Item</dt>
                  <dd className="mono">{novo ? `${numeroPrevisto} (previsto)` : item.numero ?? 's/nº'}</dd>
                </div>
                <div>
                  <dt>Cômodo</dt>
                  <dd>{comodo.nome}</dd>
                </div>
                <div>
                  <dt>Data de aquisição</dt>
                  <dd className="data">{novo ? '—' : item.dataAquisicao || '—'}</dd>
                </div>
              </dl>

              <label className="campo">
                <span>Especificação</span>
                <textarea rows={2} value={f.especificacao} onChange={mudar('especificacao')} />
                {erros.especificacao && <em className="erro">{erros.especificacao}</em>}
              </label>

              <div className="campos-lado">
                <label className="campo">
                  <span>Qtd</span>
                  <input type="text" className="mono" spellCheck={false} autoComplete="off" value={f.qtd} onChange={mudar('qtd')} placeholder="ex.: 2, 10mil, 15cx" />
                </label>
                <label className="campo">
                  <span>Nº de série</span>
                  <input type="text" className="mono" spellCheck={false} autoComplete="off" autoCapitalize="characters" value={f.serie} onChange={mudar('serie')} />
                </label>
              </div>

              <div className="campo">
                <span>Conservação atual (atualização 11/2026)</span>
                {!novo && (
                  <div className="referencia">
                    Original na planilha: <SeloConservacao letra={item.conservacaoOriginal} apagado />
                    {item.conservacaoOriginal && f.conservacaoNova !== item.conservacaoOriginal && (
                      <button
                        type="button"
                        className="link"
                        onClick={() => setF((v) => ({ ...v, conservacaoNova: item.conservacaoOriginal }))}
                      >
                        manter igual ({nomeConservacao(item.conservacaoOriginal)})
                      </button>
                    )}
                  </div>
                )}
                <BotoesConservacao valor={f.conservacaoNova} aoMudar={(l) => setF((v) => ({ ...v, conservacaoNova: l }))} />
                {erros.conservacao && <em className="erro">{erros.conservacao}</em>}
              </div>

              <div className="campo">
                <span>Valor total</span>
                <CampoValor valor={f.valor} aoMudar={(v) => setF((x) => ({ ...x, valor: v }))} invalido={!!erros.valor} />
                {erros.valor && <em className="erro">{erros.valor}</em>}
              </div>

              <label className="campo">
                <span>Observações</span>
                <textarea rows={2} value={f.observacoes} onChange={mudar('observacoes')} />
              </label>
            </div>

            <div className={'modal-rodape' + (novo ? '' : ' com-excluir')}>
              {!novo && (
                <button type="button" className="botao perigo-suave" onClick={() => setExcluindo(true)} aria-label={`Excluir ${nomeItem}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="texto-excluir">Excluir</span>
                </button>
              )}
              <button type="button" className="botao secundario" onClick={tentarFechar}>
                Cancelar
              </button>
              <button type="submit" className="botao primario">
                {novo ? 'Adicionar' : 'Salvar e conferir'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
