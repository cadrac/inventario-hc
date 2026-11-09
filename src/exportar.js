// Monta a planilha no layout da aba "Planilha1 - Auxiliar".
// Funciona no navegador e no Node (recebe o ExcelJS como parâmetro).

const LETRAS = ['O', 'B', 'R', 'P', 'I'];

// Textos do cabeçalho e do rodapé, iguais aos do inventario.ods.
const TITULO = 'Organização Social Hora da Criança ';
const SUBTITULO = 'Inventário de Bens Móveis e Termo de Responsabilidade  \nSalvador – Bahia\n\nExercício:2026';
const DECLARACAO =
  'Declaro que tenho sob a minha guarda e uso os bens patrimoniais acima especificados.\n\n\n' +
  '________________________________                __________________________________        \n' +
  'Presidente                                                           CPF';
const COMISSAO =
  'Comissão de Inventário de bens Móveis Patrimoniais\n\n\n\n\nSalvador, ____ de ____________________ de __________\n';
const LEGENDA = 'Legenda\n\n\n\nO – Ótimo\nB- Bom\nR- Regular\nP- Precário\nI - Inservível\n';
const PREENCHIDO = 'Preenchido por:\n\n___________________________________\n\nRG:\nCPF:';
const CONFERIDO = 'Conferido  por:\n\n_______________________________\n\nRG:\nCPF:';

// Larguras das colunas A..S (convertidas dos pontos da planilha original)
const LARGURAS = [22, 32, 34, 22, 22, 34, 11, 11, 11, 11, 11, 27, 34, 6, 10, 10, 10, 9, 9];
const ESPACO_ATE_RODAPE = 15; // na original: último item na linha 285, rodapé na 300

// Formatação da original: Arial, título 36 negrito, subtítulo 18 negrito, tabela 12.
const FONTE = 'Arial';
const ALTURA_LINHA_1 = 105; // pt, como na original
const ALTURA_LINHA_2 = 117;
const ALTURA_TABELA = 34.5;

const fino = { style: 'thin', color: { argb: 'FF000000' } };
const BORDA = { top: fino, left: fino, bottom: fino, right: fino };
const centro = { horizontal: 'center', vertical: 'middle', wrapText: true };

function dataExcel(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || '');
  if (!m) return null;
  const [, d, mes, a] = m.map(Number);
  if (mes < 1 || mes > 12 || d < 1 || d > 31 || a < 1900) return null;
  return new Date(Date.UTC(a, mes - 1, d));
}

/**
 * @param ExcelJS  módulo exceljs
 * @param itens    itens na ordem final (originais pela linha, depois os novos 279, 280...),
 *                 sem os excluídos (eles vão só para a aba "Excluídos")
 * @param opcoes   { logoBase64 } — logo da Hora da Criança (PNG em base64), opcional
 */
export function montarPlanilha(ExcelJS, itens, { logoBase64 } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Inventário Hora da Criança';
  wb.created = new Date();
  const ws = wb.addWorksheet('Planilha1 - Auxiliar', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });
  ws.columns = LARGURAS.map((width) => ({ width }));

  // ---- Cabeçalho, como na original ----
  ws.mergeCells('A1:M1');
  const c1 = ws.getCell('A1');
  c1.value = TITULO.trim();
  c1.font = { name: FONTE, bold: true, size: 36 };
  c1.alignment = centro;
  c1.border = { top: fino, left: fino, right: fino };
  ws.getRow(1).height = ALTURA_LINHA_1;

  ws.mergeCells('A2:M2');
  const c2 = ws.getCell('A2');
  c2.value = SUBTITULO;
  c2.font = { name: FONTE, bold: true, size: 18 };
  c2.alignment = centro;
  c2.border = { bottom: fino, left: fino, right: fino };
  ws.getRow(2).height = ALTURA_LINHA_2;

  // Logo nos dois cantos (A1 e M1), como na original
  if (logoBase64) {
    const img = wb.addImage({ base64: logoBase64, extension: 'png' });
    const tam = { width: 132, height: 129 }; // px (proporção da logo: 460x448)
    ws.addImage(img, { tl: { col: 0.12, row: 0.3 }, ext: tam, editAs: 'oneCell' });
    ws.addImage(img, { tl: { col: 12.08, row: 0.3 }, ext: tam, editAs: 'oneCell' });
  }

  ws.mergeCells('G4:K4');
  ws.getCell('G4').value = 'CONSERVAÇÃO';
  ws.mergeCells('O4:S4');
  ws.getCell('O4').value = 'ATUALIZAÇÃO DO STATUS DE CONSERVAÇÃO - 11/2026';
  ws.getRow(4).height = ALTURA_TABELA;

  const cab = ['ITEM', 'SETOR', 'ESPECIFICAÇÃO', 'QT.', 'Nº DE SERIE', 'DATA DE AQUISIÇÃO', ...LETRAS, 'VALOR TOTAL', 'OBSERVAÇÕES', null, ...LETRAS];
  ws.getRow(5).values = cab;
  ws.getRow(5).height = ALTURA_TABELA;

  for (const r of [4, 5]) {
    ws.getRow(r).eachCell({ includeEmpty: true }, (cell, col) => {
      if (col === 14 || col > 19) return;
      if (r === 4 && !((col >= 7 && col <= 11) || col >= 15)) return;
      cell.font = { name: FONTE, bold: true, size: 12 };
      cell.alignment = centro;
      cell.border = BORDA;
    });
  }

  // ---- Itens ----
  let r = 6;
  for (const it of itens) {
    const row = ws.getRow(r);
    const qtd = /^\d+$/.test(it.qtd || '') ? Number(it.qtd) : it.qtd || null;
    const data = dataExcel(it.dataAquisicao);
    const valores = [
      it.numero ?? null,
      it.novo ? it.comodo : it.setorOriginal,
      it.especificacao,
      qtd,
      it.serie || null,
      data || it.dataAquisicao || null,
      ...LETRAS.map((l) => (it.conservacaoOriginal === l ? 'x' : null)),
      it.valor ?? null,
      it.observacoes || null,
      null,
      ...LETRAS.map((l) => (it.conservacaoNova === l ? 'x' : null)),
    ];
    row.values = valores;
    row.height = ALTURA_TABELA;
    for (let c = 1; c <= 19; c++) {
      if (c === 14) continue;
      const cell = row.getCell(c);
      cell.border = BORDA;
      cell.font = { name: FONTE, size: 12 };
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: c === 1 || c === 4 || (c >= 6 && c <= 11) || c >= 15 ? 'center' : undefined };
    }
    if (data) row.getCell(6).numFmt = 'dd/mm/yyyy';
    row.getCell(12).numFmt = '"R$" #,##0.00';
    r++;
  }

  // Rodapé (legenda e assinaturas), sempre logo após os itens
  const f = r - 1 + ESPACO_ATE_RODAPE;
  const blocos = [
    [`A${f}:F${f}`, DECLARACAO],
    [`G${f}:L${f + 4}`, COMISSAO],
    [`M${f}:M${f + 4}`, LEGENDA],
    [`A${f + 2}:C${f + 4}`, PREENCHIDO],
    [`D${f + 2}:F${f + 4}`, CONFERIDO],
    [`A${f + 5}:C${f + 5}`, null],
    [`D${f + 5}:F${f + 5}`, null],
  ];
  for (const [faixa, texto] of blocos) {
    ws.mergeCells(faixa);
    const cell = ws.getCell(faixa.split(':')[0]);
    cell.value = texto;
    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    cell.font = { name: FONTE, size: 12 };
  }
  ws.getRow(f).height = 90;
  for (let i = 1; i <= 4; i++) ws.getRow(f + i).height = 26;

  return wb;
}

/** Ordem final da exportação: originais pela linha da planilha, novos pelo número. */
export function ordenarParaExportar(itens) {
  const originais = itens.filter((i) => !i.novo).sort((a, b) => a.ordem - b.ordem);
  const novos = itens.filter((i) => i.novo).sort((a, b) => a.numero - b.numero);
  return [...originais, ...novos];
}

const paraData = (t) => (t?.toDate ? t.toDate() : t instanceof Date ? t : null);

/** Aba com os itens que foram para a lixeira (não entram na aba oficial). */
export function adicionarExcluidos(wb, excluidos) {
  const ws = wb.addWorksheet('Excluídos');
  ws.columns = [
    { header: 'ITEM', width: 8 },
    { header: 'CÔMODO', width: 32 },
    { header: 'ESPECIFICAÇÃO', width: 44 },
    { header: 'QT.', width: 8 },
    { header: 'VALOR TOTAL', width: 16 },
    { header: 'EXCLUÍDO POR', width: 14 },
    { header: 'EM', width: 18 },
    { header: 'MOTIVO', width: 50 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const it of excluidos) {
    const em = paraData(it.excluidoEm);
    const row = ws.addRow([it.numero ?? 's/nº', it.comodo, it.especificacao, it.qtd || '', it.valor ?? null, it.excluidoPor || '', em, it.motivoExclusao || '']);
    row.getCell(5).numFmt = '"R$" #,##0.00';
    if (em) row.getCell(7).numFmt = 'dd/mm/yyyy hh:mm';
  }
}

/** Aba com o histórico completo (log). */
export function adicionarHistorico(wb, entradas) {
  const ROTULOS = { conferencia: 'Conferência', edicao: 'Edição', adicao: 'Adição', exclusao: 'Exclusão', restauracao: 'Restauração' };
  const ws = wb.addWorksheet('Histórico');
  ws.columns = [
    { header: 'QUANDO', width: 18 },
    { header: 'QUEM', width: 12 },
    { header: 'AÇÃO', width: 14 },
    { header: 'ITEM', width: 8 },
    { header: 'CÔMODO', width: 30 },
    { header: 'ESPECIFICAÇÃO', width: 40 },
    { header: 'ALTERAÇÕES / MOTIVO', width: 70 },
  ];
  ws.getRow(1).font = { bold: true };
  const ordem = [...entradas].sort((a, b) => (paraData(a.em)?.getTime() || 0) - (paraData(b.em)?.getTime() || 0));
  for (const e of ordem) {
    const em = paraData(e.em);
    const detalhes = [
      ...(e.mudancas || []).map((m) => `${m.campo}: ${m.de} → ${m.para}`),
      e.motivo ? `Motivo: ${e.motivo}` : '',
    ].filter(Boolean).join('; ');
    const row = ws.addRow([em, e.por, ROTULOS[e.tipo] || e.tipo, e.numero ?? 's/nº', e.comodo, e.especificacao, detalhes]);
    if (em) row.getCell(1).numFmt = 'dd/mm/yyyy hh:mm';
    row.getCell(7).alignment = { wrapText: true, vertical: 'top' };
  }
}

/** Segunda aba: quem conferiu o quê e quando (não entra no layout oficial). */
export function adicionarRegistro(wb, itens) {
  const ws = wb.addWorksheet('Registro da visita');
  ws.columns = [
    { header: 'ITEM', width: 8 },
    { header: 'CÔMODO', width: 32 },
    { header: 'ESPECIFICAÇÃO', width: 44 },
    { header: 'NOVO?', width: 8 },
    { header: 'CONSERVAÇÃO ORIGINAL', width: 14 },
    { header: 'CONSERVAÇÃO 11/2026', width: 14 },
    { header: 'CONFERIDO', width: 11 },
    { header: 'POR', width: 12 },
    { header: 'EM', width: 18 },
    { header: 'ALTERAÇÕES', width: 60 },
  ];
  ws.getRow(1).font = { bold: true };
  const nomes = { especificacao: 'especificação', qtd: 'qtd', serie: 'nº de série', valor: 'valor', observacoes: 'observações' };
  for (const it of itens) {
    const mud = it.novo
      ? 'objeto adicionado na visita'
      : Object.keys(nomes)
          .filter((k) => (it.original?.[k] ?? null) !== (it[k] ?? null) && !(it.original?.[k] == null && it[k] === ''))
          .map((k) => `${nomes[k]}: "${it.original?.[k] ?? ''}" → "${it[k] ?? ''}"`)
          .join('; ');
    const em = it.editadoEm?.toDate ? it.editadoEm.toDate() : it.editadoEm || null;
    const row = ws.addRow([
      it.numero ?? 's/nº',
      it.comodo,
      it.especificacao,
      it.novo ? 'sim' : '',
      it.conservacaoOriginal || '',
      it.conservacaoNova || '',
      it.conferido ? 'sim' : 'não',
      it.editadoPor || '',
      em,
      mud,
    ]);
    if (em) row.getCell(9).numFmt = 'dd/mm/yyyy hh:mm';
  }
}
