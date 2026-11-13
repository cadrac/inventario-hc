import ExcelJS from 'exceljs';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { adicionarExcluidos, adicionarHistorico, adicionarRegistro, montarPlanilha, ordenarParaExportar } from './exportar.js';

async function lerLogo() {
  try {
    const blob = await fetch('/logo-hc.png').then((r) => (r.ok ? r.blob() : null));
    if (!blob) return null;
    return await new Promise((ok, erro) => {
      const leitor = new FileReader();
      leitor.onload = () => ok(leitor.result); // "data:image/png;base64,..."
      leitor.onerror = erro;
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null; // sem a logo, a planilha sai igual, só sem a imagem
  }
}

/**
 * comodos: lista de cômodos escolhidos ({ id, nome }), ou null para exportar tudo.
 * Com cômodos escolhidos, todas as abas (itens, registro, excluídos e histórico)
 * trazem só o que é daqueles cômodos.
 */
export async function baixarPlanilha(itens, excluidos = [], comodos = null) {
  const ids = comodos && new Set(comodos.map((c) => c.id));
  const doComodo = (it) => !ids || ids.has(it.comodoId);
  itens = itens.filter(doComodo);
  excluidos = excluidos.filter(doComodo);
  // Excluídos ficam fora da aba oficial: aparecem só na aba "Excluídos".
  const ordem = ordenarParaExportar(itens);
  const wb = montarPlanilha(ExcelJS, ordem, { logoBase64: await lerLogo() });
  adicionarRegistro(wb, ordem);
  adicionarExcluidos(wb, excluidos);
  try {
    // Sem internet, usa o que estiver no aparelho.
    const snap = await getDocs(collection(db, 'historico'));
    let entradas = snap.docs.map((d) => d.data({ serverTimestamps: 'estimate' }));
    if (comodos) {
      // O histórico guarda o nome do cômodo; o antigo "Extra" hoje é "Parte externa Teatro".
      const nomes = new Set(comodos.map((c) => c.nome));
      if (ids.has('extra')) nomes.add('Extra');
      entradas = entradas.filter((h) => nomes.has(h.comodo));
    }
    adicionarHistorico(wb, entradas);
  } catch (e) {
    console.warn('Histórico não incluído na planilha:', e);
  }
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const hoje = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const parte = comodos ? (comodos.length === 1 ? `-${comodos[0].id}` : `-${comodos.length}-comodos`) : '';
  a.download = `inventario-hora-da-crianca-${hoje}${parte}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
