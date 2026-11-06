import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { guardar } from './util.js';
import { useTema } from './tema.js';
import Entrada from './components/Entrada.jsx';
import Principal from './components/Principal.jsx';

export default function App() {
  const [tema, alternarTema] = useTema();
  const [usuario, setUsuario] = useState(undefined); // undefined = carregando
  const [nome, setNome] = useState(() => guardar.ler('inventario.nome'));
  const [membro, setMembro] = useState(() => guardar.ler('inventario.membro'));
  const [trocando, setTrocando] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUsuario(u)), []);

  if (usuario === undefined) {
    return <div className="carregando">Carregando…</div>;
  }

  const liberado = usuario && nome && membro === usuario.uid && !trocando;

  if (!liberado) {
    return (
      <Entrada
        tema={tema}
        alternarTema={alternarTema}
        nomeAtual={nome}
        podeVoltar={trocando}
        voltar={() => setTrocando(false)}
        aoEntrar={(novoNome, uid) => {
          guardar.gravar('inventario.nome', novoNome);
          guardar.gravar('inventario.membro', uid);
          setNome(novoNome);
          setMembro(uid);
          setTrocando(false);
        }}
      />
    );
  }

  return (
    <Principal
      nome={nome}
      tema={tema}
      alternarTema={alternarTema}
      trocarPessoa={() => setTrocando(true)}
    />
  );
}
