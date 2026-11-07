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

export async function baixarPlanilha(itens, excluidos = []) {
  // Excluídos ficam fora da aba oficial: aparecem só na aba "Excluídos".
  const ordem = ordenarParaExportar(itens);
  const wb = montarPlanilha(ExcelJS, ordem, { logoBase64: await lerLogo() });
  adicionarRegistro(wb, ordem);
  adicionarExcluidos(wb, excluidos);
  try {
    // Sem internet, usa o que estiver no aparelho.
    const snap = await getDocs(collection(db, 'historico'));
    adicionarHistorico(wb, snap.docs.map((d) => d.data({ serverTimestamps: 'estimate' })));
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
  a.download = `inventario-hora-da-crianca-${hoje}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
