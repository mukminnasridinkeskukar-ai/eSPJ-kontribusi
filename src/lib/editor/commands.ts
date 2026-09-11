// ============================================================
// Editor Dokumen — mesin perintah: undo/redo, caret, format, sanitizer
// ============================================================

/* ---------------- Undo / Redo (snapshot) ---------------- */

export type Snapshot = { html: string; caret: string | null };

/** Path caret diserialisasi: "i.j.k:offset" (indeks anak berantai + offset) */
export function getCaretPath(root: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer)) return null;
  const idxs: number[] = [];
  let node: Node | null = r.startContainer;
  while (node && node !== root) {
    const parent = node.parentNode;
    if (!parent) return null;
    let i = 0;
    for (let c = parent.firstChild; c && c !== node; c = c.nextSibling) i++;
    idxs.unshift(i);
    node = parent;
  }
  // offset: jika text node → karakter; jika element → indeks anak
  const off =
    r.startContainer.nodeType === Node.TEXT_NODE
      ? r.startOffset
      : idxs.length; // offset element tidak presisi — cukup caret path
  void off;
  return idxs.join(".") + ":" + r.startOffset;
}

export function setCaretPath(root: HTMLElement, path: string | null): boolean {
  if (!path) return false;
  const [idPart, offStr] = path.split(":");
  const idxs = idPart ? idPart.split(".").map((n) => parseInt(n, 10)) : [];
  let node: Node = root;
  for (const i of idxs) {
    if (!node.childNodes) return false;
    const next = node.childNodes[Math.min(i, node.childNodes.length - 1)];
    if (!next) return false;
    node = next;
  }
  try {
    const sel = window.getSelection();
    const r = document.createRange();
    const off = parseInt(offStr || "0", 10) || 0;
    if (node.nodeType === Node.TEXT_NODE) {
      r.setStart(node, Math.min(off, (node as Text).length));
      r.collapse(true);
    } else {
      // cari text node terdekat agar caret valid
      const tn = firstDeepText(node as Element);
      if (tn) {
        r.setStart(tn, Math.min(off, tn.length));
      } else {
        r.setStart(node, Math.min(off, node.childNodes.length));
      }
      r.collapse(true);
    }
    sel?.removeAllRanges();
    sel?.addRange(r);
    return true;
  } catch {
    return false;
  }
}

function firstDeepText(el: Element | null): Text | null {
  if (!el) return null;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  return w.nextNode() as Text | null;
}

export class UndoStack {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private readonly max = 80;
  constructor(private root: HTMLElement, initial?: Snapshot) {
    if (initial) this.past.push(initial);
  }
  get canUndo() {
    return this.past.length > 1;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  /** simpan keadaan sekarang (sebelum perubahan programatik / setelah mengetik) */
  push() {
    const snap: Snapshot = { html: this.root.innerHTML, caret: getCaretPath(this.root) };
    if (this.past.length && this.past[this.past.length - 1].html === snap.html) return;
    this.past.push(snap);
    if (this.past.length > this.max) this.past.shift();
    this.future = [];
  }
  undo(): Snapshot | null {
    if (this.past.length <= 1) return null;
    const cur = this.past.pop()!;
    this.future.push(cur);
    return this.past[this.past.length - 1];
  }
  redo(): Snapshot | null {
    const nxt = this.future.pop();
    if (!nxt) return null;
    this.past.push(nxt);
    return nxt;
  }
}

/* ---------------- Eksekusi perintah format ---------------- */

export function focusEditor(root: HTMLElement) {
  if (!root.contains(document.getSelection()?.anchorNode)) root.focus();
}

export function exec(cmd: string, val?: string) {
  try {
    document.execCommand(cmd, false, val);
  } catch {
    /* diabaikan */
  }
}

/** Ganti <font size="7"> hasil execCommand menjadi span ukuran pt */
function normalizeFontTags(root: HTMLElement, pt: number) {
  root.querySelectorAll('font[size="7"]').forEach((f) => {
    const span = document.createElement("span");
    span.style.fontSize = pt + "pt";
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
}

export function setFontSize(root: HTMLElement, pt: number) {
  focusEditor(root);
  exec("fontSize", "7");
  normalizeFontTags(root, pt);
}

export function setFontFamily(root: HTMLElement, fam: string) {
  focusEditor(root);
  exec("fontName", fam);
  // rapikan: bungkus font[face] → span
  root.querySelectorAll("font[face]").forEach((f) => {
    const span = document.createElement("span");
    span.style.fontFamily = f.getAttribute("face") || "";
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
}

export function setTextColor(root: HTMLElement, color: string) {
  focusEditor(root);
  exec("foreColor", color);
}

export function setHighlight(root: HTMLElement, color: string) {
  focusEditor(root);
  exec("hiliteColor", color);
}

export function clearFormatting(root: HTMLElement) {
  focusEditor(root);
  exec("removeFormat");
  // hapus style blok pada paragraf terpilih
  const blocks = selectedBlocks(root);
  for (const b of blocks) {
    if (b instanceof HTMLElement) {
      b.style.lineHeight = "";
      b.style.textIndent = "";
      b.style.marginLeft = "";
      b.style.marginRight = "";
      b.style.marginTop = "";
      b.style.marginBottom = "";
      if (b.tagName === "DIV" && b.getAttribute("data-style")) applyTag(b, "p");
    }
  }
}

/** Kumpulkan blok unik yang tersentuh seleksi */
export function selectedBlocks(root: HTMLElement): Element[] {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return [];
  const out: Element[] = [];
  const seen = new Set<Node>();
  const pushBlock = (n: Node | null) => {
    let node: Node | null = n;
    while (node && node !== root && !(node instanceof Element && isBlockEl(node))) {
      node = node.parentNode;
    }
    if (node && node instanceof Element && !seen.has(node)) {
      seen.add(node);
      out.push(node);
    }
  };
  if (sel.isCollapsed) {
    pushBlock(sel.anchorNode);
    return out;
  }
  const r = sel.getRangeAt(0);
  pushBlock(r.startContainer);
  // semua elemen di antara
  const blocks = root.querySelectorAll("p,h1,h2,h3,h4,div,li,blockquote,td,th");
  for (const b of blocks) {
    if (sel.containsNode(b, true)) pushBlock(b);
  }
  return out;
}

export function isBlockEl(el: Element): boolean {
  const t = el.tagName;
  return (
    t === "P" || t === "DIV" || t === "H1" || t === "H2" || t === "H3" || t === "H4" ||
    t === "LI" || t === "BLOCKQUOTE" || t === "TD" || t === "TH" || t === "FIGCAPTION"
  );
}

/** Terapkan tag blok mempertahankan isi (untuk style gallery) */
export function applyTag(el: Element, tag: string, className?: string) {
  const doc = el.ownerDocument;
  const neu = doc.createElement(tag);
  if (className) neu.className = className;
  while (el.firstChild) neu.appendChild(el.firstChild);
  // pindahkan style relevan
  if (el instanceof HTMLElement) {
    for (const p of ["text-align", "margin-left", "margin-right", "margin-top", "margin-bottom", "text-indent", "line-height"]) {
      const v = el.style.getPropertyValue(p);
      if (v) (neu as HTMLElement).style.setProperty(p, v);
    }
    if (el.getAttribute("data-tabs")) neu.setAttribute("data-tabs", el.getAttribute("data-tabs")!);
  }
  el.replaceWith(neu);
  return neu;
}

export type StyleName =
  | "normal" | "title" | "subtitle" | "h1" | "h2" | "h3" | "h4" | "quote" | "caption";

const STYLE_MAP: Record<StyleName, { tag: string; cls?: string }> = {
  normal: { tag: "p" },
  title: { tag: "div", cls: "doc-style-title" },
  subtitle: { tag: "div", cls: "doc-style-subtitle" },
  h1: { tag: "h1", cls: "doc-h1" },
  h2: { tag: "h2", cls: "doc-h2" },
  h3: { tag: "h3", cls: "doc-h3" },
  h4: { tag: "h4", cls: "doc-h4" },
  quote: { tag: "blockquote", cls: "doc-style-quote" },
  caption: { tag: "p", cls: "doc-style-caption" },
};

export function applyParagraphStyle(root: HTMLElement, name: StyleName) {
  focusEditor(root);
  const { tag, cls } = STYLE_MAP[name];
  const blocks = selectedBlocks(root);
  if (!blocks.length) {
    exec("formatBlock", tag === "div" ? "p" : tag);
    return;
  }
  for (const b of blocks) {
    if (b.tagName === "TD" || b.tagName === "TH" || b.tagName === "LI") {
      exec("formatBlock", tag === "div" ? "p" : tag);
      continue;
    }
    const neu = applyTag(b, tag, cls);
    // pertahankan caret di elemen baru
    const tn = firstDeepText(neu);
    if (tn) {
      try {
        const r = document.createRange();
        r.setStart(tn, 0);
        r.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      } catch { /* diabaikan */ }
    }
  }
}

/* ---------------- Properti paragraf ---------------- */

export function setLineSpacing(root: HTMLElement, value: string) {
  const blocks = selectedBlocks(root);
  for (const b of blocks) (b as HTMLElement).style.lineHeight = value;
}

export function setSpacing(root: HTMLElement, beforePt: number | null, afterPt: number | null) {
  const blocks = selectedBlocks(root);
  for (const b of blocks) {
    if (beforePt !== null) (b as HTMLElement).style.marginTop = beforePt + "pt";
    if (afterPt !== null) (b as HTMLElement).style.marginBottom = afterPt + "pt";
  }
}

export function setIndent(
  root: HTMLElement,
  opts: { leftMm?: number | null; rightMm?: number | null; firstMm?: number | null; hangingMm?: number | null }
) {
  const blocks = selectedBlocks(root);
  for (const b of blocks) {
    const el = b as HTMLElement;
    if (opts.leftMm !== null && opts.leftMm !== undefined) el.style.marginLeft = opts.leftMm + "mm";
    if (opts.rightMm !== null && opts.rightMm !== undefined) el.style.marginRight = opts.rightMm + "mm";
    if (opts.hangingMm != null && opts.hangingMm > 0) {
      el.style.textIndent = "-" + opts.hangingMm + "mm";
      if (!el.style.marginLeft) el.style.marginLeft = opts.hangingMm + "mm";
    } else if (opts.firstMm != null) {
      el.style.textIndent = opts.firstMm + "mm";
    }
  }
}

export function changeIndent(root: HTMLElement, dir: 1 | -1) {
  const blocks = selectedBlocks(root);
  const step = 12.7;
  if (blocks.some((b) => b.tagName === "LI")) {
    exec(dir === 1 ? "indent" : "outdent");
    return;
  }
  for (const b of blocks) {
    const el = b as HTMLElement;
    const cur = parseFloat(el.style.marginLeft) || 0;
    el.style.marginLeft = Math.max(0, cur + dir * step) + "mm";
  }
}

/* ---------------- Daftar (list) ---------------- */

export function setMultilevel(root: HTMLElement, on: boolean) {
  const sel = window.getSelection();
  if (!sel) return;
  const anchor = sel.anchorNode;
  if (!anchor) return;
  const list = (anchor instanceof Element ? anchor : anchor.parentElement)?.closest("ol,ul");
  if (list instanceof HTMLElement) {
    if (on) list.classList.add("ml-list");
    else list.classList.remove("ml-list");
  }
}

export function restartNumbering(root: HTMLElement, start: number) {
  const sel = window.getSelection();
  const anchor = sel?.anchorNode;
  const ol = (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest("ol");
  if (ol instanceof HTMLOListElement) ol.setAttribute("start", String(start));
}

export function continueNumbering(root: HTMLElement) {
  const sel = window.getSelection();
  const anchor = sel?.anchorNode;
  const ol = (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest("ol");
  if (ol instanceof HTMLOListElement) ol.removeAttribute("start");
}

/* ---------------- Penyisipan ---------------- */

export function insertPageBreak(root: HTMLElement) {
  focusEditor(root);
  exec(
    "insertHTML",
    `<div class="page-break" data-pagebreak="1" contenteditable="false"><span>Pemisah Halaman</span></div><p><br></p>`
  );
}

export function insertLink(root: HTMLElement, url: string, text?: string) {
  focusEditor(root);
  const safe = url.startsWith("http") || url.startsWith("mailto:") ? url : "https://" + url;
  if (text && !window.getSelection()?.toString()) {
    exec("insertHTML", `<a href="${escapeAttr(safe)}">${escapeHtml(text)}</a>`);
  } else {
    exec("createLink", safe);
  }
}

export function removeLink(root: HTMLElement) {
  focusEditor(root);
  exec("unlink");
}

export function insertDateTime(root: HTMLElement) {
  focusEditor(root);
  const d = new Date();
  const t = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  exec("insertText", t);
}

export function insertFieldPage(root: HTMLElement) {
  focusEditor(root);
  exec(
    "insertHTML",
    `<span class="pn-field" data-field="page" contenteditable="false" title="Nomor halaman otomatis">1</span>`
  );
}

export function insertSymbol(root: HTMLElement, ch: string) {
  focusEditor(root);
  exec("insertHTML", escapeHtml(ch));
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* ---------------- Tab stop & tombol Tab ---------------- */

export type TabStop = { pos: number; type: "left" | "center" | "right" }; // pos dalam mm dari indent kiri

export function getTabStops(el: Element | null): TabStop[] {
  if (!el || !el.getAttribute) return [];
  try {
    return JSON.parse(el.getAttribute("data-tabs") || "[]");
  } catch {
    return [];
  }
}

export function setTabStops(el: HTMLElement, stops: TabStop[]) {
  el.setAttribute("data-tabs", JSON.stringify(stops));
}

/** Tombol Tab: sisipkan spacer menuju stop berikutnya (default 1,27 cm) */
export function handleTabKey(root: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const r = sel.getRangeAt(0);
  const li = (r.startContainer instanceof Element ? r.startContainer : r.startContainer.parentElement)?.closest("li");
  if (li) {
    exec("indent"); // daftar: Tab menaikkan level
    return true;
  }
  const block = (r.startContainer instanceof Element ? r.startContainer : r.startContainer.parentElement)?.closest("p,div,h1,h2,h3,h4,blockquote,td,th") as HTMLElement | null;
  const stops = getTabStops(block);
  const paperLeft = block ? block.getBoundingClientRect().left : 0;
  const caretX = r.startContainer instanceof Element && r.collapsed
    ? r.startContainer.getBoundingClientRect().left
    : (r.getClientRects()[0]?.left ?? 0);
  const offsetMm = Math.max(0, (caretX - paperLeft) / MM);
  const next = [...stops].sort((a, b) => a.pos - b.pos).find((s) => s.pos > offsetMm + 0.5);
  const widthMm = next ? next.pos - offsetMm : 12.7 - (offsetMm % 12.7);
  const alignCls = next && next.type !== "left" ? ` tab-${next.type}` : "";
  if (alignCls) {
    // tab center/kanan: teks yang diketik setelah tab rata di titik stop
    exec(
      "insertHTML",
      `<span class="tabstop-wrap${alignCls}" style="width:${Math.max(1, widthMm)}mm" contenteditable="true">&#8203;</span>`
    );
    // pindahkan caret ke dalam span
    const span = Array.from(root.querySelectorAll(".tabstop-wrap")).pop();
    if (span) {
      const tn = span.firstChild;
      if (tn) {
        try {
          const nr = document.createRange();
          nr.setStart(tn, 1);
          nr.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nr);
        } catch { /* diabaikan */ }
      }
    }
  } else {
    exec("insertHTML", `<span class="tabstop" style="width:${Math.max(1, widthMm)}mm" contenteditable="false"></span>`);
  }
  return true;
}

/* ---------------- Sanitizer ---------------- */

const ALLOWED_TAGS = new Set([
  "p","div","h1","h2","h3","h4","ul","ol","li","table","thead","tbody","tfoot","tr","td","th",
  "colgroup","col","img","a","b","strong","i","em","u","s","strike","del","sub","sup","span",
  "br","hr","blockquote","figure","figcaption","caption",
]);
const ALLOWED_STYLE = new Set([
  "color","background-color","font-size","font-family","font-weight","font-style",
  "text-align","text-decoration","text-indent","line-height","margin-left","margin-right",
  "margin-top","margin-bottom","width","height","vertical-align","border","padding",
]);
const ALLOWED_ATTRS = new Set(["src", "alt", "href", "colspan", "rowspan", "width", "height", "data-tabs", "data-field", "data-pagebreak", "data-toc", "class", "start", "title"]);

/** Bersihkan HTML luar (paste / impor) menjadi struktur aman editor */
export function sanitizeHtml(html: string, opts?: { keepStyles?: boolean }): string {
  const keepStyles = opts?.keepStyles ?? true;
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const body = parsed.body;

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        walk(child);
        continue;
      }
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "meta" || tag === "link" || tag === "o:p") {
        el.remove();
        continue;
      }
      walk(el);
      if (!ALLOWED_TAGS.has(tag)) {
        // bongkar: ganti dengan isi (mis. font, mso div, section)
        if (tag === "font") {
          const span = parsed.createElement("span");
          const color = el.getAttribute("color");
          const size = el.getAttribute("size");
          if (color) span.setAttribute("style", `color:${color}`);
          if (size) span.setAttribute("style", `font-size:${{ 1: "8pt", 2: "10pt", 3: "12pt", 4: "14pt", 5: "18pt", 6: "24pt", 7: "36pt" }[size] ?? "12pt"}`);
          while (el.firstChild) span.appendChild(el.firstChild);
          el.replaceWith(span);
        } else {
          const frag = parsed.createDocumentFragment();
          while (el.firstChild) frag.appendChild(el.firstChild);
          el.replaceWith(frag);
        }
        continue;
      }
      // atribut
      for (const attr of Array.from(el.attributes)) {
        const n = attr.name.toLowerCase();
        if (n === "style") {
          if (!keepStyles) { el.removeAttribute("style"); continue; }
          const clean = attr.value
            .split(";")
            .map((s) => s.trim())
            .filter((s) => {
              const prop = s.split(":")[0]?.trim().toLowerCase();
              return prop && ALLOWED_STYLE.has(prop);
            })
            .join("; ");
          if (clean) el.setAttribute("style", clean);
          else el.removeAttribute("style");
          continue;
        }
        if (!ALLOWED_ATTRS.has(n)) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (n === "src" || n === "href") {
          const v = attr.value.trim();
          if (n === "href" && /^(javascript|data):/i.test(v)) { el.removeAttribute(attr.name); continue; }
          if (n === "src" && /^(javascript):/i.test(v)) { el.removeAttribute(attr.name); continue; }
        }
      }
      // normalisasi
      if (tag === "strike" || tag === "del") {
        const s = parsed.createElement("s");
        while (el.firstChild) s.appendChild(el.firstChild);
        el.replaceWith(s);
      } else if (tag === "em") {
        const i = parsed.createElement("i");
        while (el.firstChild) i.appendChild(el.firstChild);
        el.replaceWith(i);
      } else if (tag === "strong") {
        const b = parsed.createElement("b");
        while (el.firstChild) b.appendChild(el.firstChild);
        el.replaceWith(b);
      }
    }
  };
  walk(body);

  // gambar data URL besar dibiarkan (diproses terpisah oleh pemampat)
  return body.innerHTML;
}

/** Bungkus isi telanjang (teks/inline) menjadi paragraf; pastikan elemen blok */
export function ensureBlockStructure(html: string): string {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const blocks: string[] = [];
  let inlineBuf = "";
  const flush = () => {
    if (inlineBuf.trim()) blocks.push(`<p>${inlineBuf}</p>`);
    inlineBuf = "";
  };
  for (const n of Array.from(wrap.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) {
      inlineBuf += escapeHtml(n.textContent || "");
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element;
      if (isBlockEl(el)) {
        flush();
        blocks.push(el.outerHTML);
      } else {
        inlineBuf += el.outerHTML;
      }
    }
  }
  flush();
  return blocks.join("") || "<p><br></p>";
}
