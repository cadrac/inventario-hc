import ExcelJS from 'exceljs';
import { adicionarRegistro, montarPlanilha, ordenarParaExportar } from './exportar.js';

export async function baixarPlanilha(itens) {
  const ordem = ordenarParaExportar(itens);
  const wb = montarPlanilha(ExcelJS, ordem);
  adicionarRegistro(wb, ordem);
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
