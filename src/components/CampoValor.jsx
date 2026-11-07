import { useLayoutEffect, useRef } from 'react';
import { lerValor, mascararValor, normalizarDecimal, valorParaCampo } from '../util.js';

/** Campo de valor em reais com pontos e vírgula aparecendo enquanto digita. */
export default function CampoValor({ valor, aoMudar, invalido }) {
  const ref = useRef(null);
  const cursor = useRef(null); // quantos dígitos/vírgula ficam antes do cursor

  // Depois de formatar, devolve o cursor para o mesmo ponto entre os dígitos.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || cursor.current == null || document.activeElement !== el) return;
    let n = cursor.current;
    let pos = 0;
    while (pos < el.value.length && n > 0) {
      if (/[\d,]/.test(el.value[pos])) n--;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    cursor.current = null;
  }, [valor]);

  function mudou(e) {
    const bruto = e.target.value;
    // normalizarDecimal troca no máximo um caractere (ponto por vírgula), então as posições batem.
    const norm = normalizarDecimal(bruto, valor);
    cursor.current = norm.slice(0, e.target.selectionStart ?? bruto.length).replace(/[^\d,]/g, '').length;
    aoMudar(mascararValor(bruto, valor));
  }

  // Ao sair do campo, completa os centavos: "1.500" -> "1.500,00"
  function saiu() {
    const v = lerValor(valor);
    if (v != null && !Number.isNaN(v)) aoMudar(valorParaCampo(v));
  }

  return (
    <div className={'campo-moeda' + (invalido ? ' invalido' : '')}>
      <span className="prefixo" aria-hidden="true">
        R$
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className="mono"
        autoComplete="off"
        spellCheck={false}
        value={valor}
        onChange={mudou}
        onBlur={saiu}
        placeholder="0,00"
        aria-label="Valor total em reais"
      />
    </div>
  );
}
