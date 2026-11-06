import { useEffect, useState } from 'react';

export default function StatusConexao({ pendentes, doCache }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  let classe = 'ok';
  let texto = 'Sincronizado';
  if (!online || doCache) {
    classe = 'offline';
    texto = pendentes ? `Sem conexão · ${pendentes} a enviar` : 'Sem conexão';
  } else if (pendentes) {
    classe = 'enviando';
    texto = `Enviando ${pendentes}…`;
  }
  return (
    <span
      className={'status ' + classe}
      role="status"
      aria-label={texto}
      title="As alterações ficam salvas no aparelho e são enviadas quando a internet voltar."
    >
      <span className="status-ponto" aria-hidden="true" />
      {texto}
    </span>
  );
}
