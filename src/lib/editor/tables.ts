// ============================================================
// Editor Dokumen — operasi tabel lengkap ala Word
// ============================================================

import { MM } from "./types";

export type CellRef = { cell: HTMLTableCellElement; row: number; col: number; isOrigin: boolean };

/** Grid logis tabel memperhitungkan colspan/rowspan */
export function buildGrid(table: HTMLTableElement): (CellRef | null)[][] {
  const rows = Array.from(table.rows);
  const grid: (CellRef | null)[][] = [];
  rows.forEach((tr, r) => {
    grid[r] = grid[r] || [];
    let c = 0;
    Array.from(tr.cells).forEach((cell) => {
      while (grid[r][c]) c++;
      const cs = cell.colSpan || 1;
      const rs = cell.rowSpan || 1;
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          grid[r + dr] = grid[r + dr] || [];
          grid[r + dr][c + dc] = { cell, row: r, col: c, isOrigin: dr === 0 && dc === 0 };
        }
      }
      c += cs;
    });
  });
  // rapikan baris yang mungkin bolong
  const width = Math.max(...grid.map((g) => g.length), 0);
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < width; c++) if (!grid[r][c]) grid[r][c] = null;
  }
  return grid;
}

export function findTd(node: Node | null): HTMLTableCellElement | null {
  return (node instanceof Element ? node : node?.parentElement)?.closest("td,th") as HTMLTableCellElement | null;
}

export function findTable(node: Node | null): HTMLTableElement | null {
  return (node instanceof Element ? node : node?.parentElement)?.closest("table") as HTMLTableElement | null;
}

/* ---------------- Sisipkan tabel ---------------- */

export function makeTableHtml(rows: number, cols: number, opts?: { header?: boolean; widthMm?: number; bordered?: boolean }): string {
  const w = opts?.widthMm ?? 150;
  const cw = (w / cols).toFixed(1);
  let html = `<table class="ed-table" style="width:${w}mm; border-collapse:collapse; margin:2mm auto;">`;
  html += `<colgroup>${Array(cols).fill(`<col style="width:${cw}mm">`).join("")}</colgroup>`;
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      const head = opts?.header && r === 0;
      html += head
        ? `<th class="ed-th" style="border:1px solid #000; padding:1mm 1.5mm; text-align:center; font-weight:bold; background:#f2f2f2;">${escapeTd("Kolom " + (c + 1))}</th>`
        : `<td style="border:${opts?.bordered === false ? "none" : "1px solid #000"}; padding:1mm 1.5mm; vertical-align:top;">${r === 0 && !opts?.header ? "" : "<br>"}</td>`;
    }
    html += "</tr>";
  }
  html += "</table><p><br></p>";
  return html;
}

function escapeTd(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** Pastikan tabel punya colgroup — dipakai untuk resize kolom */
export function ensureColgroup(table: HTMLTableElement) {
  let cg = table.querySelector("colgroup");
  const firstRow = table.rows[0];
  if (!firstRow) return;
  const nCols = buildGrid(table)[0]?.length ?? firstRow.cells.length;
  if (!cg) {
    cg = document.createElement("colgroup");
    table.insertBefore(cg, table.firstChild);
  }
  const cols = Array.from(cg.querySelectorAll("col"));
  while (cols.length < nCols) {
    const col = document.createElement("col");
    cg.appendChild(col);
    cols.push(col);
  }
  while (cols.length > nCols) cols.pop()?.remove();
  // isi lebar dari sel baris pertama bila kosong
  const grid = buildGrid(table);
  Array.from(cg.querySelectorAll("col")).forEach((col, i) => {
    if (!col.style.width) {
      const ref = grid[0]?.[i];
      const w = ref?.cell.offsetWidth;
      if (w) col.style.width = (w / MM).toFixed(2) + "mm";
    }
  });
}

/* ---------------- Baris ---------------- */

export function addRow(td: HTMLTableCellElement, where: "above" | "below") {
  const tr = td.parentElement as HTMLTableRowElement;
  const table = findTable(td);
  if (!tr || !table) return;
  const neu = tr.cloneNode(true) as HTMLTableRowElement;
  for (const cell of Array.from(neu.cells)) {
    cell.innerHTML = "<br>";
    cell.removeAttribute("rowspan");
    cell.removeAttribute("colspan");
    cell.style.backgroundColor = "";
  }
  tr.parentElement?.insertBefore(neu, where === "above" ? tr : tr.nextSibling);
}

export function deleteRow(td: HTMLTableCellElement) {
  const tr = td.parentElement as HTMLTableRowElement;
  const table = findTable(td);
  if (!tr || !table) return;
  // hapus baris terakhir → hapus tabel
  if (table.rows.length <= 1) {
    table.remove();
    return;
  }
  const grid = buildGrid(table);
  const r = Array.from(table.rows).indexOf(tr);
  // sel dari baris lain yang merentang ke baris ini: kurangi rowspan
  for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
    const ref = grid[r][c];
    if (ref && ref.cell.rowSpan > 1 && ref.row < r) {
      ref.cell.rowSpan -= 1;
    }
  }
  tr.remove();
}

/* ---------------- Kolom ---------------- */

export function addCol(td: HTMLTableCellElement, where: "left" | "right") {
  const table = findTable(td);
  const grid = table ? buildGrid(table) : null;
  const tr = td.parentElement as HTMLTableRowElement;
  if (!table || !grid || !tr) return;
  const refRow = Array.from(table.rows).indexOf(tr);
  const refCol = Array.from(tr.cells).indexOf(td);
  const target = grid[refRow]?.[refCol];
  const insertAt = target ? target.col + (where === "left" ? 0 : (target.cell.colSpan || 1)) : 0;
  const nCols = grid[0]?.length ?? 0;

  table.querySelectorAll("tr").forEach((row, r) => {
    const cellAt = grid[r]?.[insertAt];
    const spanningPrev = grid[r]?.[insertAt - 1];
    if (cellAt && !cellAt.isOrigin && cellAt.cell.colSpan > 1) {
      cellAt.cell.colSpan += 1;
      return;
    }
    if (cellAt && cellAt.cell.rowSpan > 1 && cellAt.row < r && !cellAt.isOrigin) {
      return; // baris ini tertutup rowspan
    }
    const newCell = (table.rows[r].cells[0]?.tagName === "TH" && r === 0 ? "th" : "td") as "td" | "th";
    const nel = document.createElement(newCell);
    nel.innerHTML = "<br>";
    if (newCell === "th") { nel.className = "ed-th"; }
    nel.style.border = "1px solid #000";
    nel.style.padding = "1mm 1.5mm";
    nel.style.verticalAlign = "top";
    const anchor = grid[r]?.[insertAt];
    if (anchor && anchor.isOrigin && anchor.cell.parentElement === row) {
      row.insertBefore(nel, where === "left" ? anchor.cell : anchor.cell.nextSibling);
    } else if (spanningPrev && spanningPrev.cell.parentElement === row) {
      row.insertBefore(nel, spanningPrev.cell.nextSibling);
    } else {
      row.appendChild(nel);
    }
    void nCols;
  });
  syncColgroup(table, grid);
}

export function deleteCol(td: HTMLTableCellElement) {
  const table = findTable(td);
  const grid = table ? buildGrid(table) : null;
  const tr = td.parentElement as HTMLTableRowElement;
  if (!table || !grid || !tr) return;
  const refRow = Array.from(table.rows).indexOf(tr);
  const refCol = Array.from(tr.cells).indexOf(td);
  const target = grid[refRow]?.[refCol];
  if (!target) return;
  const nCols = grid[0]?.length ?? 0;
  if (nCols - (target.cell.colSpan || 1) <= 0) {
    table.remove();
    return;
  }
  const colStart = target.col;
  const colEnd = colStart + (target.cell.colSpan || 1);

  // kumpulkan sel yang harus diubah
  const decremented = new Set<HTMLTableCellElement>();
  const toRemove: HTMLTableCellElement[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = colStart; c < colEnd; c++) {
      const ref = grid[r]?.[c];
      if (!ref) continue;
      const cell = ref.cell;
      if (decremented.has(cell) || toRemove.includes(cell)) continue;
      if (ref.isOrigin) {
        if ((cell.colSpan || 1) > (colEnd - colStart)) {
          cell.colSpan = (cell.colSpan || 1) - (colEnd - colStart);
          decremented.add(cell);
        } else {
          toRemove.push(cell);
        }
      } else {
        // bagian dari sel yang merentang
        if ((cell.colSpan || 1) > 1) {
          cell.colSpan = (cell.colSpan || 1) - 1;
          decremented.add(cell);
        } else {
          toRemove.push(cell);
        }
      }
    }
  }
  toRemove.forEach((c) => c.remove());
  syncColgroup(table, grid);
}

function syncColgroup(table: HTMLTableElement, grid: (CellRef | null)[][]) {
  let cg = table.querySelector("colgroup");
  if (!cg) return;
  const nCols = grid[0]?.length ?? 0;
  const cols = Array.from(cg.querySelectorAll("col"));
  while (cols.length < nCols) {
    const col = document.createElement("col");
    cg.appendChild(col);
    cols.push(col);
  }
  while (cols.length > nCols) cols.pop()?.remove();
}

/* ---------------- Gabung / pisah sel ---------------- */

export function mergeCells(tds: HTMLTableCellElement[]) {
  if (tds.length < 2) return;
  const table = findTable(tds[0]);
  if (!table) return;
  const grid = buildGrid(table);
  const refs = tds
    .map((c) => grid.flat().find((r) => r?.cell === c && r.isOrigin))
    .filter(Boolean) as CellRef[];
  if (refs.length < 2) return;
  const r0 = Math.min(...refs.map((x) => x.row));
  const c0 = Math.min(...refs.map((x) => x.col));
  const r1 = Math.max(...refs.map((x) => x.row + (x.cell.rowSpan || 1) - 1));
  const c1 = Math.max(...refs.map((x) => x.col + (x.cell.colSpan || 1) - 1));
  const origin = grid[r0]?.[c0]?.cell;
  if (!origin) return;
  // pindahkan isi sel lain
  for (const ref of refs) {
    const cell = ref.cell;
    if (cell === origin) continue;
    // pindahkan isi non-kosong saja
    const txt = cell.textContent?.trim();
    if (txt) {
      if (origin.textContent?.trim()) origin.appendChild(document.createElement("br"));
      while (cell.firstChild) origin.appendChild(cell.firstChild);
    } else {
      while (cell.firstChild) origin.appendChild(cell.firstChild);
    }
    cell.remove();
  }
  origin.colSpan = c1 - c0 + 1;
  origin.rowSpan = r1 - r0 + 1;
}

export function splitCell(td: HTMLTableCellElement) {
  const table = findTable(td);
  if (!table) return;
  const cs = td.colSpan || 1;
  const rs = td.rowSpan || 1;
  if (cs <= 1 && rs <= 1) return;
  td.colSpan = 1;
  td.rowSpan = 1;
  const tr = td.parentElement as HTMLTableRowElement;
  // tambah sel di kanan pada baris yang sama
  for (let i = 1; i < cs; i++) {
    const nel = document.createElement(td.tagName === "TH" ? "th" : "td");
    nel.innerHTML = "<br>";
    nel.style.border = td.style.border || "1px solid #000";
    nel.style.padding = td.style.padding || "1mm 1.5mm";
    tr.insertBefore(nel, td.nextSibling);
  }
  // baris di bawah yang tertutup rowspan → tambah sel kosong di posisi kolom yang sama
  if (rs > 1) {
    const grid = buildGrid(table);
    const r = Array.from(table.rows).indexOf(tr);
    const c = td.cellIndex;
    for (let dr = 1; dr < rs; dr++) {
      const row = table.rows[r + dr];
      if (!row) break;
      const colPos = grid[r + dr]?.[c]?.col ?? c;
      const nel = document.createElement("td");
      nel.innerHTML = "<br>";
      nel.style.border = td.style.border || "1px solid #000";
      nel.style.padding = td.style.padding || "1mm 1.5mm";
      const ref = grid[r + dr]?.[colPos];
      const anchor = ref && ref.isOrigin && ref.cell.parentElement === row ? ref.cell : row.lastElementChild;
      if (anchor && anchor.parentElement === row) row.insertBefore(nel, anchor.nextSibling);
      else row.appendChild(nel);
    }
  }
}

/* ---------------- Format sel & tabel ---------------- */

export function setCellsBackground(tds: HTMLTableCellElement[], color: string | null) {
  for (const td of tds) {
    if (color) td.style.backgroundColor = color;
    else td.style.removeProperty("background-color");
  }
}

export function setCellsVAlign(tds: HTMLTableCellElement[], v: "top" | "middle" | "bottom") {
  for (const td of tds) td.style.verticalAlign = v;
}

export function setCellsTextAlign(tds: HTMLTableCellElement[], a: "left" | "center" | "right" | "justify") {
  for (const td of tds) td.style.textAlign = a;
}

export function setTableBorders(table: HTMLTableElement, opts: { color: string; widthMm: number; style: string }) {
  table.style.borderCollapse = "collapse";
  for (const row of Array.from(table.rows)) {
    for (const cell of Array.from(row.cells)) {
      cell.style.border = `${opts.widthMm}mm ${opts.style} ${opts.color}`;
    }
  }
}

export function clearTableBorders(table: HTMLTableElement) {
  for (const row of Array.from(table.rows)) {
    for (const cell of Array.from(row.cells)) cell.style.border = "none";
  }
}

export function toggleHeaderRow(table: HTMLTableElement) {
  const firstRow = table.rows[0];
  if (!firstRow) return;
  const toHeader = firstRow.cells[0]?.tagName !== "TH";
  for (const cell of Array.from(firstRow.cells)) {
    const neu = document.createElement(toHeader ? "th" : "td");
    neu.innerHTML = cell.innerHTML;
    for (const attr of Array.from(cell.attributes)) neu.setAttribute(attr.name, attr.value);
    if (toHeader) {
      neu.className = "ed-th";
      neu.style.fontWeight = "bold";
      neu.style.textAlign = "center";
      neu.style.background = "#f2f2f2";
    } else {
      neu.removeAttribute("class");
      neu.style.removeProperty("font-weight");
      neu.style.removeProperty("background");
    }
    cell.replaceWith(neu);
  }
  if (toHeader) firstRow.classList.add("repeat-header");
  else firstRow.classList.remove("repeat-header");
}

export function setTableWidth(table: HTMLTableElement, mm: number) {
  table.style.width = mm + "mm";
}

export function setTableAlignment(table: HTMLTableElement, align: "left" | "center" | "right") {
  table.style.marginLeft = align === "center" || align === "right" ? "auto" : "0";
  table.style.marginRight = align === "center" || align === "left" ? "auto" : "0";
}

export function setCellPadding(table: HTMLTableElement, mm: number) {
  for (const row of Array.from(table.rows)) {
    for (const cell of Array.from(row.cells)) cell.style.padding = `${mm}mm ${mm * 1.5}mm`;
  }
}

/** Ambil sel-sel terpilih (class .cell-sel) dalam sebuah tabel */
export function getSelectedCells(root: HTMLElement): HTMLTableCellElement[] {
  return Array.from(root.querySelectorAll("td.cell-sel, th.cell-sel")) as HTMLTableCellElement[];
}

export function clearCellSelection(root: HTMLElement) {
  root.querySelectorAll("td.cell-sel, th.cell-sel").forEach((el) => el.classList.remove("cell-sel"));
}
