import { useEffect, useState } from 'react';
import { guardar } from './util.js';

const CHAVE = 'inventario.tema';
const sistema = () =>
  window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';

/** Segue o tema do aparelho até a pessoa escolher; depois lembra a escolha. */
export function useTema() {
  const [tema, setTema] = useState(() => {
    const t = guardar.ler(CHAVE);
    return t === 'claro' || t === 'escuro' ? t : sistema();
  });

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const mudou = () => {
      if (!guardar.ler(CHAVE)) setTema(sistema());
    };
    mq.addEventListener('change', mudou);
    return () => mq.removeEventListener('change', mudou);
  }, []);

  const alternar = () => {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    guardar.gravar(CHAVE, novo);
    setTema(novo);
  };

  return [tema, alternar];
}
