"use client";

// ============================================================
// Editor Dokumen — orkestrator utama: muat/simpan dokumen,
// perintah format, paginasi, auto-save, versi, ekspor/impor
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ribbon, { RibbonActions, RibbonFlags, SaveState } from "./Ribbon";
import Canvas, { Zone } from "./Canvas";
import { ContextMenu, CtxMenuState, FindReplaceBar, OutlinePanel, OutlineNode, RulerBar, StatusBar } from "./Panels";
import {
  ImageDialog, InsertTableDialog, LinkDialog, PageNumberDialog, PageSetupDialog,
  ParagraphDialog, ParagraphProps, ReviewDialog, TablePropsDialog, TabStopsDialog, VersionsDialog,
} from "./Dialogs";
import { useToast } from "@/hooks/use-toast";
import {
  DocSettings, FullDoc, MM, contentHeight, contentWidth, defaultSettings, effectivePaper, parseSettings,
} from "@/lib/editor/types";
import {
  StyleName, TabStop, UndoStack, applyParagraphStyle, changeIndent, clearFormatting, continueNumbering,
  exec, insertDateTime, insertFieldPage, insertLink, insertPageBreak, insertSymbol,
  isBlockEl, removeLink, restartNumbering, setCaretPath, setFontFamily, setFontSize,
  setHighlight, setIndent, setLineSpacing, setMultilevel, setSpacing, setTextColor, ensureBlockStructure,
  sanitizeHtml, getTabStops, setTabStops, handleTabKey, escapeHtml,
} from "@/lib/editor/commands";
import {
  addCol, addRow, clearCellSelection, deleteCol, deleteRow, findTable, findTd,
  getSelectedCells, makeTableHtml, mergeCells, setCellPadding,
  setTableAlignment, setTableBorders, setTableWidth, splitCell, clearTableBorders,
  toggleHeaderRow,
} from "@/lib/editor/tables";
import {
  PageMap, buildPrintPages, collectHeadings, ensureHeadingIds, formatPageNo,
  paginate, updateToc,
} from "@/lib/editor/paginate";
import {
  compressImageFile, exportDOCX, exportHTML, exportTXT, importDOCX, importHTMLText, printDocument,
} from "@/lib/editor/io";
import { PAPER_SIZES, MARGIN_PRESETS } from "@/lib/editor/types";

export default function DocumentEditor({
  docId, onClosed, onDocChanged,
}: {
  docId: string; onClosed: () => void; onDocChanged?: () => void;
}) {
  const { toast } = useToast();
  // ---- state dasar ----
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Dokumen");
  const [settings, setSettings] = useState<DocSettings>(defaultSettings());
  const [zone, setZone] = useState<Zone>("body");
  const [tab, setTab] = useState("home");
  const [zoom, setZoom] = useState(0.75);
  const [ruler, setRuler] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [preview, setPreview] = useState(false);
  const [spellcheck, setSpellcheck] = useState(false);
  const [lang, setLang] = useState("id-ID");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);
  const [outlineNodes, setOutlineNodes] = useState<OutlineNode[]>([]);
  const [currentHeading, setCurrentHeading] = useState<string | null>(null);

  // ---- flags seleksi ----
  const [flags, setFlags] = useState({ bold: false, italic: false, underline: false, align: "left" as "left" | "center" | "right" | "justify" });
  const [rulerVals, setRulerVals] = useState({ firstMm: 0, hangMm: 0, leftMm: 0, rightMm: 0, tabs: [] as TabStop[] });

  // ---- dialog ----
  const [dlgPageSetup, setDlgPageSetup] = useState(false);
  const [dlgParagraph, setDlgParagraph] = useState(false);
  const [dlgInsertTable, setDlgInsertTable] = useState(false);
  const [dlgTableProps, setDlgTableProps] = useState(false);
  const [dlgImage, setDlgImage] = useState(false);
  const [dlgLink, setDlgLink] = useState(false);
  const [dlgTabs, setDlgTabs] = useState(false);
  const [dlgVersions, setDlgVersions] = useState(false);
  const [dlgReview, setDlgReview] = useState(false);
  const [dlgPageNumber, setDlgPageNumber] = useState(false);
  const [versions, setVersions] = useState<{ id: string; label: string; author: string; title: string; createdAt: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [linkInitial, setLinkInitial] = useState("");
  const [tabPosMm, setTabPosMm] = useState(12.7);
  const [reviewStats, setReviewStats] = useState({ words: 0, chars: 0, charsNoSpace: 0, paragraphs: 0, tables: 0, images: 0, headings: 0 });

  // ---- cari & ganti ----
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [findCount, setFindCount] = useState(0);
  const [findIdx, setFindIdx] = useState(0);

  // ---- menu konteks ----
  const [ctx, setCtx] = useState<CtxMenuState>(null);
  const ctxTarget = useRef<HTMLElement | null>(null);

  // ---- refs ----
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerFirstRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const footerFirstRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const undoMap = useRef<Record<Zone, UndoStack | null>>({
    body: null, header: null, headerFirst: null, footer: null, footerFirst: null,
  });
  const docRef = useRef<FullDoc | null>(null);
  const pageMapRef = useRef<PageMap | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recomputeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoneRef = useRef<Zone>("body");
  const settingsRef = useRef(settings);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const stackFor = (z: Zone = "body") => {
    if (!undoMap.current[z]) {
      const root = z === "body" ? bodyRef.current : z === "header" ? headerRef.current
        : z === "headerFirst" ? headerFirstRef.current : z === "footer" ? footerRef.current : footerFirstRef.current;
      if (root) undoMap.current[z] = new UndoStack(root, { html: root.innerHTML, caret: null });
    }
    return undoMap.current[z];
  };
  settingsRef.current = settings;
  zoneRef.current = zone;

  /* ================= Muat dokumen ================= */

  /** Naikkan pemisah halaman bersarang ke level blok teratas */
  const hoistPageBreaks = useCallback((body: HTMLElement) => {
    body.querySelectorAll("[data-pagebreak]").forEach((pb) => {
      if (pb.parentElement === body) return;
      let anchor: Element | null = pb;
      while (anchor && anchor.parentElement !== body) anchor = anchor.parentElement;
      if (anchor && anchor.parentElement === body) {
        anchor.parentElement.insertBefore(pb, anchor);
      } else {
        body.appendChild(pb);
      }
      // pastikan ada blok setelahnya untuk menampung teks
      const nx = pb.nextElementSibling;
      if (!nx || (nx.tagName === "DIV" && nx.hasAttribute("data-pagebreak"))) {
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        pb.after(p);
      }
    });
  }, []);

  const applyDocToDom = useCallback((doc: FullDoc) => {
    const body = bodyRef.current;
    if (!body) return;
    const s = parseSettings(doc.settings);
    // dokumen seed lama tanpa info spasi baris → pakai ritme asli dokumen SPJ (1,32)
    if (doc.source.startsWith("gen:")) {
      try {
        const raw = JSON.parse(doc.settings || "{}");
        if (raw.docLineHeight === undefined) s.docLineHeight = 1.32;
      } catch {
        s.docLineHeight = 1.32;
      }
    }
    let html = doc.content || "<p><br></p>";
    // bungkus konten telanjang menjadi blok
    html = ensureBlockStructure(html);
    body.innerHTML = html;
    // buka pembungkus doc-body agar blok berdiri sendiri
    const wrapper = body.querySelector(":scope > div.doc-body");
    if (wrapper && body.children.length === 1) {
      while (wrapper.firstChild) body.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }
    // pembungkus tanpa kelas (hasil seed renderToStaticMarkup) juga dibuka
    for (let guard = 0; guard < 6; guard++) {
      const wrappers = Array.from(body.children).filter(
        (el) =>
          el.tagName === "DIV" &&
          (!(el as HTMLElement).className || (el as HTMLElement).className === "doc-body") &&
          el.querySelectorAll("p,div,table,h1,h2,h3,h4").length > 1 &&
          !el.hasAttribute("data-pagebreak") &&
          !el.hasAttribute("data-toc")
      ) as HTMLElement[];
      if (!wrappers.length) break;
      for (const outer of wrappers) {
        while (outer.firstChild) body.insertBefore(outer.firstChild, outer);
        outer.remove();
      }
    }
    // buang paragraf kosong di pinggir dokumen (hasil konversi)
    const trimEmpty = () => {
      const first = body.firstElementChild as HTMLElement | null;
      if (first && first.tagName === "P" && !first.textContent?.trim() && body.children.length > 1) first.remove();
      const last = body.lastElementChild as HTMLElement | null;
      if (last && last.tagName === "P" && !last.textContent?.trim() && body.children.length > 1) last.remove();
    };
    trimEmpty();
    hoistPageBreaks(body);
    // fidelitas ritme dokumen SPJ asli (margin khas sheet F4)
    body.querySelectorAll("p.doc-p").forEach((p) => ((p as HTMLElement).style.margin = "2.2mm 0"));
    body.querySelectorAll(".doc-judul").forEach((d) => {
      (d as HTMLElement).style.margin = "5mm 0 1mm 0";
      (d as HTMLElement).style.textAlign = "center";
      (d as HTMLElement).style.fontWeight = "bold";
      (d as HTMLElement).style.textDecoration = "underline";
    });
    body.querySelectorAll(".doc-nomor").forEach((d) => ((d as HTMLElement).style.margin = "0 0 4mm 0"));
    // margin bawah blok terakhir tidak dihitung ke tinggi cetak
    const lastBlock = body.lastElementChild as HTMLElement | null;
    if (lastBlock) lastBlock.style.marginBottom = "0mm";
    // kunci ukuran gambar seed sesuai atribut aslinya (next/image → img biasa)
    body.querySelectorAll("img").forEach((im) => {
      const el = im as HTMLImageElement;
      if (!el.style.width && el.getAttribute("width")) {
        el.style.width = el.getAttribute("width") + "px";
        el.style.height = el.getAttribute("height") + "px";
      }
      el.style.maxWidth = "100%";
      el.style.objectFit = "contain";
    });
    // rapikan tabel polos dari impor: beri garis bila sel tidak bergaris
    body.querySelectorAll("table").forEach((t) => {
      const td = t.querySelector("td,th");
      if (td && !td.getAttribute("style")?.includes("border") && !t.className.match(/doc-tbl|daftar-tbl|disp-grid|cover-table/)) {
        t.querySelectorAll("td,th").forEach((c) => {
          (c as HTMLElement).style.border = "1px solid #000";
          (c as HTMLElement).style.padding = "1mm 1.5mm";
        });
      }
    });
    if (headerRef.current) headerRef.current.innerHTML = doc.headerHtml || "";
    if (headerFirstRef.current) headerFirstRef.current.innerHTML = doc.headerFirst || "";
    if (footerRef.current) footerRef.current.innerHTML = doc.footerHtml || "";
    if (footerFirstRef.current) footerFirstRef.current.innerHTML = doc.footerFirst || "";
    undoMap.current.body = new UndoStack(body, { html: body.innerHTML, caret: null });
    undoMap.current.header = headerRef.current ? new UndoStack(headerRef.current, { html: headerRef.current.innerHTML, caret: null }) : null;
    undoMap.current.headerFirst = headerFirstRef.current ? new UndoStack(headerFirstRef.current, { html: headerFirstRef.current.innerHTML, caret: null }) : null;
    undoMap.current.footer = footerRef.current ? new UndoStack(footerRef.current, { html: footerRef.current.innerHTML, caret: null }) : null;
    undoMap.current.footerFirst = footerFirstRef.current ? new UndoStack(footerFirstRef.current, { html: footerFirstRef.current.innerHTML, caret: null }) : null;
    setSettings(s);
    settingsRef.current = s;
    setSpellcheck(body.getAttribute("spellcheck") === "true");
    document.execCommand("defaultParagraphSeparator", false, "p");
    // hitung ulang setelah render dgn gaya final; gambar bisa memuat belakangan
    setTimeout(recomputeAll, 80);
    setTimeout(recomputeAll, 400);
    body.querySelectorAll("img").forEach((im) => {
      if (!im.complete) im.addEventListener("load", () => recomputeAll(), { once: true });
    });
  }, []);

  // muat ulang saat docId berubah (dua tahap: render div lalu isi DOM)
  const [remountKey, setRemountKey] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setRemountKey(docId);
    fetch(`/api/documents/${docId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Gagal memuat dokumen"))))
      .then((doc: FullDoc & { versions: { id: string; label: string; author: string; title: string; createdAt: string }[] }) => {
        if (!alive) return;
        docRef.current = doc;
        setTitle(doc.title);
        setLastSaved(fmtTime(doc.updatedAt));
        setVersions(doc.versions ?? []);
        setDirty(false);
        setSaveState("idle");
        setTimeout(() => {
          if (!alive) return;
          applyDocToDom(doc);
          setLoading(false);
        }, 30);
      })
      .catch((e) => {
        console.error(e);
        toast({ title: "Gagal memuat dokumen", variant: "destructive" });
        setLoading(false);
      });
    return () => {
      alive = false;
    };
     
  }, [docId]);

  /* ================= Recompute: paginasi, outline, hitungan, field ================= */

  const recomputeAll = useCallback(() => {
    const body = bodyRef.current;
    const s = settingsRef.current;
    if (!body) return;

    // 1) paginasi
    const map = paginate(body, contentHeight(s) * MM);
    pageMapRef.current = map;
    setPages(map.pages);

    // 2) outline
    ensureHeadingIds(body);
    const heads = collectHeadings(body, map);
    setOutlineNodes(
      heads.map((h) => ({
        id: h.el.getAttribute("data-hid") || "",
        level: h.level,
        text: h.text,
        page: h.page,
      }))
    );

    // 3) hitungan
    const text = body.textContent || "";
    setWords(text.split(/\s+/).filter(Boolean).length);
    setChars(text.length);
    setReviewStats({
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, "").length,
      paragraphs: body.querySelectorAll("p, h1, h2, h3, h4, blockquote").length,
      tables: body.querySelectorAll("table").length,
      images: body.querySelectorAll("img").length,
      headings: body.querySelectorAll("h1, h2, h3, h4").length,
    });

    // 4) field nomor halaman (perkiraan halaman 1 pada tampilan sunting)
    const pn = s.pageNumber;
    const pnText = pn.enabled ? formatPageNo(pn.format, 0, pn.start, map.pages) : "1";
    for (const zone of [headerRef, footerRef, headerFirstRef, footerFirstRef]) {
      zone.current?.querySelectorAll('[data-field="page"]').forEach((f) => {
        f.textContent = pnText;
      });
    }
    body.querySelectorAll('[data-field="page"]').forEach((f) => {
      f.textContent = pnText;
    });

    // 5) perbarui TOC bila ada
    if (body.querySelector("[data-toc]")) updateToc(body, map);

    // 6) halaman kini (posisi caret)
    updateCurrentPage();
  }, []);

  const updateCurrentPage = useCallback(() => {
    const body = bodyRef.current;
    const map = pageMapRef.current;
    if (!body || !map) return;
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    if (!node || !body.contains(node)) return;
    while (node && node !== body && !(node instanceof Element && isBlockEl(node))) node = node.parentNode;
    if (node instanceof Element) {
      const p = map.pageOf.get(node);
      setPage((p ?? 0) + 1);
      const hid = node.getAttribute("data-hid");
      if (hid) setCurrentHeading(hid);
    }
  }, []);

  /* ================= Simpan ================= */

  const titleRef = useRef(title);
  titleRef.current = title;

  const collectPayload = useCallback(() => {
    return {
      title: titleRef.current,
      content: bodyRef.current?.innerHTML ?? "",
      headerHtml: headerRef.current?.innerHTML ?? "",
      headerFirst: headerFirstRef.current?.innerHTML ?? "",
      footerHtml: footerRef.current?.innerHTML ?? "",
      footerFirst: footerFirstRef.current?.innerHTML ?? "",
      settings: JSON.stringify(settingsRef.current),
    };
  }, []);

  const doSaveRef = useRef<() => void>(() => {});

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSaveRef.current(), 1200);
  }, []);

  const doSave = useCallback(async () => {
    if (!docRef.current) return;
    setSaveState("saving");
    try {
      const payload = collectPayload();
      const r = await fetch(`/api/documents/${docRef.current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("gagal");
      setSaveState("saved");
      setDirty(false);
      setLastSaved(fmtTime(new Date().toISOString()));
      onDocChanged?.();
    } catch {
      setSaveState("dirty");
      toast({ title: "Gagal menyimpan", description: "Periksa koneksi lalu coba Ctrl+S.", variant: "destructive" });
    }
  }, [collectPayload, onDocChanged, toast]);

  doSaveRef.current = doSave;

  // peringatan sebelum menutup tab bila ada perubahan
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // versi otomatis setiap 10 menit bila ada perubahan
  useEffect(() => {
    const iv = setInterval(() => {
      if (dirty && docRef.current) {
        fetch(`/api/documents/${docRef.current.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: "Otomatis", author: "Pengguna" }),
        }).catch(() => {});
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [dirty]);

  /* ================= Perubahan konten ================= */

  const onBodyInput = useCallback(() => {
    markDirty();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => undoMap.current.body?.push(), 500);
    if (recomputeTimer.current) clearTimeout(recomputeTimer.current);
    recomputeTimer.current = setTimeout(recomputeAll, 450);
  }, [markDirty, recomputeAll]);

  const onHfInput = useCallback(
    (z: Zone) => {
      markDirty();
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => {
        const root = z === "header" ? headerRef.current : z === "headerFirst" ? headerFirstRef.current
          : z === "footer" ? footerRef.current : footerFirstRef.current;
        if (root) {
          if (!undoMap.current[z]) undoMap.current[z] = new UndoStack(root, { html: root.innerHTML, caret: null });
          undoMap.current[z]?.push();
        }
      }, 500);
    },
    [markDirty]
  );

  const onContentMutated = useCallback(() => {
    markDirty();
    recomputeAll();
    undoMap.current.body?.push();
  }, [markDirty, recomputeAll]);

  /* ================= Perintah ================= */

  const activeRoot = useCallback((): HTMLElement | null => {
    const z = zoneRef.current;
    if (z === "header") return headerRef.current;
    if (z === "headerFirst") return headerFirstRef.current;
    if (z === "footer") return footerRef.current;
    if (z === "footerFirst") return footerFirstRef.current;
    return bodyRef.current;
  }, []);

  const refreshFlags = useCallback(() => {
    try {
      setFlags({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        align: currentAlign(),
      });
    } catch {
      /* diabaikan */
    }
    // nilai ruler dari blok saat ini
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    const body = bodyRef.current;
    const root = activeRoot();
    if (node && root && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (node instanceof Element && root?.contains(node)) {
      const block = node.closest("p,div,h1,h2,h3,h4,blockquote,td,th,li") as HTMLElement | null;
      if (block && body?.contains(block)) {
        const st = block.style;
        const ti = parseFloat(st.textIndent) || 0;
        setRulerVals({
          firstMm: ti > 0 ? ti : 0,
          hangMm: ti < 0 ? -ti : 0,
          leftMm: parseFloat(st.marginLeft) || 0,
          rightMm: parseFloat(st.marginRight) || 0,
          tabs: getTabStops(block),
        });
        setCurrentBlock(block);
      }
    }
  }, [activeRoot]);

  const currentBlockRef = useRef<HTMLElement | null>(null);
  const setCurrentBlock = (el: HTMLElement | null) => {
    currentBlockRef.current = el;
  };

  const currentAlign = (): "left" | "center" | "right" | "justify" => {
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    while (node && !(node instanceof Element && isBlockEl(node))) node = node.parentNode;
    if (node instanceof Element) {
      const a = getComputedStyle(node).textAlign;
      if (a === "center") return "center";
      if (a === "right" || a === "end") return "right";
      if (a === "justify") return "justify";
    }
    return "left";
  };

  const run = useCallback(
    (fn: (root: HTMLElement) => void, opts?: { keepUndoBefore?: boolean }) => {
      const root = activeRoot();
      if (!root) return;
      root.focus();
      const z = zoneRef.current;
      if (!undoMap.current[z]) {
        undoMap.current[z] = new UndoStack(root, { html: root.innerHTML, caret: null });
      }
      if (opts?.keepUndoBefore !== false) undoMap.current[z]?.push();
      fn(root);
      undoMap.current[z]?.push();
      markDirty();
      setTimeout(recomputeAll, 60);
      refreshFlags();
    },
    [activeRoot, markDirty, recomputeAll, refreshFlags]
  );

  const onSelectionChanged = useCallback(() => {
    refreshFlags();
    updateCurrentPage();
  }, [refreshFlags, updateCurrentPage]);

  /* ================= Aksi ribbon ================= */

  const actions: RibbonActions = useMemo(() => {
    const a = {
      undo: () => {
        const stack = undoMap.current[zoneRef.current] ?? stackFor();
        const snap = stack?.undo();
        if (!snap) return;
        const root = activeRoot();
        if (root) {
          root.innerHTML = snap.html;
          setCaretPath(root, snap.caret);
        }
        markDirty();
        setTimeout(recomputeAll, 40);
        refreshFlags();
      },
      redo: () => {
        const stack = undoMap.current[zoneRef.current] ?? stackFor();
        const snap = stack?.redo();
        if (!snap) return;
        const root = activeRoot();
        if (root) {
          root.innerHTML = snap.html;
          setCaretPath(root, snap.caret);
        }
        markDirty();
        setTimeout(recomputeAll, 40);
        refreshFlags();
      },
      cut: () => exec("cut"),
      copySel: () => exec("copy"),
      paste: async () => {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const htmlType = item.types.find((t) => t === "text/html");
            if (htmlType) {
              const html = await (await item.getType("text/html")).text();
              run((root) => exec("insertHTML", sanitizeHtml(html)));
              return;
            }
          }
          const text = await navigator.clipboard.readText();
          run((root) => exec("insertText", text));
        } catch {
          toast({ title: "Tempel lewat menu tidak diizinkan peramban", description: "Silakan gunakan Ctrl+V — tetap tersanitasi otomatis." });
        }
      },
      font: (f: string) => run((root) => setFontFamily(root, f)),
      size: (pt: number) => run((root) => setFontSize(root, pt)),
      bold: () => run(() => exec("bold")),
      italic: () => run(() => exec("italic")),
      underline: () => run(() => exec("underline")),
      strike: () => run(() => exec("strikeThrough")),
      sub: () => run(() => exec("subscript")),
      sup: () => run(() => exec("superscript")),
      color: (c: string) => run((root) => setTextColor(root, c)),
      highlight: (c: string) => run((root) => setHighlight(root, c)),
      clearFormat: () => run((root) => clearFormatting(root)),
      align: (dir: "left" | "center" | "right" | "justify") =>
        run(() => exec({ left: "justifyLeft", center: "justifyCenter", right: "justifyRight", justify: "justifyFull" }[dir])),
      lineSpacing: (v: string) => run((root) => setLineSpacing(root, v)),
      indentPlus: () => run((root) => changeIndent(root, 1)),
      indentMinus: () => run((root) => changeIndent(root, -1)),
      paragraphDialog: () => openParagraph(true),
      bullets: () => run(() => exec("insertUnorderedList")),
      numbers: () => run(() => exec("insertOrderedList")),
      multilevel: () => run((root) => setMultilevel(root, true)),
      restart: () => run((root) => restartNumbering(root, 1)),
      continueNum: () => run((root) => continueNumbering(root)),
      style: (n: StyleName) => run((root) => applyParagraphStyle(root, n)),
      insertTable: () => setDlgInsertTable(true),
      insertImage: () => imgInputRef.current?.click(),
      insertLink: () => {
        const sel = window.getSelection();
        const anchor = (sel?.anchorNode instanceof Element ? sel.anchorNode : sel?.anchorNode?.parentElement)?.closest("a");
        setLinkInitial(anchor?.textContent ?? sel?.toString() ?? "");
        setDlgLink(true);
      },
      insertPageBreak: () =>
        run((root) => {
          insertPageBreak(root);
          if (root === bodyRef.current) hoistPageBreaks(bodyRef.current);
        }),
      insertDate: () => run((root) => insertDateTime(root)),
      insertSymbol: (ch: string) => run((root) => insertSymbol(root, ch)),
      insertPageField: () => run((root) => insertFieldPage(root)),
      editZone: (z: Zone) => {
        const next: Zone = z === zoneRef.current ? "body" : z; // toggle kembali ke isi
        setZone(next);
        setTimeout(() => {
          if (next === "body") {
            bodyRef.current?.focus();
            return;
          }
          const r =
            next === "header" ? headerRef.current : next === "headerFirst" ? headerFirstRef.current
            : next === "footer" ? footerRef.current : footerFirstRef.current;
          r?.focus();
        }, 50);
      },
      pageNumberDialog: () => setDlgPageNumber(true),
      paperSize: (k: DocSettings["paper"]) => {
        if (k === "custom") {
          setDlgPageSetup(true);
          return;
        }
        const p = PAPER_SIZES[k];
        applySettings({ paper: k, paperW: p.w, paperH: p.h });
      },
      orientation: (o: "portrait" | "landscape") => applySettings({ orientation: o }),
      marginPreset: (k: string) => {
        const m = MARGIN_PRESETS[k];
        if (m) applySettings({ margins: { top: m.top, right: m.right, bottom: m.bottom, left: m.left } });
      },
      pageSetupDialog: () => setDlgPageSetup(true),
      insertToc: () =>
        run((root) => {
          const map = pageMapRef.current ?? paginate(root, contentHeight(settingsRef.current) * MM);
          ensureHeadingIds(root);
          const heads = collectHeadings(root, map);
          exec(
            "insertHTML",
            `<div class="toc" data-toc="1" contenteditable="false"><div class="toc-title">DAFTAR ISI</div>${
              heads
                .map(
                  (h) =>
                    `<div class="toc-row toc-l${h.level}"><span class="toc-text">${escapeHtml(h.text)}</span><span class="toc-leader"></span><span class="toc-page">${h.page}</span></div>`
                )
                .join("") || `<div class="toc-empty">Belum ada judul (Judul 1–4) dalam dokumen.</div>`
            }</div><p><br></p>`
          );
        }),
      updateToc: () =>
        run((root) => {
          const map = paginate(root, contentHeight(settingsRef.current) * MM);
          updateToc(root, map);
          toast({ title: "Daftar isi diperbarui" });
        }),
      reviewDialog: () => setDlgReview(true),
      spellcheck: (v: boolean) => {
        setSpellcheck(v);
        for (const r of [bodyRef, headerRef, headerFirstRef, footerRef, footerFirstRef]) {
          r.current?.setAttribute("spellcheck", String(v));
        }
        toast({ title: v ? "Pemeriksa ejaan aktif" : "Pemeriksa ejaan nonaktif" });
      },
      lang: (l: string) => {
        setLang(l);
        bodyRef.current?.setAttribute("lang", l);
        toast({ title: "Bahasa dokumen: " + l });
      },
      versions: async () => {
        setDlgVersions(true);
        await refreshVersions();
      },
      zoomIn: () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2))),
      zoomOut: () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2))),
      zoomFitW: () => {
        const el = scrollRef.current;
        const p = effectivePaper(settingsRef.current);
        if (el) setZoom(Math.min(2, Math.max(0.3, (el.clientWidth - 80) / (p.w * MM))));
      },
      zoomFitP: () => {
        const el = scrollRef.current;
        const p = effectivePaper(settingsRef.current);
        if (el) setZoom(Math.min(2, Math.max(0.3, (el.clientHeight - 60) / (p.h * MM))));
      },
      zoomPct: (z: number) => setZoom(Math.min(2, Math.max(0.3, z))),
      toggleRuler: () => setRuler((r) => !r),
      toggleOutline: () => setOutlineOpen((o) => !o),
      togglePreview: () => setPreview((p) => !p),
      fullscreen: () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
      },
      save: () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        doSave();
      },
      saveVersion: async () => {
        await refreshVersions();
        setDlgVersions(true);
      },
      print: () => {
        const body = bodyRef.current;
        if (!body) return;
        printDocument(
          body,
          settingsRef.current,
          headerRef.current?.innerHTML ?? "",
          headerFirstRef.current?.innerHTML ?? "",
          footerRef.current?.innerHTML ?? "",
          footerFirstRef.current?.innerHTML ?? ""
        );
      },
      exportDocx: async () => {
        const body = bodyRef.current;
        if (!body) return;
        toast({ title: "Menyiapkan berkas DOCX…" });
        await exportDOCX(
          title,
          body,
          settingsRef.current,
          headerRef.current?.innerHTML ?? "",
          headerFirstRef.current?.innerHTML ?? "",
          footerRef.current?.innerHTML ?? "",
          footerFirstRef.current?.innerHTML ?? ""
        );
        toast({ title: "DOCX berhasil diunduh" });
      },
      exportHtml: async () => {
        if (!bodyRef.current) return;
        await exportHTML(title, bodyRef.current.innerHTML, settingsRef.current);
        toast({ title: "HTML berhasil diunduh" });
      },
      exportTxt: () => {
        if (!bodyRef.current) return;
        exportTXT(title, bodyRef.current.textContent ?? "");
        toast({ title: "TXT berhasil diunduh" });
      },
      importFile: async (file: File) => {
        setBusy(true);
        try {
          const name = file.name.toLowerCase();
          let html = "";
          if (name.endsWith(".docx")) html = await importDOCX(file);
          else if (name.endsWith(".html") || name.endsWith(".htm")) html = importHTMLText(await file.text());
          else if (name.endsWith(".txt")) html = ensureBlockStructure(escapeHtml(await file.text()).replace(/\n/g, "<br>"));
          else throw new Error("Format berkas tidak didukung (gunakan DOCX/HTML/TXT)");
          const clean = sanitizeHtml(html);
          const r = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: file.name.replace(/\.[^.]+$/, ""),
              content: ensureBlockStructure(clean),
              settings: JSON.stringify(defaultSettings()),
            }),
          });
          if (!r.ok) throw new Error("gagal membuat dokumen");
          const doc = await r.json();
          onImported(doc.id);
          toast({ title: "Dokumen berhasil dibuka", description: file.name });
        } catch (e) {
          toast({ title: "Gagal membuka berkas", description: e instanceof Error ? e.message : "", variant: "destructive" });
        } finally {
          setBusy(false);
        }
      },
      newDoc: async () => {
        const r = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Dokumen Baru", content: "<p><br></p>", settings: JSON.stringify(defaultSettings()) }),
        });
        if (r.ok) {
          const doc = await r.json();
          onImported(doc.id);
        }
      },
      close: () => {
        if (dirty) {
          if (confirm("Ada perubahan yang belum tersimpan. Tetap tutup editor?")) onClosed();
        } else onClosed();
      },
      rename: (t: string) => {
        setTitle(t);
        markDirty();
      },
      findOpen: (withReplace?: boolean) => {
        setFindOpen(true);
        if (withReplace) setReplaceText((r) => r);
      },
    };
    return a;
     
  }, [title, dirty, markDirty, run, recomputeAll, refreshFlags, activeRoot, doSave, collectPayload]);

  const onImported = (id: string) => {
    onDocChanged?.();
    // ganti dokumen aktif: sederhananya muat dokumen baru
    window.dispatchEvent(new CustomEvent("ed-open-doc", { detail: id }));
  };

  const refreshVersions = async () => {
    if (!docRef.current) return;
    try {
      const r = await fetch(`/api/documents/${docRef.current.id}/versions`, { cache: "no-store" });
      if (r.ok) setVersions(await r.json());
    } catch {
      /* diabaikan */
    }
  };

  const applySettings = (patch: Partial<DocSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      settingsRef.current = next;
      return next;
    });
    markDirty();
    setTimeout(recomputeAll, 60);
  };

  /* ================= Pratinjau cetak ================= */

  useEffect(() => {
    if (!preview) return;
    let raf = requestAnimationFrame(() => {
      const body = bodyRef.current;
      const host = previewRef.current;
      if (!body || !host) return;
      const s = settingsRef.current;
      const map = paginate(body, contentHeight(s) * MM);
      const pagesEl = buildPrintPages(
        body, s, map,
        headerRef.current?.innerHTML ?? "", headerFirstRef.current?.innerHTML ?? "",
        footerRef.current?.innerHTML ?? "", footerFirstRef.current?.innerHTML ?? ""
      );
      host.innerHTML = "";
      const p = effectivePaper(s);
      const scale = Math.min(1, Math.max(0.2, (host.clientWidth - 60) / (p.w * MM)));
      for (const el of pagesEl) {
        const wrap = document.createElement("div");
        wrap.style.width = p.w * MM * scale + "px";
        wrap.style.margin = "0 auto 18px";
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "top left";
        el.style.width = p.w * MM + "px";
        el.style.height = p.h * MM + "px";
        wrap.appendChild(el);
        host.appendChild(wrap);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [preview, settings, pages]);

  /* ================= Papan ketik & tempel ================= */

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  const tableTabNav = useCallback((backwards: boolean) => {
    const sel = window.getSelection();
    const td = findTd(sel?.anchorNode ?? null);
    if (!td) return false;
    const table = findTable(td);
    if (!table) return false;
    const all = Array.from(table.querySelectorAll("td,th"));
    const idx = all.indexOf(td);
    const next = all[idx + (backwards ? -1 : 1)];
    if (next) {
      const r = document.createRange();
      r.selectNodeContents(next);
      r.collapse(!backwards);
      sel?.removeAllRanges();
      sel?.addRange(r);
    } else if (!backwards) {
      // di sel terakhir: buat baris baru otomatis ala Word
      const lastRow = table.rows[table.rows.length - 1];
      if (lastRow) addRow(lastRow.cells[0], "below");
      const nueTable = findTable(td);
      const nue = nueTable?.rows[nueTable.rows.length - 1]?.cells[0];
      if (nue) {
        const r = document.createRange();
        r.selectNodeContents(nue);
        r.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(r);
        onContentMutated();
      }
    }
    return true;
  }, [onContentMutated]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && !e.shiftKey && ["b", "i", "u", "z", "y", "f", "h", "s", "p", "k"].includes(key)) {
        e.preventDefault();
        switch (key) {
          case "b": actions.bold(); break;
          case "i": actions.italic(); break;
          case "u": actions.underline(); break;
          case "z": actions.undo(); break;
          case "y": actions.redo(); break;
          case "f": setFindOpen(true); break;
          case "h": setFindOpen(true); break;
          case "s": actions.save(); break;
          case "p": actions.print(); break;
          case "k": actions.insertLink(); break;
        }
        return;
      }
      if (ctrl && e.shiftKey && key === "z") {
        e.preventDefault();
        actions.redo();
        return;
      }
      if (key === "tab") {
        e.preventDefault();
        if (tableTabNav(e.shiftKey)) { markDirty(); return; }
        run((root) => handleTabKey(root));
        return;
      }
      if (key === "escape") {
        clearCellSelection(bodyRef.current!);
        setCtx(null);
        setFindOpen(false);
      }
    },
     
    [actions, tableTabNav, run, markDirty]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.3, +(z - Math.sign(e.deltaY) * 0.05).toFixed(2))));
    }
  }, []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const cd = e.clipboardData;
      const html = cd.getData("text/html");
      const imgItem = Array.from(cd.items).find((i) => i.type.startsWith("image/"));
      e.preventDefault();
      if (imgItem) {
        const f = imgItem.getAsFile();
        if (f) insertImageFile(f);
        return;
      }
      if (html) {
        run((root) => exec("insertHTML", sanitizeHtml(html)));
        return;
      }
      const text = cd.getData("text/plain");
      if (text) {
        const paras = text.split(/\r?\n/).map((l) => `<p>${escapeHtml(l) || "<br>"}</p>`).join("");
        run((root) => exec("insertHTML", paras));
      }
    },
     
    [run]
  );

  // tempel & drop pada zona (delegasi)
  useEffect(() => {
    const paperEl = bodyRef.current?.closest(".ed-paper") as HTMLElement | null;
    if (!paperEl) return;
    const h = (e: Event) => onPaste(e as unknown as React.ClipboardEvent);
    paperEl.addEventListener("paste", h);
    return () => paperEl.removeEventListener("paste", h);
  }, [onPaste, remountKey]);

  const insertImageFile = useCallback(
    async (f: File) => {
      try {
        const { dataUrl, w, h } = await compressImageFile(f);
        const maxW = 400;
        const width = Math.min(w, maxW);
        const height = Math.round(h * (width / w));
        run((root) =>
          exec(
            "insertHTML",
            `<img src="${dataUrl}" alt="${escapeHtml(f.name)}" style="width:${width}px; height:${height}px;" />`
          )
        );
      } catch {
        toast({ title: "Gagal memuat gambar", variant: "destructive" });
      }
    },
    [run, toast]
  );

  /* ================= Cari & ganti ================= */

  const clearFindMarks = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.querySelectorAll("span.ed-find-hit").forEach((s) => {
      const parent = s.parentNode;
      if (!parent) return;
      while (s.firstChild) parent.insertBefore(s.firstChild, s);
      s.remove();
      parent.normalize();
    });
  }, []);

  const doFind = useCallback(
    (scroll = true) => {
      const body = bodyRef.current;
      if (!body) return;
      clearFindMarks();
      if (!findText) { setFindCount(0); setFindIdx(0); return; }
      const needle = matchCase ? findText : findText.toLowerCase();
      if (!needle) return;
      // kumpulkan dulu seluruh text node — memutasi DOM saat berjalan bisa loop tak berujung
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n = walker.nextNode() as Text | null;
      while (n) {
        nodes.push(n);
        n = walker.nextNode() as Text | null;
      }
      const spans: HTMLElement[] = [];
      for (const node of nodes) {
        if (!node.isConnected) continue;
        if (node.parentElement?.closest("[data-toc]")) continue;
        const text = node.textContent || "";
        const hay = matchCase ? text : text.toLowerCase();
        const idx = hay.indexOf(needle);
        if (idx < 0 || !node.parentElement) continue;
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + needle.length);
        const span = document.createElement("span");
        span.className = "ed-find-hit";
        try {
          range.surroundContents(span);
          spans.push(span);
        } catch {
          /* teks lintas elemen — dilewati */
        }
      }
      setFindCount(spans.length);
      setFindIdx(0);
      if (spans.length && scroll) {
        spans[0].classList.add("active");
        spans[0].scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [findText, matchCase, clearFindMarks]
  );

  const moveFind = useCallback(
    (dir: 1 | -1) => {
      const body = bodyRef.current;
      if (!body) return;
      const spans = Array.from(body.querySelectorAll("span.ed-find-hit")) as HTMLElement[];
      if (!spans.length) return;
      spans[findIdx]?.classList.remove("active");
      let idx = (findIdx + dir + spans.length) % spans.length;
      spans[idx].classList.add("active");
      spans[idx].scrollIntoView({ block: "center", behavior: "smooth" });
      setFindIdx(idx);
    },
    [findIdx]
  );

  const replaceOne = useCallback(() => {
    const body = bodyRef.current;
    const active = body?.querySelector("span.ed-find-hit.active");
    if (!active || !active.parentNode) return;
    undoMap.current.body?.push();
    active.parentNode.insertBefore(document.createTextNode(replaceText), active);
    active.remove();
    markDirty();
    setTimeout(() => { doFind(); recomputeAll(); }, 60);
  }, [replaceText, markDirty, doFind, recomputeAll]);

  const replaceAll = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const spans = Array.from(body.querySelectorAll("span.ed-find-hit"));
    if (!spans.length) return;
    undoMap.current.body?.push();
    spans.forEach((s) => {
      s.parentNode?.insertBefore(document.createTextNode(replaceText), s);
      s.remove();
    });
    markDirty();
    setFindCount(0);
    recomputeAll();
    toast({ title: `${spans.length} hasil diganti` });
  }, [replaceText, markDirty, recomputeAll, toast]);

  /* ================= Aksi tabel (konteks & toolbar) ================= */

  const targetCells = useCallback((): HTMLTableCellElement[] => {
    const cells = getSelectedCells(bodyRef.current!);
    if (cells.length) return cells;
    const td = findTd(ctxTarget.current);
    return td ? [td] : [];
  }, []);

  const tableAction = useCallback(
    (fn: (td: HTMLTableCellElement) => void) => {
      const td = targetCells()[0];
      if (!td) return;
      run(() => fn(td));
    },
    [run, targetCells]
  );

  const ctxActions = {
    copy: () => exec("copy"),
    cut: () => exec("cut"),
    paste: async () => actions.paste(),
    bold: () => actions.bold(),
    italic: () => actions.italic(),
    insertLink: () => actions.insertLink(),
    removeLink: () => run((root) => removeLink(root)),
    addRowAbove: () => tableAction((td) => addRow(td, "above")),
    addRowBelow: () => tableAction((td) => addRow(td, "below")),
    deleteRow: () => tableAction((td) => deleteRow(td)),
    addColLeft: () => tableAction((td) => addCol(td, "left")),
    addColRight: () => tableAction((td) => addCol(td, "right")),
    deleteCol: () => tableAction((td) => deleteCol(td)),
    mergeCells: () => run(() => mergeCells(getSelectedCells(bodyRef.current!))),
    splitCell: () => tableAction((td) => splitCell(td)),
    tableProps: () => {
      const td = targetCells()[0];
      const table = td ? findTable(td) : null;
      if (!table) return;
      const first = table.rows[0]?.cells[0];
      const firstTd = table.querySelector("td,th") as HTMLElement | null;
      tablePropsInit.current = {
        widthMm: parseFloat(table.style.width) || table.offsetWidth / MM,
        align: table.style.marginLeft === "auto" && table.style.marginRight === "auto" ? "center" : table.style.marginLeft === "auto" ? "right" : "left",
        borderColor: /^.*\s(#[0-9a-fA-F]{3,6}|rgb\(.+?\))$/.exec(first?.style.border || "")?.[1] ?? "#000000",
        borderWidthMm: parseFloat(first?.style.border || "0.3") || 0.3,
        noBorder: (first?.style.border || "").includes("none"),
        paddingMm: parseFloat(firstTd?.style.padding || "1"),
        headerRow: table.rows[0]?.cells[0]?.tagName === "TH",
        repeatHeader: table.rows[0]?.classList.contains("repeat-header") ?? false,
      };
      setDlgTableProps(true);
    },
    imageProps: () => {
      const img = ctxTarget.current?.closest("img") as HTMLImageElement | null;
      if (!img) return;
      imgInit.current = {
        w: img.offsetWidth,
        h: img.offsetHeight,
        natW: img.naturalWidth,
        natH: img.naturalHeight,
        alt: img.alt || "",
      };
      setDlgImage(true);
    },
    imageAlign: (align: "left" | "center" | "right" | "floatLeft" | "floatRight") => {
      const img = ctxTarget.current?.closest("img") as HTMLImageElement | null;
      if (!img) return;
      run(() => {
        img.style.removeProperty("float");
        img.style.removeProperty("margin-left");
        img.style.removeProperty("margin-right");
        img.style.removeProperty("display");
        if (align === "center") { img.style.display = "block"; img.style.marginLeft = "auto"; img.style.marginRight = "auto"; }
        else if (align === "left") { img.style.display = "block"; img.style.marginRight = "auto"; }
        else if (align === "right") { img.style.display = "block"; img.style.marginLeft = "auto"; }
        else if (align === "floatLeft") { img.style.float = "left"; img.style.margin = "2mm 4mm 2mm 0"; }
        else if (align === "floatRight") { img.style.float = "right"; img.style.margin = "2mm 0 2mm 4mm"; }
      });
    },
    imageCaption: () => {
      const img = ctxTarget.current?.closest("img") as HTMLImageElement | null;
      if (!img) return;
      run(() => {
        const fig = document.createElement("figure");
        fig.style.margin = "2mm 0";
        fig.style.textAlign = "center";
        img.replaceWith(fig);
        fig.appendChild(img);
        const cap = document.createElement("figcaption");
        cap.contentEditable = "true";
        cap.textContent = "Gambar 1. …";
        fig.appendChild(cap);
      });
    },
    imageDelete: () => {
      const img = ctxTarget.current?.closest("img");
      if (!img) return;
      run(() => img.remove());
    },
    selectAll: () => exec("selectAll"),
    paragraphDialog: () => setDlgParagraph(true),
  };

  const onContext = useCallback((e: React.MouseEvent, target: HTMLElement) => {
    ctxTarget.current = target;
    const kind = target.closest("img") ? "image" : target.closest("a") ? "link" : target.closest("td,th") ? "table" : "text";
    setCtx({ x: e.clientX, y: e.clientY, kind });
  }, []);

  /* ================= Terapkan dialog ================= */

  const tablePropsInit = useRef({
    widthMm: 150, align: "left" as "left" | "center" | "right",
    borderColor: "#000000", borderWidthMm: 0.3, noBorder: false,
    paddingMm: 1, headerRow: false, repeatHeader: false,
  });

  const applyTableProps = (v: typeof tablePropsInit.current) => {
    const td = targetCells()[0];
    const table = td ? findTable(td) : null;
    if (!table) return;
    run(() => {
      setTableWidth(table, v.widthMm);
      setTableAlignment(table, v.align);
      if (v.noBorder) clearTableBorders(table);
      else setTableBorders(table, { color: v.borderColor, widthMm: v.borderWidthMm, style: "solid" });
      setCellPadding(table, v.paddingMm);
      const isHeader = table.rows[0]?.cells[0]?.tagName === "TH";
      if (v.headerRow !== isHeader) toggleHeaderRow(table);
      table.rows[0]?.classList.toggle("repeat-header", v.repeatHeader);
    });
  };

  const imgInit = useRef({ w: 200, h: 150, natW: 0, natH: 0, alt: "" });
  const applyImageProps = (v: { w: number; h: number; alt: string }) => {
    const img = ctxTarget.current?.closest("img") as HTMLImageElement | null;
    if (!img) return;
    run(() => {
      img.style.width = v.w + "px";
      img.style.height = v.h + "px";
      img.alt = v.alt;
    });
  };

  const paragraphInit = useRef<ParagraphProps | null>(null);
  const openParagraph = (v: boolean) => {
    if (v) {
      const block = currentBlockRef.current;
      const st = block?.style;
      paragraphInit.current = {
        align: currentAlign(),
        lineSpacing: st?.lineHeight && !st.lineHeight.includes("px") ? String(parseFloat(st.lineHeight) || 1.15) : "1.15",
        beforePt: st ? parseFloat(st.marginTop) || 0 : 0,
        afterPt: st ? parseFloat(st.marginBottom) || 0 : 6,
        leftMm: st ? parseFloat(st.marginLeft) || 0 : 0,
        rightMm: st ? parseFloat(st.marginRight) || 0 : 0,
        firstMm: st && (parseFloat(st.textIndent) || 0) > 0 ? parseFloat(st.textIndent) : 0,
        hangMm: st && (parseFloat(st.textIndent) || 0) < 0 ? -parseFloat(st.textIndent) : 0,
      };
    }
    setDlgParagraph(v);
  };

  const applyParagraph = (p: Partial<ParagraphProps>) => {
    run((root) => {
      if (p.align) exec("justify" + ({ left: "Left", center: "Center", right: "Right", justify: "Full" }[p.align] ?? "Left"));
      if (p.lineSpacing) setLineSpacing(root, p.lineSpacing);
      if (p.beforePt !== undefined || p.afterPt !== undefined) setSpacing(root, p.beforePt ?? null, p.afterPt ?? null);
      setIndent(root, {
        leftMm: p.leftMm ?? null,
        rightMm: p.rightMm ?? null,
        firstMm: p.firstMm ?? null,
        hangingMm: p.hangMm ?? null,
      });
    });
  };

  /* ================= Tab stop ================= */

  const applyRulerIndent = (v: { firstMm?: number; hangMm?: number; leftMm?: number; rightMm?: number }) => {
    const block = currentBlockRef.current;
    if (!block) return;
    run(() => {
      const st = block.style;
      if (v.firstMm !== undefined) { st.textIndent = v.firstMm + "mm"; if (v.firstMm < 0) st.textIndent = Math.abs(v.firstMm) + "mm"; }
      if (v.hangMm !== undefined && v.hangMm > 0) { st.textIndent = "-" + v.hangMm + "mm"; if (!st.marginLeft) st.marginLeft = v.hangMm + "mm"; }
      if (v.leftMm !== undefined) st.marginLeft = v.leftMm + "mm";
      if (v.rightMm !== undefined) st.marginRight = v.rightMm + "mm";
      setRulerVals((o) => ({ ...o, ...v, hangMm: v.hangMm ?? o.hangMm, firstMm: v.firstMm ?? o.firstMm }));
    });
  };

  const mutateTabs = (fn: (tabs: TabStop[]) => TabStop[]) => {
    const block = currentBlockRef.current;
    if (!block) return;
    const next = fn(getTabStops(block));
    run(() => setTabStops(block, next));
    setRulerVals((o) => ({ ...o, tabs: next }));
  };

  /* ================= Render ================= */

  const paper = effectivePaper(settings);
  void paper;
  const guides = useMemo(() => {
    const ch = contentHeight(settings);
    const out: { topMm: number; label: number }[] = [];
    for (let i = 1; i < Math.max(1, pages); i++) {
      out.push({ topMm: settings.margins.top + i * ch, label: i + 1 });
    }
    return out;
  }, [settings, pages]);

  const ribbonFlags: RibbonFlags = {
    ...flags,
    zone,
    zoom, ruler, outline: outlineOpen, preview, spellcheck,
    canUndo: undoMap.current[zone]?.canUndo ?? false,
    canRedo: undoMap.current[zone]?.canRedo ?? false,
    saveState, lastSaved, dirty,
    title, pages, page, words, chars,
    differentFirstPage: settings.differentFirstPage,
    paperKey: settings.paper,
    orientation: settings.orientation,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-40px)] bg-slate-200 -mx-4 sm:-mx-6 -my-6">
      <Ribbon tab={tab} setTab={setTab} flags={ribbonFlags} actions={actions} />
      {findOpen && (
        <FindReplaceBar
          onClose={() => { setFindOpen(false); clearFindMarks(); }}
          find={findText} setFind={setFindText}
          replace={replaceText} setReplace={setReplaceText}
          matchCase={matchCase} setMatchCase={setMatchCase}
          count={findCount} activeIdx={findIdx}
          onFind={() => doFind()} onNext={() => moveFind(1)} onPrev={() => moveFind(-1)}
          onReplaceOne={replaceOne} onReplaceAll={replaceAll}
        />
      )}
      <div className="flex flex-1 min-h-0">
        {zone !== "body" && !preview && (
          <div className="absolute left-1/2 -translate-x-1/2 top-2 z-40 bg-emerald-700 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <span>
              Mode sunting: <b>{zone === "header" ? "Kop Atas" : zone === "headerFirst" ? "Kop Halaman 1" : zone === "footer" ? "Kaki Bawah" : "Kaki Halaman 1"}</b>
            </span>
            <button
              className="bg-white text-emerald-800 font-semibold rounded-full px-3 py-1 hover:bg-emerald-50"
              onClick={() => actions.editZone(zone)}
            >
              ✓ Kembali ke isi dokumen
            </button>
          </div>
        )}
        {outlineOpen && (
          <OutlinePanel
            nodes={outlineNodes}
            currentId={currentHeading}
            onJump={(id) => {
              const el = bodyRef.current?.querySelector(`[data-hid="${id}"]`);
              el?.scrollIntoView({ block: "center", behavior: "smooth" });
            }}
            onClose={() => setOutlineOpen(false)}
          />
        )}
        <div
          ref={scrollRef}
          className="ed-scroll flex-1 overflow-auto min-w-0 relative"
          onKeyDown={onKeyDown}
          onWheel={onWheel}
        >
          {preview && <div ref={previewRef} className="ed-preview-stage p-6 min-h-full" />}
          <div style={{ display: preview ? "none" : undefined, width: paper.w * MM * zoom + 60, margin: "0 auto" }}>
            {ruler && (
                <RulerBar
                  widthMm={paper.w - settings.margins.left - settings.margins.right}
                  marginLeftMm={settings.margins.left}
                  marginRightMm={settings.margins.right}
                  zoom={zoom}
                  firstMm={rulerVals.firstMm}
                  hangMm={rulerVals.hangMm}
                  leftMm={rulerVals.leftMm}
                  rightMm={rulerVals.rightMm}
                  tabs={rulerVals.tabs}
                  onIndent={applyRulerIndent}
                  onTabAdd={(pos) => mutateTabs((t) => [...t, { pos, type: "left" }])}
                  onTabMove={(i, pos) => mutateTabs((t) => t.map((x, j) => (j === i ? { ...x, pos } : x)))}
                  onTabRemove={(i) => mutateTabs((t) => t.filter((_, j) => j !== i))}
                  onTabDialog={(pos) => { setTabPosMm(pos); setDlgTabs(true); }}
                />
              )}
              <Canvas
                settings={settings}
                zoom={zoom}
                zone={zone}
                spellcheck={spellcheck}
                lang={lang}
                guides={guides}
                remountKey={remountKey}
                bodyRef={bodyRef}
                headerRef={headerRef}
                headerFirstRef={headerFirstRef}
                footerRef={footerRef}
                footerFirstRef={footerFirstRef}
                onBodyInput={onBodyInput}
                onHfInput={onHfInput}
                onSelectionChanged={onSelectionChanged}
                onZoneActivate={(z) => actions.editZone(z)}
                onContext={onContext}
                onImageDropped={(f) => insertImageFile(f)}
                onContentMutated={onContentMutated}
              />
          </div>
        </div>
      </div>
      <StatusBar
        page={page} pages={pages} words={words} chars={chars} zoom={zoom}
        saveState={saveState} lastSaved={lastSaved} lang={lang}
        onZoomIn={actions.zoomIn} onZoomOut={actions.zoomOut} onZoomPct={actions.zoomPct}
      />

      {/* Dialog */}
      <PageSetupDialog open={dlgPageSetup} onClose={() => setDlgPageSetup(false)} settings={settings} onChange={applySettings} />
      <ParagraphDialog open={dlgParagraph} onClose={() => setDlgParagraph(false)} initial={paragraphInit.current} onApply={applyParagraph} />
      <InsertTableDialog
        open={dlgInsertTable} onClose={() => setDlgInsertTable(false)}
        onInsert={(r, c, header) =>
          run((root) => {
            exec("insertHTML", makeTableHtml(r, c, { header, widthMm: contentWidth(settings) }));
            void root;
          })
        }
      />
      <TablePropsDialog open={dlgTableProps} onClose={() => setDlgTableProps(false)} initial={tablePropsInit.current} onApply={applyTableProps} />
      <ImageDialog open={dlgImage} onClose={() => setDlgImage(false)} initial={imgInit.current} onApply={applyImageProps} />
      <LinkDialog
        open={dlgLink} onClose={() => setDlgLink(false)} initialText={linkInitial}
        onApply={(url, text) => run((root) => insertLink(root, url, text || undefined))}
        onRemove={() => run((root) => removeLink(root))}
      />
      <TabStopsDialog
        open={dlgTabs} onClose={() => setDlgTabs(false)}
        stops={rulerVals.tabs} posMm={tabPosMm}
        onAdd={(pos, type) => mutateTabs((t) => [...t, { pos, type }])}
        onRemove={(i) => mutateTabs((t) => t.filter((_, j) => j !== i))}
        onClear={() => mutateTabs(() => [])}
      />
      <VersionsDialog
        open={dlgVersions} onClose={() => setDlgVersions(false)}
        versions={versions} busy={busy}
        onCreate={async (label) => {
          if (!docRef.current) return;
          setBusy(true);
          try {
            await fetch(`/api/documents/${docRef.current.id}/versions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: label || "Manual", author: "Pengguna" }),
            });
            await refreshVersions();
            toast({ title: "Versi tersimpan" });
          } finally {
            setBusy(false);
          }
        }}
        onRestore={async (versionId) => {
          if (!docRef.current || !confirm("Pulihkan versi ini? Keadaan sekarang disimpan otomatis sebagai versi \"Sebelum pemulihan\".")) return;
          setBusy(true);
          try {
            const r = await fetch(`/api/documents/${docRef.current.id}/restore`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ versionId }),
            });
            if (!r.ok) throw new Error();
            const data = await r.json();
            docRef.current = { ...docRef.current, ...data.doc };
            applyDocToDom(docRef.current);
            setTitle(data.doc.title);
            setDirty(false);
            await refreshVersions();
            toast({ title: "Versi dipulihkan" });
          } catch {
            toast({ title: "Gagal memulihkan versi", variant: "destructive" });
          } finally {
            setBusy(false);
          }
        }}
      />
      <ReviewDialog
        open={dlgReview} onClose={() => setDlgReview(false)}
        stats={reviewStats} spellcheck={spellcheck} onSpellcheck={actions.spellcheck}
        lang={lang} onLang={actions.lang}
      />
      <PageNumberDialog
        open={dlgPageNumber} onClose={() => setDlgPageNumber(false)}
        settings={settings} onChange={applySettings}
        onInsertField={() => run((root) => insertFieldPage(root))}
      />
      <ContextMenu state={ctx} onClose={() => setCtx(null)} actions={ctxActions} />

      {/* input gambar tersembunyi */}
      <input
        ref={imgInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) insertImageFile(f);
        }}
      />
      {loading && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl px-6 py-4 text-sm text-slate-600">Memuat dokumen…</div>
        </div>
      )}
    </div>
  );
}

function fmtTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + ", " + d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
