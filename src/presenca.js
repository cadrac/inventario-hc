// Presença: cada aparelho avisa, a cada 1 minuto, que está com o app aberto.
// Fica numa coleção separada (presenca/{uid}) e guarda só nome, tipo de aparelho
// e a hora — nada de IP, localização ou outro dado pessoal.
import { useEffect } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const INTERVALO_MS = 60 * 1000;
export const ONLINE_ATE_MS = 3 * 60 * 1000; // visto nos últimos 3 min = online

/** "Android · Chrome", "iPhone · Safari", "Windows · Edge"... */
export function descreverAparelho(ua = navigator.userAgent) {
  const so = /iPad/.test(ua)
    ? 'iPad'
    : /iPhone|iPod/.test(ua)
      ? 'iPhone'
      : /Android/.test(ua)
        ? 'Android'
        : /CrOS/.test(ua)
          ? 'Chromebook'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Mac OS X|Macintosh/.test(ua)
              ? 'Mac'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'Outro';
  const nav = /Edg\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser/.test(ua)
      ? 'Samsung Internet'
      : /OPR\/|Opera/.test(ua)
        ? 'Opera'
        : /Firefox|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari/.test(ua)
              ? 'Safari'
              : 'Navegador';
  return `${so} · ${nav}`;
}

/**
 * Enquanto a tela principal está aberta, avisa que este aparelho está online
 * e qual cômodo está sendo auditado. Ao trocar de cômodo, avisa na hora.
 */
export function usePresenca(nome, comodo) {
  useEffect(() => {
    function avisar() {
      const uid = auth.currentUser?.uid;
      // Sem internet ou com a aba escondida não avisa (não acumula gravações na fila).
      if (!uid || !navigator.onLine || document.visibilityState !== 'visible') return;
      setDoc(doc(db, 'presenca', uid), {
        nome,
        aparelho: descreverAparelho(),
        comodo: comodo || null,
        vistoEm: serverTimestamp(),
      }).catch((e) => console.warn('Presença não enviada:', e.code || e.message));
    }
    avisar();
    const t = setInterval(avisar, INTERVALO_MS);
    const visivel = () => document.visibilityState === 'visible' && avisar();
    document.addEventListener('visibilitychange', visivel);
    window.addEventListener('online', avisar);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', visivel);
      window.removeEventListener('online', avisar);
    };
  }, [nome, comodo]);
}
