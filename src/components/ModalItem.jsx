import { useEffect, useRef, useState } from 'react';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { lerValor, nomeConservacao, valorParaCampo } from '../util.js';
import { BotoesConservacao, SeloConservacao } from './Conservacao.jsx';

/** Modal de editar (item) ou adicionar (item vazio). */
export default function ModalItem({ item, comodo, nome, numeroPrevisto, fechar, avisar }) {
  const novo = !item;
  const [f, setF] = useState(() => ({
    especificacao: item?.especificacao || '',
    qtd: item?.qtd || (novo ? '1' : ''),
    serie: item?.serie || '',
    valor: valorParaCampo(item?.valor),
    observacoes: item?.observacoes || '',
    conservacaoNova: item?.conservacaoNova || null,
  }));
  const [erros, setErros] = useState({});
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;

  const mudar = (campo) => (e) => setF((v) => ({ ...v, [campo]: e.target.value }));

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && fecharRef.current();
    document.addEventListener('keydown', esc);
    document.body.classList.add('sem-rolagem');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('sem-rolagem');
    };
  }, []);

  function salvar(e) {
    e.preventDefault();
    const valor = lerValor(f.valor);
    const errosNovos = {};
    if (!f.especificacao.trim()) errosNovos.especificacao = 'Descreva o objeto.';
    if (!f.conservacaoNova) errosNovos.conservacao = 'Marque a conservação atual.';
    if (Number.isNaN(valor)) errosNovos.valor = 'Valor inválido. Use, por exemplo, 1.250,00';
    setErros(errosNovos);
    if (Object.keys(errosNovos).length) return;

    const dados = {
      especificacao: f.especificacao.trim(),
      qtd: f.qtd.trim(),
      serie: f.serie.trim(),
      valor,
      observacoes: f.observacoes.trim(),
      conservacaoNova: f.conservacaoNova,
      conferido: true,
      editadoPor: nome,
      editadoEm: serverTimestamp(),
    };

    // Não esperamos o servidor: com internet fraca, a gravação fica no aparelho
    // e é enviada sozinha quando a conexão voltar.
    const falhou = (err) => {
      console.error(err);
      avisar('Não foi possível salvar no servidor: ' + (err.code || err.message));
    };
    if (novo) {
      const ref = doc(collection(db, 'itens'));
      setDoc(ref, {
        ...dados,
        novo: true,
        numero: null,
        comodo: comodo.nome,
        comodoId: comodo.id,
        setorOriginal: comodo.nome,
        dataAquisicao: '',
        conservacaoOriginal: null,
        criadoPor: nome,
        criadoEm: serverTimestamp(),
      }).catch(falhou);
      avisar('Objeto adicionado.');
    } else {
      updateDoc(doc(db, 'itens', item.id), dados).catch(falhou);
      avisar(`Item ${item.numero ?? 's/nº'} salvo.`);
    }
    fechar();
  }

  const titulo = novo ? 'Adicionar objeto' : `Editar item ${item.numero ?? 's/nº'}`;

  return (
    <div className="modal-fundo" onPointerDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onSubmit={salvar}>
        <div className="modal-cabecalho">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="modal-corpo">
          <dl className="somente-leitura">
            <div>
              <dt>Item</dt>
              <dd>{novo ? `${numeroPrevisto} (previsto)` : item.numero ?? 's/nº'}</dd>
            </div>
            <div>
              <dt>Cômodo</dt>
              <dd>{comodo.nome}</dd>
            </div>
            <div>
              <dt>Data de aquisição</dt>
              <dd>{novo ? '—' : item.dataAquisicao || '—'}</dd>
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
              <input type="text" value={f.qtd} onChange={mudar('qtd')} placeholder="ex.: 2, 10mil, 15cx" />
            </label>
            <label className="campo">
              <span>Nº de série</span>
              <input type="text" value={f.serie} onChange={mudar('serie')} />
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

          <label className="campo">
            <span>Valor total (R$)</span>
            <input type="text" inputMode="decimal" value={f.valor} onChange={mudar('valor')} placeholder="ex.: 1.250,00" />
            {erros.valor && <em className="erro">{erros.valor}</em>}
          </label>

          <label className="campo">
            <span>Observações</span>
            <textarea rows={2} value={f.observacoes} onChange={mudar('observacoes')} />
          </label>
        </div>

        <div className="modal-rodape">
          <button type="button" className="botao secundario" onClick={fechar}>
            Cancelar
          </button>
          <button type="submit" className="botao primario">
            {novo ? 'Adicionar' : 'Salvar e marcar conferido'}
          </button>
        </div>
      </form>
    </div>
  );
}
