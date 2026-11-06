import { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, usandoEmulador } from '../firebase.js';
import { PESSOAS } from '../util.js';
import BotaoTema from './BotaoTema.jsx';

const esperar = (promessa, ms) =>
  Promise.race([
    promessa,
    new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms)),
  ]);

export default function Entrada({ tema, alternarTema, nomeAtual, podeVoltar, voltar, aoEntrar }) {
  const [nome, setNome] = useState(nomeAtual || '');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    if (!nome) return setErro('Escolha o seu nome.');
    if (!codigo.trim()) return setErro('Digite o código de acesso do grupo.');
    setEnviando(true);
    try {
      const usuario = auth.currentUser || (await esperar(signInAnonymously(auth), 15000)).user;
      // A regra do Firestore só aceita este documento se o código estiver certo.
      await esperar(
        setDoc(doc(db, 'membros', usuario.uid), { codigo: codigo.trim(), nome, entrouEm: serverTimestamp() }),
        15000,
      );
      aoEntrar(nome, usuario.uid);
    } catch (err) {
      console.error(err);
      if (err.code === 'permission-denied') setErro('Código incorreto. Confira com o grupo.');
      else if (err.code === 'timeout' || err.code === 'unavailable' || err.code === 'auth/network-request-failed')
        setErro('Sem conexão. Para entrar pela primeira vez é preciso internet.');
      else setErro('Não foi possível entrar: ' + (err.message || err.code));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="entrada">
      <div className="entrada-topo">
        <BotaoTema tema={tema} alternar={alternarTema} />
      </div>
      <form className="entrada-cartao" onSubmit={entrar}>
        <img src="/icone.svg" alt="" width="56" height="56" />
        <h1>Inventário de Bens</h1>
        <p className="sub">Organização Social Hora da Criança · Salvador</p>

        <fieldset className="pessoas">
          <legend>Quem é você?</legend>
          {PESSOAS.map((p) => (
            <label key={p} className={'pessoa-opcao' + (nome === p ? ' ativa' : '')}>
              <input type="radio" name="nome" value={p} checked={nome === p} onChange={() => setNome(p)} />
              {p}
            </label>
          ))}
        </fieldset>

        <label className="campo">
          <span>Código de acesso do grupo</span>
          <input
            type="password"
            autoComplete="off"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Digite o código"
          />
        </label>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button className="botao primario grande" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        {podeVoltar && (
          <button type="button" className="botao secundario" onClick={voltar}>
            Voltar
          </button>
        )}
        {usandoEmulador && <p className="aviso-emulador">Modo de teste (emulador local)</p>}
      </form>
    </div>
  );
}
