import { ehExtra } from '../comodos.js';

/** Nome do cômodo. O "Extra" aparece como selo amarelo com estrela. */
export default function NomeComodo({ nome }) {
  if (!ehExtra(nome)) return nome;
  return (
    <span className="selo-extra" title="Objetos de cômodos que não estão na lista">
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L2.9 9.4l6.3-.9z" fill="currentColor" />
      </svg>
      Extra
    </span>
  );
}
