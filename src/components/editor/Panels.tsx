"use client";

// ============================================================
// Editor Dokumen — panel pendukung: navigasi outline, cari & ganti,
// penggaris, bilah status, menu konteks
// ============================================================
import { useEffect, useRef, useState } from "react";
import {
  X, ChevronUp, ChevronDown, ArrowLeftRight, CaseSensitive, FileText,
} from "lucide-react";

/* ---------------- Panel Navigasi (Outline) ---------------- */

export type OutlineNode = { id: string; level: number; text: string; page: number };

export function OutlinePanel({
  nodes, onJump, onClose, currentId,
}: {
  nodes: OutlineNode[]; onJump: (id: string) => void; onClose: () => void; currentId: string | null;
}) {
  return (
    <div className="w-60 shrink-0 border-r bg-slate-50 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Navigasi Dokumen</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-200" title="Tutup panel">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {nodes.length === 0 ? (
          <p className="text-xs text-slate-400 px-3 py-4 leading-relaxed">
            Belum ada judul. Gunakan gaya <b>Judul 1–4</b> pada paragraf untuk membangun struktur dokumen.
          </p>
        ) : (
          nodes.map((n) => (
            <button
              key={n.id}
              onClick={() => onJump(n.id)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-baseline gap-1 hover:bg-emerald-50 ${
                currentId === n.id ? "bg-emerald-100 text-emerald-900 font-semibold" : "text-slate-700"
              }`}
              style={{ paddingLeft: 10 + (n.level - 1) * 14 }}
              title={n.text}
            >
              <span className="truncate flex-1">{n.text}</span>
              <span className="text-[10px] text-slate-400">hal. {n.page}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Cari & Ganti ---------------- */

export function FindReplaceBar({
  onClose, find, setFind, replace, setReplace, matchCase, setMatchCase,
  count, activeIdx, onFind, onNext, onPrev, onReplaceOne, onReplaceAll,
}: {
  onClose: () => void;
  find: string; setFind: (v: string) => void;
  replace: string; setReplace: (v: string) => void;
  matchCase: boolean; setMatchCase: (v: boolean) => void;
  count: number; activeIdx: number;
  onFind: () => void; onNext: () => void; onPrev: () => void;
  onReplaceOne: () => void; onReplaceAll: () => void;
}) {
  const [showReplace, setShowReplace] = useState(false);
  return (
    <div className="border-b bg-amber-50 px-3 py-2 flex flex-wrap items-center gap-2 text-sm shadow-sm">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={find}
          onChange={(e) => setFind(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onFind(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="Cari dalam dokumen…"
          className="h-8 w-56 rounded border border-amber-300 bg-white px-2 text-xs outline-none focus:border-amber-500"
        />
        <button onClick={onFind} className="ed-tool-btn" title="Cari">Cari</button>
        <button onClick={onPrev} className="ed-tool-btn" title="Sebelumnya" disabled={!count}><ChevronUp className="h-4 w-4" /></button>
        <button onClick={onNext} className="ed-tool-btn" title="Berikutnya" disabled={!count}><ChevronDown className="h-4 w-4" /></button>
        <span className="text-xs text-slate-500 w-16 text-center">
          {count ? `${activeIdx + 1}/${count}` : "0 hasil"}
        </span>
        <button
          onClick={() => setShowReplace((s) => !s)}
          className={`ed-tool-btn ${showReplace ? "active" : ""}`}
          title="Tampilkan ganti"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={`ed-tool-btn ${matchCase ? "active" : ""}`}
          title="Cocokkan huruf besar/kecil"
        >
          <CaseSensitive className="h-4 w-4" />
        </button>
      </div>
      {showReplace && (
        <div className="flex items-center gap-1">
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Ganti dengan…"
            className="h-8 w-56 rounded border border-amber-300 bg-white px-2 text-xs outline-none focus:border-amber-500"
          />
          <button onClick={onReplaceOne} className="ed-tool-btn" title="Ganti hasil aktif">Ganti</button>
          <button onClick={onReplaceAll} className="ed-tool-btn" title="Ganti semua hasil">Ganti Semua</button>
        </div>
      )}
      <button onClick={onClose} className="ml-auto ed-tool-btn" title="Tutup (Esc)"><X className="h-4 w-4" /></button>
    </div>
  );
}

/* ---------------- Penggaris ---------------- */

export function RulerBar({
  widthMm, marginLeftMm, marginRightMm, zoom,
  firstMm, hangMm, leftMm, rightMm, tabs,
  onIndent, onTabAdd, onTabMove, onTabRemove, onTabDialog,
}: {
  widthMm: number; marginLeftMm: number; marginRightMm: number; zoom: number;
  firstMm: number; hangMm: number; leftMm: number; rightMm: number;
  tabs: { pos: number; type: "left" | "center" | "right" }[];
  onIndent: (v: { firstMm?: number; hangMm?: number; leftMm?: number; rightMm?: number }) => void;
  onTabAdd: (posMm: number) => void;
  onTabMove: (idx: number, posMm: number) => void;
  onTabRemove: (idx: number) => void;
  onTabDialog: (posMm: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = (mm: number) => mm * 3.77952768 * zoom;

  const xToMm = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(widthMm, (clientX - r.left) / zoom / 3.77952768));
  };

  const startDrag = (e: React.PointerEvent, kind: "first" | "hang" | "left" | "right" | null, tabIdx?: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const orig = { firstMm, hangMm, leftMm, rightMm, tabPos: tabIdx !== undefined ? tabs[tabIdx].pos : 0 };
    const move = (ev: PointerEvent) => {
      const dmm = (ev.clientX - startX) / zoom / 3.77952768;
      if (kind === "first") onIndent({ firstMm: Math.max(-20, orig.firstMm + dmm) });
      else if (kind === "hang") onIndent({ hangMm: Math.max(0, orig.hangMm + dmm) });
      else if (kind === "left") onIndent({ leftMm: Math.max(0, orig.leftMm + dmm) });
      else if (kind === "right") onIndent({ rightMm: Math.max(0, orig.rightMm - dmm) });
      else if (tabIdx !== undefined) onTabMove(tabIdx, Math.max(0, orig.tabPos + dmm));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const leftMl = px(marginLeftMm);
  const rightMl = px(marginRightMm);
  const indentLeft = px(leftMm);
  const firstOffset = hangMm > 0 ? px(-hangMm) : px(firstMm);

  return (
    <div
      ref={ref}
      className="ed-ruler"
      style={{ width: px(widthMm) }}
      onDoubleClick={(e) => onTabDialog(xToMm(e.clientX))}
      title="Klik dua pada penggaris: tambah tab stop"
    >
      <div className="ruler-margin" style={{ left: 0, width: leftMl }} />
      <div className="ruler-margin" style={{ right: 0, width: rightMl }} />
      {/* marker inden */}
      <div className="ruler-marker" style={{ left: leftMl + indentLeft + firstOffset - 5, top: 1 }} onPointerDown={(e) => startDrag(e, "first")} title="Inden baris pertama">
        <div className="mk mk-first" />
      </div>
      <div className="ruler-marker" style={{ left: leftMl + indentLeft - 5, bottom: 1 }} onPointerDown={(e) => startDrag(e, "hang")} title="Inden gantung">
        <div className="mk mk-hang" />
      </div>
      <div className="ruler-marker" style={{ left: leftMl + indentLeft - 4, bottom: 1 }} onPointerDown={(e) => startDrag(e, "left")} title="Inden kiri">
        <div className="mk mk-left" />
      </div>
      <div className="ruler-marker" style={{ right: rightMl - 4, bottom: 1 }} onPointerDown={(e) => startDrag(e, "right")} title="Inden kanan">
        <div className="mk mk-right" />
      </div>
      {/* tab stops */}
      {tabs.map((t, i) => (
        <div
          key={i}
          className={`ruler-tab tab-${t.type}`}
          style={{ left: leftMl + px(t.pos) - 4 }}
          onPointerDown={(e) => startDrag(e, null, i)}
          onDoubleClick={(e) => { e.stopPropagation(); onTabRemove(i); }}
          onContextMenu={(e) => { e.preventDefault(); onTabRemove(i); }}
          title={`Tab ${t.type} — seret untuk memindah, klik kanan untuk hapus`}
        />
      ))}
      <FileText className="absolute right-1 top-1 h-2.5 w-2.5 text-slate-300" />
    </div>
  );
}

/* ---------------- Bilah status ---------------- */

export function StatusBar({
  page, pages, words, chars, zoom, saveState, lastSaved, lang,
  onZoomIn, onZoomOut, onZoomPct,
}: {
  page: number; pages: number; words: number; chars: number; zoom: number;
  saveState: string; lastSaved: string | null; lang: string;
  onZoomIn: () => void; onZoomOut: () => void; onZoomPct: (z: number) => void;
}) {
  return (
    <div className="bg-slate-800 text-slate-200 h-7 flex items-center gap-4 px-3 text-[11px] shrink-0">
      <span>Halaman {page} dari {pages}</span>
      <span className="text-slate-500">|</span>
      <span>{words.toLocaleString("id-ID")} kata</span>
      <span>{chars.toLocaleString("id-ID")} karakter</span>
      <span className="text-slate-500">|</span>
      <span className="uppercase">{lang}</span>
      <span className="ml-auto flex items-center gap-2">
        <span className={saveState === "saving" ? "text-amber-300" : saveState === "dirty" ? "text-red-300" : "text-emerald-300"}>
          {saveState === "saving" ? "Menyimpan…" : saveState === "dirty" ? "Perubahan belum disimpan" : lastSaved ? `Tersimpan ${lastSaved}` : "Tersimpan"}
        </span>
        <span className="text-slate-500">|</span>
        <button className="hover:text-white px-1" onClick={onZoomOut} title="Perkecil">−</button>
        <select
          value={String(Math.round(zoom * 100))}
          onChange={(e) => onZoomPct(parseInt(e.target.value, 10) / 100)}
          className="bg-slate-700 rounded px-1 py-0.5 text-[11px] outline-none"
          title="Tingkat pembesaran"
        >
          {[50, 75, 90, 100, 125, 150, 175, 200].map((z) => (
            <option key={z} value={z}>{z}%</option>
          ))}
        </select>
        <button className="hover:text-white px-1" onClick={onZoomIn} title="Perbesar">+</button>
      </span>
    </div>
  );
}

/* Menu konteks ---------------- */

export type CtxMenuState = {
  x: number; y: number;
  kind: "text" | "table" | "image" | "link";
} | null;

export function ContextMenu({
  state, onClose, actions,
}: {
  state: CtxMenuState; onClose: () => void;
  actions: {
    copy(): void; cut(): void; paste(): void; bold(): void; italic(): void;
    insertLink(): void; removeLink(): void;
    addRowAbove(): void; addRowBelow(): void; deleteRow(): void;
    addColLeft(): void; addColRight(): void; deleteCol(): void;
    mergeCells(): void; splitCell(): void; tableProps(): void;
    imageProps(): void; imageAlign(align: "left" | "center" | "right" | "floatLeft" | "floatRight"): void;
    imageCaption(): void; imageDelete(): void;
    selectAll(): void; paragraphDialog(): void;
  };
}) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("click", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("click", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [onClose]);

  const item = (label: string, fn: () => void, opts?: { key?: string; danger?: boolean; icon?: React.ReactNode }) => (
    <button key={label} className={`ed-ctx-item ${opts?.danger ? "danger" : ""}`} onClick={() => { fn(); onClose(); }}>
      {opts?.icon}
      {label}
      {opts?.key && <span className="ed-ctx-key">{opts.key}</span>}
    </button>
  );

  if (!state) return null;
  const style = {
    left: Math.min(state.x, window.innerWidth - 240),
    top: Math.min(state.y, window.innerHeight - 320),
  };

  return (
    <div className="ed-ctx" style={style} onContextMenu={(e) => e.preventDefault()}>
      {state.kind === "text" && (
        <>
          {item("Salin", actions.copy, { key: "Ctrl+C" })}
          {item("Potong", actions.cut, { key: "Ctrl+X" })}
          {item("Tempel", actions.paste, { key: "Ctrl+V" })}
          <div className="ed-ctx-sep" />
          {item("Tebal", actions.bold, { key: "Ctrl+B" })}
          {item("Miring", actions.italic, { key: "Ctrl+I" })}
          {item("Tautan…", actions.insertLink, { key: "Ctrl+K" })}
          {item("Properti paragraf…", actions.paragraphDialog)}
          <div className="ed-ctx-sep" />
          {item("Pilih semua", actions.selectAll, { key: "Ctrl+A" })}
        </>
      )}
      {state.kind === "link" && (
        <>
          {item("Buka penyunting tautan…", actions.insertLink)}
          {item("Hapus tautan", actions.removeLink, { danger: true })}
        </>
      )}
      {state.kind === "table" && (
        <>
          {item("Sisipkan baris di atas", actions.addRowAbove)}
          {item("Sisipkan baris di bawah", actions.addRowBelow)}
          {item("Hapus baris", actions.deleteRow, { danger: true })}
          <div className="ed-ctx-sep" />
          {item("Sisipkan kolom kiri", actions.addColLeft)}
          {item("Sisipkan kolom kanan", actions.addColRight)}
          {item("Hapus kolom", actions.deleteCol, { danger: true })}
          <div className="ed-ctx-sep" />
          {item("Gabungkan sel", actions.mergeCells)}
          {item("Pisahkan sel", actions.splitCell)}
          {item("Properti tabel…", actions.tableProps)}
        </>
      )}
      {state.kind === "image" && (
        <>
          {item("Properti gambar…", actions.imageProps)}
          <div className="ed-ctx-sep" />
          {item("Rata tengah", () => actions.imageAlign("center"))}
          {item("Rata kiri", () => actions.imageAlign("left"))}
          {item("Rata kanan", () => actions.imageAlign("right"))}
          {item("Mengapung kiri", () => actions.imageAlign("floatLeft"))}
          {item("Mengapung kanan", () => actions.imageAlign("floatRight"))}
          {item("Tambah keterangan", actions.imageCaption)}
          <div className="ed-ctx-sep" />
          {item("Hapus gambar", actions.imageDelete, { danger: true })}
        </>
      )}
    </div>
  );
}
