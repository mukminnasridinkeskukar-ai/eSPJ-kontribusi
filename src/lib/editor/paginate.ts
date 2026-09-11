// ============================================================
// Editor Dokumen — mesin paginasi: hitung halaman, pecah konten,
// bangun halaman cetak/pratinjau, daftar isi otomatis
// ============================================================

import { DocSettings, MM, contentHeight, effectivePaper, PageNumberFormat } from "./types";

export type TableSplit = { table: HTMLTableElement; page: number; rows: [number, number][] };
export type PageMap = {
  pages: number;
  pageOf: Map<Element, number>;
  splits: TableSplit[];
};

const PAGEBREAK_RE = /^1$/;

function isHeading(el: Element): boolean {
  return /^H[1-4]$/.test(el.tagName);
}

function isPageBreak(el: Element): boolean {
  return el.hasAttribute("data-pagebreak") && PAGEBREAK_RE.test(el.getAttribute("data-pagebreak") || "1");
}

/**
 * Hitung pembagian halaman dari konten mengalir (editing view).
 * body harus position:relative agar offsetTop relatif ke body.
 */
export function paginate(body: HTMLElement, contentHpx: number): PageMap {
  const pageOf = new Map<Element, number>();
  const splits: TableSplit[] = [];
  let pageStart = 0; // px batas atas halaman berjalan
  let curPage = 0;

  const blocks = Array.from(body.children) as HTMLElement[];
  for (const block of blocks) {
    let y = block.offsetTop;
    if (isPageBreak(block)) {
      pageOf.set(block, curPage);
      // lanjut ke halaman berikutnya
      const endY = y + block.offsetHeight;
      const nextBoundary = (Math.floor(endY / contentHpx) + 1) * contentHpx;
      pageStart = nextBoundary;
      curPage = Math.round(pageStart / contentHpx);
      continue;
    }
    if (y < pageStart) y = pageStart;
    let bottom = y + block.offsetHeight;
    // jaga heading tidak menggantung di dasar halaman
    if (isHeading(block) && bottom > pageStart + contentHpx - 20 && y > pageStart) {
      pageStart += contentHpx;
      curPage += 1;
      y = Math.max(block.offsetTop, pageStart);
      bottom = y + block.offsetHeight;
    }
    if (bottom <= pageStart + contentHpx) {
      pageOf.set(block, curPage);
      continue;
    }
    if (block.tagName === "TABLE") {
      // pecah tabel per baris
      const table = block as HTMLTableElement;
      pageOf.set(block, curPage);
      const rowRanges: [number, number][] = [];
      const rows = Array.from(table.rows);
      let segStart = 0;
      let segPage = curPage;
      for (let i = 0; i < rows.length; i++) {
        const rowBottom = table.offsetTop + rows[i].offsetTop + rows[i].offsetHeight;
        if (rowBottom - pageStart > contentHpx && i > segStart) {
          rowRanges.push([segStart, i - 1]);
          splits.push({ table, page: segPage, rows: [[segStart, i - 1]] });
          segStart = i;
          segPage += 1;
          // halaman baru: mulai dari posisi baris ini relatif
          pageStart += contentHpx;
          while (table.offsetTop + rows[i].offsetTop > pageStart + contentHpx) {
            pageStart += contentHpx;
            segPage += 1;
          }
        }
      }
      rowRanges.push([segStart, rows.length - 1]);
      for (const rr of rowRanges) splits.push({ table, page: segPage, rows: [rr] });
      // gabungkan rentang berurutan per halaman
      const byPage = new Map<number, [number, number]>();
      for (const s of splits) {
        if (s.table !== table) continue;
        const [a, b] = s.rows[0];
        const ex = byPage.get(s.page);
        if (ex) { ex[1] = b; } else byPage.set(s.page, [a, b]);
      }
      // tulis ulang splits hanya untuk tabel ini
      const others = splits.filter((s) => s.table !== table);
      const merged: TableSplit[] = Array.from(byPage.entries()).map(([page, rr]) => ({ table, page, rows: [rr] }));
      splits.length = 0;
      splits.push(...others, ...merged);
      curPage = Math.max(...Array.from(byPage.keys()));
      pageStart = curPage * contentHpx;
    } else {
      // blok besar non-tabel: dorong ke halaman berikut bila muat, biarkan melimpah bila tidak
      if (y > pageStart) {
        pageStart += contentHpx;
        curPage += 1;
      }
      pageOf.set(block, curPage);
    }
  }
  return { pages: Math.max(1, curPage + 1), pageOf, splits };
}

/* ---------------- Nomor halaman ---------------- */

export function formatPageNo(format: PageNumberFormat, idx: number, start: number, total: number): string {
  const n = start + idx;
  switch (format) {
    case "hal-n": return `Halaman ${n}`;
    case "n-dari-y": return `${n} dari ${start + total - 1}`;
    case "n/y": return `${n} / ${start + total - 1}`;
    default: return String(n);
  }
}

/* ---------------- Bangun halaman cetak / pratinjau ---------------- */

export function buildPrintPages(
  body: HTMLElement,
  s: DocSettings,
  pageMap: PageMap,
  headerHtml: string,
  headerFirstHtml: string,
  footerHtml: string,
  footerFirstHtml: string
): HTMLDivElement[] {
  const paper = effectivePaper(s);
  const contentHpx = contentHeight(s) * MM;
  const pages: HTMLDivElement[] = [];
  const total = pageMap.pages;

  const cloneClean = (el: Element) => {
    const c = el.cloneNode(true) as HTMLElement;
    c.querySelectorAll(".cell-sel").forEach((x) => x.classList.remove("cell-sel"));
    c.querySelectorAll("[contenteditable]").forEach((x) => x.removeAttribute("contenteditable"));
    c.querySelectorAll("img.img-selected").forEach((x) => x.classList.remove("img-selected"));
    return c;
  };

  for (let p = 0; p < total; p++) {
    const page = document.createElement("div");
    page.className = "ed-print-page";
    page.style.width = paper.w + "mm";
    page.style.height = paper.h + "mm";

    // header & footer
    const useFirst = s.differentFirstPage && p === 0;
    const hdrHtml = useFirst ? headerFirstHtml || headerHtml : headerHtml;
    const ftrHtml = useFirst ? footerFirstHtml || footerHtml : footerHtml;
    const fillPageNo = (root: HTMLElement) => {
      root.querySelectorAll('[data-field="page"]').forEach((f) => {
        f.textContent = formatPageNo(s.pageNumber.format, p, s.pageNumber.start, total);
      });
    };
    if (hdrHtml) {
      const h = document.createElement("div");
      h.className = "ed-print-header";
      h.style.top = s.headerDist + "mm";
      h.style.left = s.margins.left + "mm";
      h.style.right = s.margins.right + "mm";
      h.innerHTML = hdrHtml;
      fillPageNo(h);
      page.appendChild(h);
    }
    if (ftrHtml) {
      const f = document.createElement("div");
      f.className = "ed-print-footer";
      f.style.bottom = s.footerDist + "mm";
      f.style.left = s.margins.left + "mm";
      f.style.right = s.margins.right + "mm";
      f.innerHTML = ftrHtml;
      fillPageNo(f);
      page.appendChild(f);
    }
    // isi
    const area = document.createElement("div");
    area.className = "ed-print-body";
    area.style.fontFamily = `'${s.docFont}', serif`;
    area.style.fontSize = s.docFontSize + "pt";
    area.style.lineHeight = String(s.docLineHeight);
    area.style.paddingTop = s.margins.top + "mm";
    area.style.paddingBottom = s.margins.bottom + "mm";
    area.style.paddingLeft = s.margins.left + "mm";
    area.style.paddingRight = s.margins.right + "mm";

    const blocks = Array.from(body.children) as HTMLElement[];
    for (const block of blocks) {
      const bp = pageMap.pageOf.get(block);
      if (bp === p) {
        area.appendChild(cloneClean(block));
      } else if (block.tagName === "TABLE" && bp !== undefined && bp < p) {
        const split = pageMap.splits.find((x) => x.table === block && x.page === p);
        if (split) {
          const tbl = cloneClean(block) as HTMLTableElement;
          tbl.querySelectorAll("tr").forEach((tr, i) => {
            const keep = split.rows.some(([a, b]) => i >= a && i <= b);
            const isRepeat = tr.classList.contains("repeat-header");
            if (!keep && !(isRepeat && p > bp)) tr.remove();
          });
          area.appendChild(tbl);
        }
      }
    }
    page.appendChild(area);
    pages.push(page);
  }
  return pages;
}

/** CSS @page dinamis sesuai pengaturan dokumen */
export function makePageCss(s: DocSettings): string {
  const paper = effectivePaper(s);
  return `@page { size: ${paper.w}mm ${paper.h}mm; margin: 0; }`;
}

/* ---------------- Daftar Isi (TOC) ---------------- */

export type HeadingInfo = { el: HTMLElement; level: number; text: string; page: number };

export function collectHeadings(body: HTMLElement, pageMap: PageMap): HeadingInfo[] {
  const out: HeadingInfo[] = [];
  body.querySelectorAll("h1,h2,h3,h4").forEach((el) => {
    const h = el as HTMLElement;
    if (h.closest("[data-toc]")) return;
    const level = parseInt(h.tagName[1], 10);
    const text = h.textContent?.trim() || "(tanpa judul)";
    out.push({ el: h, level, text, page: (pageMap.pageOf.get(h) ?? 0) + 1 });
  });
  return out;
}

export function buildTocHtml(headings: HeadingInfo[]): string {
  const rows = headings
    .map(
      (h) =>
        `<div class="toc-row toc-l${h.level}" data-toc-target="${h.el.getAttribute("data-hid") ?? ""}">` +
        `<span class="toc-text">${escapeToc(h.text)}</span>` +
        `<span class="toc-leader"></span>` +
        `<span class="toc-page">${h.page}</span></div>`
    )
    .join("\n");
  return (
    `<div class="toc" data-toc="1" contenteditable="false">` +
    `<div class="toc-title">DAFTAR ISI</div>${rows || `<div class="toc-empty">Belum ada judul (Heading 1–4) dalam dokumen.</div>`}` +
    `</div><p><br></p>`
  );
}

function escapeToc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** Perbarui TOC yang sudah ada di dokumen (nomor halaman + entri) */
export function updateToc(body: HTMLElement, pageMap: PageMap): boolean {
  const toc = body.querySelector("[data-toc]");
  if (!toc) return false;
  const headings = collectHeadings(body, pageMap);
  const rows = headings
    .map(
      (h) =>
        `<div class="toc-row toc-l${h.level}">` +
        `<span class="toc-text">${escapeToc(h.text)}</span>` +
        `<span class="toc-leader"></span>` +
        `<span class="toc-page">${h.page}</span></div>`
    )
    .join("\n");
  const title = toc.querySelector(".toc-title")?.outerHTML ?? `<div class="toc-title">DAFTAR ISI</div>`;
  toc.innerHTML = title + (rows || `<div class="toc-empty">Belum ada judul (Heading 1–4) dalam dokumen.</div>`);
  return true;
}

/** Beri id stabil pada heading agar outline bisa melompat */
export function ensureHeadingIds(body: HTMLElement) {
  body.querySelectorAll("h1,h2,h3,h4").forEach((el, i) => {
    if (!el.getAttribute("data-hid")) el.setAttribute("data-hid", "h" + i + "-" + Date.now().toString(36));
  });
}
