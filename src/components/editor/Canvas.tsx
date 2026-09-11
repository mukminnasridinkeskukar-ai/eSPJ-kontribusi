"use client";

// ============================================================
// Editor Dokumen — kanvas kertas WYSIWYG
// ============================================================
import { useEffect, useRef } from "react";
import type { DocSettings } from "@/lib/editor/types";
import { effectivePaper, MM } from "@/lib/editor/types";

export type Zone = "body" | "header" | "headerFirst" | "footer" | "footerFirst";

type Props = {
  settings: DocSettings;
  zoom: number;
  zone: Zone;
  spellcheck: boolean;
  lang: string;
  guides: { topMm: number; label: number }[];
  remountKey: string;
  bodyRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  headerFirstRef: React.RefObject<HTMLDivElement | null>;
  footerRef: React.RefObject<HTMLDivElement | null>;
  footerFirstRef: React.RefObject<HTMLDivElement | null>;
  onBodyInput: () => void;
  onHfInput: (zone: Zone) => void;
  onSelectionChanged: () => void;
  onZoneActivate: (z: Zone) => void;
  onContext: (e: React.MouseEvent, target: HTMLElement) => void;
  onImageDropped: (file: File, atEl?: HTMLElement) => void;
  onContentMutated: () => void; // setelah resize gambar/kolom via drag
};

export default function Canvas({
  settings, zoom, zone, spellcheck, lang, guides, remountKey,
  bodyRef, headerRef, headerFirstRef, footerRef, footerFirstRef,
  onBodyInput, onHfInput, onSelectionChanged, onZoneActivate, onContext,
  onImageDropped, onContentMutated,
}: Props) {
  const paperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const paper = effectivePaper(settings);
  const zoneActive = zone !== "body";

  /* ---------- Seleksi & ubah ukuran gambar ---------- */
  const selectedImg = useRef<HTMLImageElement | null>(null);
  const handlesRef = useRef<HTMLDivElement[]>([]);

  function selectImage(img: HTMLImageElement) {
    deselectImage();
    selectedImg.current = img;
    img.classList.add("img-selected");
    placeHandles(img);
  }
  function deselectImage() {
    if (selectedImg.current) selectedImg.current.classList.remove("img-selected");
    selectedImg.current = null;
    handlesRef.current.forEach((h) => (h.style.display = "none"));
  }
  function placeHandles(img: HTMLImageElement) {
    const paper = paperRef.current;
    if (!paper) return;
    const ir = img.getBoundingClientRect();
    const pr = paper.getBoundingClientRect();
    const z = zoom;
    const pos = [
      { cls: "nw", l: ir.left - pr.left, t: ir.top - pr.top },
      { cls: "ne", l: ir.right - pr.left, t: ir.top - pr.top },
      { cls: "sw", l: ir.left - pr.left, t: ir.bottom - pr.top },
      { cls: "se", l: ir.right - pr.left, t: ir.bottom - pr.top },
    ];
    pos.forEach((p, i) => {
      let h = handlesRef.current[i];
      if (!h) {
        h = document.createElement("div");
        h.className = `ed-img-handle ${p.cls}`;
        overlayRef.current?.appendChild(h);
        handlesRef.current[i] = h;
      }
      h.className = `ed-img-handle ${p.cls}`;
      h.style.display = "block";
      h.style.left = p.l / z - 5 + "px";
      h.style.top = p.t / z - 5 + "px";
      h.onmousedown = (e) => startImgResize(e, img, p.cls);
    });
  }
  function startImgResize(e: MouseEvent, img: HTMLImageElement, dir: string) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = img.offsetWidth;
    const startH = img.offsetHeight;
    const ratio = startW / startH;
    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom * (dir.includes("w") ? -1 : 1);
      let w = Math.max(24, startW + dx);
      let h = Math.round(w / ratio);
      img.style.width = w + "px";
      img.style.height = h + "px";
      img.style.maxWidth = "100%";
      placeHandles(img);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onContentMutated();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /* ---------- Seleksi sel tabel ---------- */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    let dragging = false;
    const down = (e: Event) => {
      const me = e as MouseEvent;
      const td = (me.target as HTMLElement)?.closest?.("td,th") as HTMLTableCellElement | null;
      const img = (me.target as HTMLElement)?.closest?.("img");
      if (img) {
        selectImage(img as HTMLImageElement);
        // jangan mulai seleksi sel
      }
      if (td && (me.target as HTMLElement).closest(".ed-body")) {
        const prev = paper.querySelectorAll("td.cell-sel, th.cell-sel");
        if (!(me.shiftKey || me.ctrlKey)) prev.forEach((x) => x.classList.remove("cell-sel"));
        dragging = true;
        td.classList.add("cell-sel");
      } else if (!(me.target as HTMLElement).closest?.("td,th")) {
        paper.querySelectorAll("td.cell-sel, th.cell-sel").forEach((x) => x.classList.remove("cell-sel"));
        deselectImage();
      }
    };
    const over = (e: Event) => {
      if (!dragging) return;
      const td = (e as MouseEvent).target as HTMLTableCellElement;
      if (td?.closest?.("td,th")) td.classList.add("cell-sel");
    };
    const up = () => {
      dragging = false;
    };
    paper.addEventListener("mousedown", down);
    paper.addEventListener("mouseover", over);
    window.addEventListener("mouseup", up);
    return () => {
      paper.removeEventListener("mousedown", down);
      paper.removeEventListener("mouseover", over);
      window.removeEventListener("mouseup", up);
    };
     
  }, [remountKey]);

  // posisi ulang pegangan saat zoom berubah / scroll
  useEffect(() => {
    const refresh = () => {
      if (selectedImg.current) placeHandles(selectedImg.current);
    };
    paperRef.current?.closest(".ed-scroll")?.addEventListener("scroll", refresh);
    window.addEventListener("resize", refresh);
    refresh();
    return () => {
      paperRef.current?.closest(".ed-scroll")?.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
    };
     
  }, [zoom, remountKey]);

  function ensureCol(table: HTMLTableElement) {
    let cg = table.querySelector("colgroup");
    if (cg) return;
    cg = document.createElement("colgroup");
    const firstRow = table.rows[0];
    if (!firstRow) return;
    table.insertBefore(cg, table.firstChild);
    for (let i = 0; i < firstRow.cells.length; i++) {
      const col = document.createElement("col");
      col.style.width = (firstRow.cells[i].offsetWidth / MM).toFixed(2) + "mm";
      cg.appendChild(col);
    }
  }

  /* ---------- Pegangan ubah lebar kolom ---------- */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const handle = document.createElement("div");
    handle.className = "ed-col-handle";
    handle.style.display = "none";
    overlayRef.current?.appendChild(handle);
    let curTd: HTMLTableCellElement | null = null;

    const move = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const td = t?.closest?.("td,th") as HTMLTableCellElement | null;
      if (!td || !td.closest(".ed-body")) { handle.style.display = "none"; curTd = null; return; }
      const r = td.getBoundingClientRect();
      const pr = paper.getBoundingClientRect();
      if (e.clientX > r.right - 7 && e.clientX < r.right + 5 && td.colSpan === 1) {
        const table = td.closest("table") as HTMLTableElement | null;
        if (table) {
          const tr = td.parentElement!;
          const idx = Array.from((tr as HTMLTableRowElement).cells).indexOf(td);
          const cg = table.querySelector("colgroup");
          if (cg && cg.querySelectorAll("col")[idx]) {
            curTd = td;
            handle.style.display = "block";
            handle.style.left = (r.right - pr.left) / zoom - 3 + "px";
            handle.style.top = (table.getBoundingClientRect().top - pr.top) / zoom + "px";
            handle.style.height = table.getBoundingClientRect().height / zoom + "px";
            return;
          }
        }
      }
      handle.style.display = "none";
      curTd = null;
    };
    const down = (e: MouseEvent) => {
      if (handle.style.display !== "block" || !curTd) return;
      e.preventDefault();
      const td = curTd;
      const table = td.closest("table") as HTMLTableElement;
      const cg = table.querySelector("colgroup");
      if (!cg) return;
      ensureCol(table);
      const tr = td.parentElement!;
      const idx = Array.from((tr as HTMLTableRowElement).cells).indexOf(td);
      const col = cg.querySelectorAll("col")[idx] as HTMLElement;
      const startX = e.clientX;
      const startWmm = parseFloat(col.style.width) || td.offsetWidth / MM;
      const totalCols = cg.querySelectorAll("col").length;
      const moveEv = (ev: MouseEvent) => {
        const dmm = (ev.clientX - startX) / zoom / MM;
        const w = Math.max(4, startWmm + dmm);
        col.style.width = w.toFixed(2) + "mm";
      };
      const upEv = () => {
        window.removeEventListener("pointermove", moveEv);
        window.removeEventListener("pointerup", upEv);
        onContentMutated();
        void totalCols;
      };
      window.addEventListener("pointermove", moveEv);
      window.addEventListener("pointerup", upEv);
    };
    paper.addEventListener("mousemove", move);
    paper.addEventListener("mousedown", down);
    return () => {
      paper.removeEventListener("mousemove", move);
      paper.removeEventListener("mousedown", down);
      handle.remove();
    };
     
  }, [zoom, remountKey]);

  /* ---------- Klik tautan tidak menavigasi ---------- */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const click = (e: Event) => {
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (a) e.preventDefault();
    };
    paper.addEventListener("click", click);
    return () => paper.removeEventListener("click", click);
  }, [remountKey]);

  /* ---------- Drop gambar ---------- */

  const bodyEditable = !zoneActive;

  const zoneProps = (z: Zone, ref: React.RefObject<HTMLDivElement | null>) => ({
    ref,
    contentEditable: zone === z,
    suppressContentEditableWarning: true,
    spellCheck: spellcheck,
    onInput: () => onHfInput(z),
    onDoubleClick: () => onZoneActivate(z),
    className: `ed-hf-zone ${zone === z ? "ed-hf-active" : ""}`,
  });

  return (
    <div className="p-6" style={{ minWidth: paper.w * MM * zoom + 60 }}>
      <div style={{ width: paper.w * MM * zoom, margin: "0 auto" }}>
        {/* penggaris ditempatkan oleh DocumentEditor di atas kanvas */}
        <div
          ref={paperRef}
          className="ed-paper relative"
          style={{
            width: paper.w * MM,
            minHeight: paper.h * MM,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            padding: `${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm`,
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onContext(e, e.target as HTMLElement);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const f = e.dataTransfer?.files?.[0];
            if (f && f.type.startsWith("image/")) {
              e.preventDefault();
              onImageDropped(f, e.target as HTMLElement);
            }
          }}
        >
          {/* Zona kop atas */}
          <div className="absolute flex flex-col gap-1" style={{ top: settings.headerDist + "mm", left: settings.margins.left + "mm", right: settings.margins.right + "mm" }}>
            {settings.differentFirstPage && (
              <div {...zoneProps("headerFirst", headerFirstRef)} style={{ top: 0 }}>
                <span className="ed-hf-label">Kop Halaman 1 — ketik di sini</span>
              </div>
            )}
            <div {...zoneProps("header", headerRef)}>
              <span className="ed-hf-label">Kop Atas — klik dua kali / tombol Kop untuk mengedit</span>
            </div>
          </div>

          {/* Isi dokumen */}
          <div
            key={remountKey}
            ref={bodyRef}
            className="ed-body"
            contentEditable={bodyEditable}
            suppressContentEditableWarning
            spellCheck={spellcheck}
            lang={lang}
            style={{
              fontFamily: `'${settings.docFont}', serif`,
              fontSize: settings.docFontSize + "pt",
              lineHeight: String(settings.docLineHeight),
              opacity: zoneActive ? 0.45 : 1,
              pointerEvents: zoneActive ? "none" : "auto",
              minHeight: Math.max(40, paper.h - settings.margins.top - settings.margins.bottom) + "mm",
              transition: "opacity .15s",
            }}
            onInput={onBodyInput}
            onKeyUp={onSelectionChanged}
            onMouseUp={onSelectionChanged}
            onFocus={onSelectionChanged}
          />

          {/* Zona kaki bawah */}
          <div className="absolute flex flex-col-reverse gap-1" style={{ bottom: settings.footerDist + "mm", left: settings.margins.left + "mm", right: settings.margins.right + "mm" }}>
            {settings.differentFirstPage && (
              <div {...zoneProps("footerFirst", footerFirstRef)}>
                <span className="ed-hf-label">Kaki Halaman 1</span>
              </div>
            )}
            <div {...zoneProps("footer", footerRef)}>
              <span className="ed-hf-label">Kaki Bawah — klik dua kali / tombol Kaki untuk mengedit</span>
            </div>
          </div>

          {/* Panduan batas halaman */}
          {guides.map((g) => (
            <div key={g.label} className="ed-guide" style={{ top: g.topMm * MM }}>
              <span className="ed-guide-num">{g.label}</span>
            </div>
          ))}

          {/* Overlay pegangan */}
          <div ref={overlayRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
            {/* pegangan dikelola imperatif; pointer-events diaktifkan per elemen */}
          </div>
        </div>
      </div>
    </div>
  );
}
