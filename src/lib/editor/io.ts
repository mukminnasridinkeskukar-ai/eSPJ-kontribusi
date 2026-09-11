// ============================================================
// Editor Dokumen — ekspor DOCX/PDF/HTML/TXT, impor DOCX/HTML/TXT,
// cetak (PDF) dengan nomor halaman & header/footer, pemampat gambar
// ============================================================

import JSZip from "jszip";
import { DocSettings, MM, contentHeight, effectivePaper, mm2twip, px2twip } from "./types";
import { buildPrintPages, makePageCss, paginate } from "./paginate";
import { buildGrid } from "./tables";

/* ---------------- Unduh berkas ---------------- */

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}

/* ---------------- Gambar ---------------- */

export async function compressImageFile(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  if (file.size <= 400 * 1024) {
    const img = await loadImage(dataUrl);
    return { dataUrl, w: img.naturalWidth, h: img.naturalHeight };
  }
  const img = await loadImage(dataUrl);
  const maxW = 1400;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return { dataUrl: out, w: canvas.width, h: canvas.height };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Ganti sumber gambar relatif (/logo-xxx.png, /_next/image?...) menjadi data URL agar mandiri */
export async function inlineImages(html: string): Promise<string> {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const imgs = Array.from(wrap.querySelectorAll("img"));
  for (const img of imgs) {
    const src = img.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) continue;
    try {
      const real = src.includes("/_next/image?")
        ? decodeURIComponent(new URL(src, location.href).searchParams.get("url") || src)
        : src;
      const resp = await fetch(real.startsWith("http") ? real : location.origin + real);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((res) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.readAsDataURL(blob);
      });
      img.setAttribute("src", dataUrl);
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    } catch {
      /* biarkan apa adanya */
    }
  }
  return wrap.innerHTML;
}

/* ---------------- Cetak / PDF ---------------- */

export function printDocument(
  body: HTMLElement,
  s: DocSettings,
  headerHtml: string,
  headerFirstHtml: string,
  footerHtml: string,
  footerFirstHtml: string
) {
  const pageMap = paginate(body, contentHeight(s) * MM);
  const pages = buildPrintPages(body, s, pageMap, headerHtml, headerFirstHtml, footerHtml, footerFirstHtml);

  const portal = document.createElement("div");
  portal.id = "ed-print-portal";
  for (const p of pages) portal.appendChild(p);

  const style = document.createElement("style");
  style.id = "ed-print-style";
  style.textContent =
    makePageCss(s) +
    `#ed-print-portal{display:none}
     @media print {
       body.ed-printing > *:not(#ed-print-portal){ display:none !important; }
       body.ed-printing { background:#fff !important; }
       #ed-print-portal{ display:block !important; }
       #ed-print-portal .ed-print-page{ box-shadow:none !important; margin:0 !important; page-break-after:always; break-after:page; }
       #ed-print-portal .ed-print-page:last-child{ page-break-after:auto; break-after:auto; }
     }`;
  document.head.appendChild(style);
  document.body.appendChild(portal);
  document.body.classList.add("ed-printing");

  const cleanup = () => {
    portal.remove();
    style.remove();
    document.body.classList.remove("ed-printing");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 120);
  setTimeout(cleanup, 120000);
}

/* ============================================================
   EKSPOR DOCX — pembangun OOXML dari DOM dokumen
   ============================================================ */

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type RunFmt = {
  b?: boolean; i?: boolean; u?: boolean; s?: boolean; sub?: boolean; sup?: boolean;
  szHalf?: number; color?: string; shd?: string; font?: string;
};

function runFmtFromStyle(style: CSSStyleDeclaration, base: RunFmt): RunFmt {
  const f: RunFmt = { ...base };
  const fs = style.fontSize;
  if (fs) {
    const pt = fs.endsWith("pt") ? parseFloat(fs) : parseFloat(fs) / MM * 0.75;
    if (!isNaN(pt)) f.szHalf = Math.round(pt * 2);
  }
  const c = style.color;
  if (c && c !== "rgb(0, 0, 0)" && c !== "#000" && c !== "black") {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) f.color = hex2(+m[1], +m[2], +m[3]);
    else if (/^#[0-9a-f]{6}$/i.test(c)) f.color = c.slice(1).toUpperCase();
  }
  const bg = style.backgroundColor;
  if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) f.shd = hex2(+m[1], +m[2], +m[3]);
  }
  const fam = style.fontFamily;
  if (fam) f.font = fam.split(",")[0].replace(/["']/g, "").trim();
  return f;
}

function hex2(r: number, g: number, b: number) {
  return [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

type Ctx = {
  rels: string[]; relIdx: number;
  media: { name: string; data: string; mime: string }[];
  hlinks: { id: string; target: string }[];
  settings: DocSettings;
  contentWmm: number;
};

function nextRelId(ctx: Ctx) {
  ctx.relIdx += 1;
  return `rId${ctx.relIdx}`;
}

async function runXml(node: Node, fmt: RunFmt, ctx: Ctx): Promise<string> {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent || "";
    if (!t) return "";
    return `<w:r>${rPr(fmt)}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "br": return `<w:r><w:br/></w:r>`;
    case "b": case "strong": {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, b: true }, ctx);
      return out;
    }
    case "i": case "em": {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, i: true }, ctx);
      return out;
    }
    case "u": {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, u: true }, ctx);
      return out;
    }
    case "s": case "del": {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, s: true }, ctx);
      return out;
    }
    case "sub": case "sup": {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, sub: tag === "sub", sup: tag === "sup" }, ctx);
      return out;
    }
    case "span": case "font": {
      let out = "";
      const f2 = runFmtFromStyle(el.style, fmt);
      if (el.dataset.field === "page") return pageFieldRuns(el.textContent || "", ctx);
      for (const c of Array.from(el.childNodes)) out += await runXml(c, f2, ctx);
      return out;
    }
    case "a": {
      const href = el.getAttribute("href") || "";
      if (/^https?:|^mailto:/i.test(href)) {
        const id = nextRelId(ctx);
        ctx.hlinks.push({ id, target: href });
        let inner = "";
        for (const c of Array.from(el.childNodes)) inner += await runXml(c, { ...fmt, u: true, color: "0563C1" }, ctx);
        return `<w:hyperlink r:id="${id}">${inner}</w:hyperlink>`;
      }
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, { ...fmt, u: true }, ctx);
      return out;
    }
    case "img": return await imageRun(el, ctx);
    default: {
      let out = "";
      for (const c of Array.from(el.childNodes)) out += await runXml(c, fmt, ctx);
      return out;
    }
  }
}

function rPr(f: RunFmt): string {
  let x = "<w:rPr>";
  if (f.font) x += `<w:rFonts w:ascii="${esc(f.font)}" w:hAnsi="${esc(f.font)}"/>`;
  if (f.b) x += "<w:b/>";
  if (f.i) x += "<w:i/>";
  if (f.u) x += '<w:u w:val="single"/>';
  if (f.s) x += '<w:strike w:val="true"/>';
  if (f.sup) x += '<w:vertAlign w:val="superscript"/>';
  if (f.sub) x += '<w:vertAlign w:val="subscript"/>';
  if (f.color) x += `<w:color w:val="${f.color}"/>`;
  if (f.shd) x += `<w:shd w:val="clear" w:color="auto" w:fill="${f.shd}"/>`;
  if (f.szHalf) x += `<w:sz w:val="${f.szHalf}"/><w:szCs w:val="${f.szHalf}"/>`;
  x += "</w:rPr>";
  return x;
}

function pageFieldRuns(_cur: string, _ctx: Ctx): string {
  return (
    `<w:r>${rPr({})}<w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r>${rPr({})}<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>` +
    `<w:r>${rPr({})}<w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r>${rPr({})}<w:t>1</w:t></w:r>` +
    `<w:r>${rPr({})}<w:fldChar w:fldCharType="end"/></w:r>`
  );
}

async function imageRun(img: HTMLImageElement, ctx: Ctx): Promise<string> {
  let src = img.getAttribute("src") || "";
  let mime = "image/png";
  let data: string | null = null;
  if (src.startsWith("data:")) {
    const m = src.match(/^data:([^;]+);base64,(.*)$/);
    if (!m) return "";
    mime = m[1];
    data = m[2];
  } else {
    try {
      const real = src.includes("/_next/image?")
        ? decodeURIComponent(new URL(src, location.href).searchParams.get("url") || src)
        : src;
      const resp = await fetch(real.startsWith("http") ? real : location.origin + real);
      const blob = await resp.blob();
      mime = blob.type || "image/png";
      data = await new Promise<string>((res) => {
        const fr = new FileReader();
        fr.onload = () => res((fr.result as string).split(",")[1] || "");
        fr.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  }
  if (!data) return "";
  const ext = mime.includes("jpeg") ? "jpeg" : mime.includes("gif") ? "gif" : mime.includes("webp") ? "webp" : "png";
  const name = `image${ctx.media.length + 1}.${ext}`;
  ctx.media.push({ name, data, mime });
  const id = nextRelId(ctx);
  ctx.rels.push(
    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`
  );
  let w = parseInt(img.style.width) || img.width || 200;
  let h = parseInt(img.style.height) || img.height || 150;
  if (!img.style.width && !img.style.height) {
    try {
      const im = await loadImage(src.startsWith("data:") ? src : location.origin + src);
      w = im.naturalWidth; h = im.naturalHeight;
    } catch { /* default */ }
  }
  const cx = Math.round(w * 9525);
  const cy = Math.round(h * 9525);
  return (
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${ctx.media.length}" name="${name}"/>` +
    `<wp:graphic><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${ctx.media.length}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:graphic></wp:inline></w:drawing></w:r>`
  );
}

function pPrXml(el: HTMLElement, ctx: Ctx, opts?: { listNumId?: number; ilvl?: number; heading?: number }): string {
  const style = el.style;
  let x = "<w:pPr>";
  if (opts?.heading) x += `<w:pStyle w:val="Heading${opts.heading}"/>`;
  if (opts?.listNumId) {
    x += `<w:numPr><w:ilvl w:val="${opts.ilvl ?? 0}"/><w:numId w:val="${opts.listNumId}"/></w:numPr>`;
    const lvlInd = 720 + 360 * (opts.ilvl ?? 0);
    x += `<w:ind w:left="${lvlInd}" w:hanging="360"/>`;
  } else {
    const ml = parseFloat(style.marginLeft) || 0;
    const mr = parseFloat(style.marginRight) || 0;
    const ti = parseFloat(style.textIndent) || 0;
    if (ml || mr || ti) {
      const hanging = ti < 0 ? Math.abs(px2twip(-ti * MM)) : 0;
      const firstLine = ti > 0 ? px2twip(ti * MM) : 0;
      x += `<w:ind w:left="${px2twip(ml * MM)}" w:right="${px2twip(mr * MM)}"${hanging ? ` w:hanging="${hanging}"` : ""}${firstLine ? ` w:firstLine="${firstLine}"` : ""}/>`;
    }
  }
  const ta = style.textAlign || getComputedStyle(el).textAlign;
  if (ta === "center") x += '<w:jc w:val="center"/>';
  else if (ta === "right" || ta === "end") x += '<w:jc w:val="right"/>';
  else if (ta === "justify") x += '<w:jc w:val="both"/>';
  const mt = parseFloat(style.marginTop) || 0;
  const mb = parseFloat(style.marginBottom) || 0;
  if (mt || mb) x += `<w:spacing w:before="${Math.round(mt * 20)}" w:after="${Math.round(mb * 20)}"/>`;
  const lh = style.lineHeight;
  if (lh && !lh.includes("px")) {
    const v = parseFloat(lh);
    if (!isNaN(v) && v >= 0.8) x += `<w:spacing w:line="${Math.round(v * 240)}" w:lineRule="auto"/>`;
  } else if (lh) {
    x += `<w:spacing w:line="${px2twip(parseFloat(lh))}" w:lineRule="exact"/>`;
  }
  x += "</w:pPr>";
  void ctx;
  return x;
}

async function blockXml(el: HTMLElement, ctx: Ctx, depth = 0): Promise<string> {
  const tag = el.tagName.toLowerCase();
  if (el.hasAttribute("data-pagebreak")) return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  if (tag === "hr") return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr></w:pPr></w:p>';
  if (tag === "table") return tableXml(el as HTMLTableElement, ctx);
  if (tag === "ul" || tag === "ol") {
    let out = "";
    const numId = tag === "ol" ? 2 : 1;
    for (const li of Array.from(el.children)) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const p = document.createElement("p");
      p.style.textAlign = li instanceof HTMLElement ? li.style.textAlign || el.style.textAlign || "" : "";
      while (li.firstChild) p.appendChild(li.firstChild);
      let runs = "";
      for (const c of Array.from(p.childNodes)) runs += await runXml(c, { font: ctx.settings.docFont, szHalf: ctx.settings.docFontSize * 2 }, ctx);
      out += `<w:p>${pPrXml(p, ctx, { listNumId: numId, ilvl: depth })}${runs}</w:p>`;
      const nested = li.querySelector(":scope > ul, :scope > ol");
      if (nested instanceof HTMLElement) out += await blockXml(nested, ctx, depth + 1);
    }
    return out;
  }
  if (el.hasAttribute("data-toc")) {
    let out = "";
    const title = el.querySelector(".toc-title");
    if (title) {
      out += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>${rPr({ b: true, szHalf: 28 })}<w:t>${esc(title.textContent)}</w:t></w:r></w:p>`;
    }
    for (const row of Array.from(el.querySelectorAll(".toc-row"))) {
      const text = row.querySelector(".toc-text")?.textContent || "";
      const page = row.querySelector(".toc-page")?.textContent || "";
      const pos = mm2twip(ctx.contentWmm);
      out +=
        `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${pos}"/></w:tabs>` +
        `<w:ind w:left="${(parseInt(row.className.replace(/.*toc-l/, "")) || 1) - 1 ? ((parseInt(row.className.replace(/.*toc-l/, "")) || 1) - 1) * 340 : 0}"/></w:pPr>` +
        `<w:r>${rPr({})}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>` +
        `<w:r>${rPr({})}<w:tab/></w:r>` +
        `<w:r>${rPr({})}<w:t>${esc(page)}</w:t></w:r></w:p>`;
    }
    return out;
  }
  // paragraf / heading / div / blockquote / figure
  const headings: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4 };
  const heading = headings[tag];
  let runs = "";
  for (const c of Array.from(el.childNodes)) runs += await runXml(c, { font: ctx.settings.docFont, szHalf: ctx.settings.docFontSize * 2 }, ctx);
  if (!runs) runs = "";
  return `<w:p>${pPrXml(el, ctx, heading ? { heading } : undefined)}${runs}</w:p>`;
}

async function tableXml(table: HTMLTableElement, ctx: Ctx): Promise<string> {
  const grid = buildGrid(table);
  const nCols = grid[0]?.length ?? 1;
  const wMm = (parseFloat(table.style.width) || ctx.contentWmm);
  let x = "<w:tbl><w:tblPr>";
  x += `<w:tblW w:w="${mm2twip(wMm)}" w:type="dxa"/>`;
  const ta = table.style.marginLeft === "auto" && table.style.marginRight === "auto" ? "center" : table.style.marginLeft === "auto" ? "right" : "left";
  if (ta !== "left") x += `<w:jc w:val="${ta}"/>`;
  x += '<w:tblBorders>' + ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join("") + '</w:tblBorders>';
  x += '<w:tblLayout w:type="fixed"/></w:tblPr>';
  // grid
  x += "<w:tblGrid>";
  for (let c = 0; c < nCols; c++) {
    const col = table.querySelector(`colgroup col:nth-child(${c + 1})`);
    const wmm = col ? parseFloat((col as HTMLElement).style.width) || (wMm / nCols) : wMm / nCols;
    x += `<w:gridCol w:w="${mm2twip(wmm)}"/>`;
  }
  x += "</w:tblGrid>";
  for (const tr of Array.from(table.rows)) {
    x += "<w:tr>";
    for (const td of Array.from(tr.cells)) {
      x += "<w:tc><w:tcPr>";
      const colspan = td.colSpan || 1;
      if (colspan > 1) x += `<w:gridSpan w:val="${colspan}"/>`;
      const rowspan = td.rowSpan || 1;
      if (rowspan > 1) x += `<w:vMerge w:val="restart"/>`;
      const bg = td.style.backgroundColor;
      if (bg && bg !== "transparent") {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) x += `<w:shd w:val="clear" w:color="auto" w:fill="${hex2(+m[1], +m[2], +m[3])}"/>`;
      }
      const va = td.style.verticalAlign;
      if (va === "middle") x += '<w:vAlign w:val="center"/>';
      else if (va === "bottom") x += '<w:vAlign w:val="bottom"/>';
      const colW = mm2twip(wMm / nCols) * colspan;
      x += `<w:tcW w:w="${colW}" w:type="dxa"/></w:tcPr>`;
      const paras = Array.from(td.children).filter((c) => c instanceof HTMLElement);
      if (paras.length) {
        for (const p of paras) x += await blockXml(p as HTMLElement, ctx, 0);
      } else if (td.textContent?.trim()) {
        x += `<w:p>${pPrXml(td, ctx)}${await runXml(td.firstChild || td, {}, ctx)}</w:p>`;
      } else {
        x += "<w:p/>";
      }
      x += "</w:tc>";
    }
    // sel yang tertutup rowspan baris-baris berikutnya → vMerge continue
    x += "</w:tr>";
  }
  x += "</w:tbl>";
  return x;
}

export async function exportDOCX(
  title: string,
  body: HTMLElement,
  s: DocSettings,
  headerHtml: string,
  headerFirstHtml: string,
  footerHtml: string,
  footerFirstHtml: string
) {
  const zip = new JSZip();
  const ctx: Ctx = { rels: [], relIdx: 2, media: [], hlinks: [], settings: s, contentWmm: effectivePaper(s).w - s.margins.left - s.margins.right };

  let bodyXml = "";
  for (const block of Array.from(body.children) as HTMLElement[]) {
    bodyXml += await blockXml(block, ctx, 0);
  }

  // sectPr + header/footer
  const paper = effectivePaper(s);
  let sectPr =
    `<w:sectPr><w:pgSz w:w="${mm2twip(paper.w)}" w:h="${mm2twip(paper.h)}"${s.orientation === "landscape" ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${mm2twip(s.margins.top)}" w:right="${mm2twip(s.margins.right)}" w:bottom="${mm2twip(s.margins.bottom)}" w:left="${mm2twip(s.margins.left)}" w:header="${mm2twip(s.headerDist)}" w:footer="${mm2twip(s.footerDist)}" w:gutter="0"/>`;
  let relXml =
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>`;

  if (headerHtml || headerFirstHtml) {
    sectPr += '<w:headerReference w:type="default" r:id="rIdH1"/>';
    relXml += `<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>`;
    if (s.differentFirstPage) {
      sectPr += '<w:headerReference w:type="first" r:id="rIdH2"/>';
      relXml += `<Relationship Id="rIdH2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header2.xml"/>`;
    }
  }
  if (footerHtml || footerFirstHtml) {
    sectPr += '<w:footerReference w:type="default" r:id="rIdF1"/>';
    relXml += `<Relationship Id="rIdF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`;
    if (s.differentFirstPage) {
      sectPr += '<w:footerReference w:type="first" r:id="rIdF2"/>';
      relXml += `<Relationship Id="rIdF2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>`;
    }
  }
  if (s.differentFirstPage) sectPr += "<w:titlePg/>";
  sectPr += '<w:docGrid w:linePitch="360"/></w:sectPr>';

  const hctx = (): Ctx => ({ rels: [], relIdx: 2, media: [], hlinks: [], settings: s, contentWmm: ctx.contentWmm });
  const hfParas = async (html: string) => {
    if (!html) return "<w:p/>";
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    let out = "";
    for (const el of Array.from(wrap.children) as HTMLElement[]) out += await blockXml(el, hctx(), 0);
    return out || "<w:p/>";
  };
  const hfFiles: { name: string; html: string; isHeader: boolean }[] = [];
  if (headerHtml) hfFiles.push({ name: "header1.xml", html: headerHtml, isHeader: true });
  if (headerFirstHtml && s.differentFirstPage) hfFiles.push({ name: "header2.xml", html: headerFirstHtml || headerHtml, isHeader: true });
  if (footerHtml) hfFiles.push({ name: "footer1.xml", html: footerHtml, isHeader: false });
  if (footerFirstHtml && s.differentFirstPage) hfFiles.push({ name: "footer2.xml", html: footerFirstHtml || footerHtml, isHeader: false });
  for (const hf of hfFiles) {
    zip.file(
      `word/${hf.name}`,
      xmlWrap(`<w:${hf.isHeader ? "hdr" : "ftr"} ${NS}>${await hfParas(hf.html)}</w:${hf.isHeader ? "hdr" : "ftr"}>`)
    );
  }

  zip.file(
    "word/document.xml",
    xmlWrap(`<w:document ${NS}><w:body>${bodyXml}${sectPr}</w:body></w:document>`)
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relXml}${ctx.rels.join("")}${ctx.hlinks.map((h) => `<Relationship Id="${h.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(h.target)}" TargetMode="External"/>`).join("")}</Relationships>`
  );
  zip.file(
    "word/styles.xml",
    xmlWrap(`<w:styles ${NS}>
      <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${esc(s.docFont)}" w:hAnsi="${esc(s.docFont)}"/><w:sz w:val="${s.docFontSize * 2}"/><w:szCs w:val="${s.docFontSize * 2}"/></w:rPr></w:rPrDefault>
      <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
      ${[1, 2, 3, 4].map((i) => `<w:style w:type="paragraph" w:styleId="Heading${i}"><w:name w:val="heading ${i}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="${i - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${28 - i * 2}"/></w:rPr></w:style>`).join("")}
    </w:styles>`)
  );
  zip.file(
    "word/numbering.xml",
    xmlWrap(`<w:numbering ${NS}>
      <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
        ${[0, 1, 2].map((l) => `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + 360 * l}" w:hanging="360"/></w:pPr></w:lvl>`).join("")}
      </w:abstractNum>
      <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>
        ${[0, 1, 2].map((l) => `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%${l + 1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + 360 * l}" w:hanging="360"/></w:pPr></w:lvl>`).join("")}
      </w:abstractNum>
      <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
    </w:numbering>`)
  );
  for (const m of ctx.media) zip.file(`word/media/${m.name}`, m.data, { base64: true });

  // [Content_Types]
  const overrides = ["document", "styles", "numbering"]
    .map((n) => `<Override PartName="/word/${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${n === "document" ? "document.main" : n + ".xml"}"/>`)
    .join("");
  let ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="webp" ContentType="image/webp"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>` +
    (headerHtml ? `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` : "") +
    (headerFirstHtml && s.differentFirstPage ? `<Override PartName="/word/header2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` : "") +
    (footerHtml ? `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` : "") +
    (footerFirstHtml && s.differentFirstPage ? `<Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` : "") +
    `</Types>`;
  void overrides;
  zip.file("[Content_Types].xml", ct);
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  );

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const safe = (title || "dokumen").replace(/[^\w\s\-—]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  downloadBlob(blob, `${safe || "dokumen"}.docx`);
}

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

function xmlWrap(inner: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${inner}`;
}

/* ---------------- Ekspor HTML / TXT ---------------- */

export async function exportHTML(title: string, bodyHtml: string, s: DocSettings) {
  const paper = effectivePaper(s);
  const inlined = await inlineImages(bodyHtml);
  const css = `body{background:#888;margin:0;padding:24px 0}
  .page{width:${paper.w}mm;min-height:${paper.h}mm;margin:0 auto;background:#fff;box-sizing:border-box;padding:${s.margins.top}mm ${s.margins.right}mm ${s.margins.bottom}mm ${s.margins.left}mm;font-family:'${s.docFont}',serif;font-size:${s.docFontSize}pt;line-height:1.5;color:#000}
  p{margin:2mm 0} h1{font-size:16pt} h2{font-size:14pt} h3{font-size:12.5pt} h4{font-size:11.5pt}
  table{border-collapse:collapse} td,th{border:1px solid #000;padding:1mm 1.5mm;vertical-align:top}
  th{text-align:center;font-weight:bold;background:#f2f2f2}
  blockquote{border-left:3px solid #999;margin:2mm 0;padding:1mm 4mm;color:#444}
  .doc-style-title{font-size:20pt;font-weight:bold;text-align:center} .doc-style-subtitle{font-size:14pt;text-align:center;color:#444}
  .doc-style-quote{border-left:3px solid #999;margin:2mm 0;padding:1mm 4mm;color:#444;font-style:italic}
  .doc-style-caption{font-size:9pt;color:#555;text-align:center}
  ul,ol{margin:2mm 0;padding-left:8mm}
  .toc{border:0} .toc-title{font-weight:bold;font-size:13pt;text-align:center;margin-bottom:3mm}
  .toc-row{display:flex;align-items:baseline;gap:2mm} .toc-leader{flex:1;border-bottom:1px dotted #000}
  img{max-width:100%} .page-break{page-break-after:always;border:0}
  [contenteditable]{outline:none}`;
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><div class="page">${inlined}</div></body></html>`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${safeName(title)}.html`);
}

export function exportTXT(title: string, text: string) {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${safeName(title)}.txt`);
}

export function safeName(s: string) {
  return (s || "dokumen").replace(/[^\w\s\-—]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "dokumen";
}

/* ---------------- Impor ---------------- */

export async function importDOCX(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  // mammoth browser build
  const mod = (await import("mammoth/mammoth.browser.min.js")) as unknown as {
    convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: unknown[] }>;
  };
  const result = await mod.convertToHtml({ arrayBuffer: buf });
  return result.value || "";
}

export function importHTMLText(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const bodyHtml = doc.body ? doc.body.innerHTML : text;
  return bodyHtml;
}

export function importTXT(text: string): string {
  const lines = text.split(/\r?\n/);
  return lines.map((l) => `<p>${l.trim() ? esc(l) : "<br>"}</p>`).join("");
}
