"use client";

// ============================================================
// Editor Dokumen — Ribbon 7 tab (File, Home, Insert, Layout,
// References, Review, View) dengan seluruh tombol berfungsi nyata
// ============================================================
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript as SubIcon, Superscript as SupIcon, Baseline, Highlighter, Eraser,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ListTree,
  IndentIncrease, IndentDecrease, Table as TableIcon, Image as ImageIcon, Link2,
  FileText, Type, Replace, Save, History, Printer, Download, Upload,
  Plus, FilePlus2, Scissors, ClipboardPaste, SpellCheck, Ruler as RulerIcon,
  PanelLeft, Eye, Maximize, ZoomIn, ZoomOut, MoveVertical, ArrowRightToLine,
  Hash, CalendarDays, Shapes, FileOutput, Files, Sigma, Languages, WrapText,
  SquareSplitVertical, ArrowDownUp, PanelTop, PanelBottom, Settings2,
} from "lucide-react";
import type { StyleName } from "@/lib/editor/commands";
import { FONT_LIST, FONT_SIZES, PAPER_SIZES, MARGIN_PRESETS, PaperSizeKey } from "@/lib/editor/types";

void Languages; void MoveVertical;

const TEXT_COLORS = ["#000000", "#374151", "#b91c1c", "#c2410c", "#a16207", "#15803d", "#0f766e", "#1d4ed8", "#6d28d9", "#be185d", "#ffffff"];
const HL_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fde68a", "#bae6fd", "#ffffff"];

export type SaveState = "idle" | "dirty" | "saving" | "saved";

export type RibbonFlags = {
  bold: boolean; italic: boolean; underline: boolean;
  align: "left" | "center" | "right" | "justify";
  zone: "body" | "header" | "footer" | "headerFirst" | "footerFirst";
  zoom: number; ruler: boolean; outline: boolean; preview: boolean;
  spellcheck: boolean; canUndo: boolean; canRedo: boolean;
  saveState: SaveState; lastSaved: string | null; dirty: boolean;
  title: string; pages: number; page: number; words: number; chars: number;
  differentFirstPage: boolean;
  paperKey: string;
  orientation: "portrait" | "landscape";
};

export type RibbonActions = {
  undo(): void; redo(): void; cut(): void; copySel(): void; paste(): void;
  font(f: string): void; size(pt: number): void; bold(): void; italic(): void; underline(): void;
  strike(): void; sub(): void; sup(): void; color(c: string): void; highlight(c: string): void;
  clearFormat(): void;
  align(a: "left" | "center" | "right" | "justify"): void; lineSpacing(v: string): void;
  indentPlus(): void; indentMinus(): void; paragraphDialog(): void;
  bullets(): void; numbers(): void; multilevel(): void; restart(): void; continueNum(): void;
  style(n: StyleName): void;
  insertTable(): void; insertImage(): void; insertLink(): void; insertPageBreak(): void;
  insertDate(): void; insertSymbol(ch: string): void; insertPageField(): void;
  editZone(z: RibbonFlags["zone"]): void; pageNumberDialog(): void;
  paperSize(k: PaperSizeKey): void; orientation(o: "portrait" | "landscape"): void;
  marginPreset(k: string): void; pageSetupDialog(): void;
  insertToc(): void; updateToc(): void;
  reviewDialog(): void; spellcheck(on: boolean): void; lang(l: string): void; versions(): void;
  zoomIn(): void; zoomOut(): void; zoomFitW(): void; zoomFitP(): void; zoomPct(z: number): void;
  toggleRuler(): void; toggleOutline(): void; togglePreview(): void; fullscreen(): void;
  save(): void; saveVersion(): void; print(): void;
  exportDocx(): void; exportHtml(): void; exportTxt(): void;
  importFile(file: File): void; newDoc(): void; close(): void;
  rename(t: string): void;
  findOpen(withReplace?: boolean): void;
};

const ZONE_LABEL: Record<RibbonFlags["zone"], string> = {
  body: "Isi Dokumen", header: "Kop Atas", headerFirst: "Kop Hal. 1",
  footer: "Kaki Bawah", footerFirst: "Kaki Hal. 1",
};

function TBtn({
  children, onClick, active, title, disabled,
}: {
  children: React.ReactNode; onClick?: () => void; active?: boolean;
  title?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`ed-tool-btn ${active ? "active" : ""} ${disabled ? "opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

function ColorMenu({
  icon, label, colors, onPick, onClear,
}: {
  icon: React.ReactNode; label: string; colors: string[];
  onPick: (c: string) => void; onClear?: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title={label} onMouseDown={(e) => e.preventDefault()} className="ed-tool-btn flex-col !gap-0 leading-none">
          {icon}
          <span className="block w-4 h-1 rounded-sm bg-current mt-0.5" style={{ background: label.includes("Teks") ? "#111" : "#fef08a" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="bottom" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(c)}
              className="w-6 h-6 rounded border border-slate-300 hover:ring-2 ring-emerald-500"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="color" className="h-7 w-10 cursor-pointer" onChange={(e) => onPick(e.target.value)} title="Warna lainnya" />
          {onClear && (
            <Button variant="ghost" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={onClear}>
              Tanpa warna
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Ribbon({ tab, setTab, flags, actions }: {
  tab: string; setTab: (t: string) => void; flags: RibbonFlags; actions: RibbonActions;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const fileInput = () => importRef.current?.click();
  const [tabList] = useState(["file", "home", "insert", "layout", "references", "review", "view"]);
  const tabLabel: Record<string, string> = {
    file: "Berkas", home: "Beranda", insert: "Sisipkan", layout: "Tata Letak",
    references: "Referensi", review: "Tinjau", view: "Tampilan",
  };

  const saveLabel =
    flags.saveState === "saving" ? "Menyimpan…" :
    flags.dirty ? "Belum tersimpan" :
    flags.lastSaved ? `Tersimpan ${flags.lastSaved}` : "Tersimpan";

  return (
    <div className="bg-slate-800 select-none">
      {/* Baris tab + judul dokumen + status simpan */}
      <div className="flex items-end gap-1 px-2 pt-1.5">
        <div className="flex items-center gap-1.5 mr-3 pb-1">
          <FileText className="h-4 w-4 text-emerald-300" />
          <input
            value={flags.title}
            onChange={(e) => actions.rename(e.target.value)}
            className="bg-transparent text-white text-sm font-semibold px-2 py-1 rounded hover:bg-white/10 focus:bg-white/15 outline-none w-52 border border-transparent focus:border-emerald-400"
            title="Nama dokumen"
          />
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full ${
            flags.saveState === "saving" ? "bg-amber-500/20 text-amber-200"
            : flags.dirty ? "bg-red-500/20 text-red-200"
            : "bg-emerald-500/20 text-emerald-200"}`}
          >
            {saveLabel}
          </span>
        </div>
        {tabList.map((t) => (
          <button key={t} className={`ed-ribbon-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* Konten ribbon */}
      <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-1 overflow-x-auto min-h-[46px]">
        {tab === "file" && (
          <>
            <TBtn onClick={actions.newDoc} title="Dokumen baru"><FilePlus2 className="h-4 w-4" /> Baru</TBtn>
            <TBtn onClick={() => { fileInput(); }} title="Buka / impor berkas (DOCX, HTML, TXT)"><Upload className="h-4 w-4" /> Buka</TBtn>
            <TBtn onClick={actions.save} title="Simpan (Ctrl+S)" disabled={!flags.dirty}><Save className="h-4 w-4" /> Simpan</TBtn>
            <TBtn onClick={actions.saveVersion} title="Simpan versi riwayat"><History className="h-4 w-4" /> Simpan Versi</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.print} title="Cetak / PDF (Ctrl+P)"><Printer className="h-4 w-4" /> Cetak / PDF</TBtn>
            <TBtn onClick={actions.exportDocx} title="Unduh DOCX"><Download className="h-4 w-4" /> DOCX</TBtn>
            <TBtn onClick={actions.exportHtml} title="Unduh HTML"><FileOutput className="h-4 w-4" /> HTML</TBtn>
            <TBtn onClick={actions.exportTxt} title="Unduh TXT"><Files className="h-4 w-4" /> TXT</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.close} title="Kembali ke daftar dokumen"><ArrowRightToLine className="h-4 w-4" /> Tutup</TBtn>
            <input
              ref={importRef} type="file" accept=".docx,.html,.htm,.txt" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) actions.importFile(f);
              }}
            />
          </>
        )}

        {tab === "home" && (
          <>
            {/* Clipboard */}
            <TBtn onClick={actions.undo} title="Urungkan (Ctrl+Z)" disabled={!flags.canUndo}><Undo2 className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.redo} title="Ulangi (Ctrl+Y)" disabled={!flags.canRedo}><Redo2 className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.cut} title="Potong (Ctrl+X)"><Scissors className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.copySel} title="Salin (Ctrl+C)"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></TBtn>
            <TBtn onClick={actions.paste} title="Tempel (Ctrl+V)"><ClipboardPaste className="h-4 w-4" /></TBtn>
            <TBtn onClick={() => actions.findOpen(true)} title="Cari & Ganti (Ctrl+H)"><Replace className="h-4 w-4" /></TBtn>
            <span className="ed-tool-sep" />
            {/* Font */}
            <div className="w-36">
              <Select onValueChange={(v) => actions.font(v)}>
                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder={flags.title ? "Jenis huruf" : "Jenis huruf"} /></SelectTrigger>
                <SelectContent>
                  {FONT_LIST.map((f) => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-20">
              <Select onValueChange={(v) => actions.size(parseFloat(v))}>
                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder="Ukuran" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TBtn onClick={actions.bold} active={flags.bold} title="Tebal (Ctrl+B)"><Bold className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.italic} active={flags.italic} title="Miring (Ctrl+I)"><Italic className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.underline} active={flags.underline} title="Garis bawah (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.strike} title="Coret"><Strikethrough className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.sub} title="Subskrip"><SubIcon className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.sup} title="Superskrip"><SupIcon className="h-4 w-4" /></TBtn>
            <ColorMenu icon={<Baseline className="h-4 w-4" />} label="Warna Teks" colors={TEXT_COLORS} onPick={actions.color} />
            <ColorMenu icon={<Highlighter className="h-4 w-4" />} label="Sorot Warna" colors={HL_COLORS} onPick={actions.highlight} onClear={() => actions.highlight("transparent")} />
            <TBtn onClick={actions.clearFormat} title="Hapus format"><Eraser className="h-4 w-4" /></TBtn>
            <span className="ed-tool-sep" />
            {/* Paragraf */}
            <TBtn onClick={() => actions.align("left")} active={flags.align === "left"} title="Rata kiri"><AlignLeft className="h-4 w-4" /></TBtn>
            <TBtn onClick={() => actions.align("center")} active={flags.align === "center"} title="Rata tengah"><AlignCenter className="h-4 w-4" /></TBtn>
            <TBtn onClick={() => actions.align("right")} active={flags.align === "right"} title="Rata kanan"><AlignRight className="h-4 w-4" /></TBtn>
            <TBtn onClick={() => actions.align("justify")} active={flags.align === "justify"} title="Rata kanan-kiri"><AlignJustify className="h-4 w-4" /></TBtn>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" title="Jarak baris" onMouseDown={(e) => e.preventDefault()} className="ed-tool-btn">
                  <WrapText className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" side="bottom" align="start">
                {["1.0", "1.15", "1.5", "2.0"].map((v) => (
                  <button key={v} className="ed-ctx-item" onMouseDown={(e) => e.preventDefault()} onClick={() => actions.lineSpacing(v)}>
                    Spasi {v}
                  </button>
                ))}
                <div className="ed-ctx-sep" />
                <button className="ed-ctx-item" onClick={actions.paragraphDialog}>
                  <Sigma className="h-3.5 w-3.5" /> Spasi & indentasi rinci…
                </button>
              </PopoverContent>
            </Popover>
            <TBtn onClick={actions.indentPlus} title="Tambah inden"><IndentIncrease className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.indentMinus} title="Kurangi inden"><IndentDecrease className="h-4 w-4" /></TBtn>
            <span className="ed-tool-sep" />
            {/* Daftar */}
            <TBtn onClick={actions.bullets} title="Daftar butir"><List className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.numbers} title="Daftar nomor"><ListOrdered className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.multilevel} title="Daftar bertingkat"><ListTree className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.restart} title="Mulai ulang penomoran"><ArrowDownUp className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.continueNum} title="Lanjutkan penomoran"><SquareSplitVertical className="h-4 w-4" /></TBtn>
            <span className="ed-tool-sep" />
            {/* Gaya */}
            <div className="w-40">
              <Select onValueChange={(v) => actions.style(v as StyleName)}>
                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder="Gaya paragraf" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="title">Judul Dokumen</SelectItem>
                  <SelectItem value="subtitle">Sub Judul</SelectItem>
                  <SelectItem value="h1">Judul 1</SelectItem>
                  <SelectItem value="h2">Judul 2</SelectItem>
                  <SelectItem value="h3">Judul 3</SelectItem>
                  <SelectItem value="h4">Judul 4</SelectItem>
                  <SelectItem value="quote">Kutipan</SelectItem>
                  <SelectItem value="caption">Keterangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="ml-auto text-[10.5px] text-slate-400 px-2 whitespace-nowrap">
              Zona aktif: <b className="text-slate-600">{ZONE_LABEL[flags.zone]}</b>
            </span>
          </>
        )}

        {tab === "insert" && (
          <>
            <TBtn onClick={actions.insertTable} title="Sisipkan tabel"><TableIcon className="h-4 w-4" /> Tabel</TBtn>
            <TBtn onClick={actions.insertImage} title="Sisipkan gambar"><ImageIcon className="h-4 w-4" /> Gambar</TBtn>
            <TBtn onClick={actions.insertLink} title="Sisipkan tautan (Ctrl+K)"><Link2 className="h-4 w-4" /> Tautan</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.insertPageBreak} title="Pemisah halaman"><FileText className="h-4 w-4" /> Pemisah Halaman</TBtn>
            <TBtn onClick={actions.insertPageField} title="Nomor halaman otomatis"><Hash className="h-4 w-4" /> No. Halaman</TBtn>
            <TBtn onClick={actions.pageNumberDialog} title="Pengaturan nomor halaman"><Settings2 className="h-4 w-4" /> Atur No.</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={() => actions.editZone("header")} active={flags.zone === "header" || flags.zone === "headerFirst"} title="Edit kop atas"><PanelTop className="h-4 w-4" /> Kop Atas</TBtn>
            <TBtn onClick={() => actions.editZone("footer")} active={flags.zone === "footer" || flags.zone === "footerFirst"} title="Edit kaki bawah"><PanelBottom className="h-4 w-4" /> Kaki Bawah</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.insertDate} title="Sisipkan tanggal hari ini"><CalendarDays className="h-4 w-4" /> Tanggal</TBtn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ed-tool-btn" onMouseDown={(e) => e.preventDefault()}>
                  <Shapes className="h-4 w-4" /> Simbol
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="grid grid-cols-8 w-64">
                {["°", "±", "×", "÷", "≠", "≤", "≥", "≈", "•", "–", "—", "…", "§", "¶", "‰", "√", "∑", "∞", "←", "→", "↔", "★", "✓", "(", ")"].map((ch) => (
                  <DropdownMenuItem key={ch} onMouseDown={(e) => e.preventDefault()} onClick={() => actions.insertSymbol(ch)} className="justify-center text-base">
                    {ch}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {tab === "layout" && (
          <>
            <span className="text-[11px] text-slate-500 mr-1 font-medium">Ukuran:</span>
            <div className="w-52">
              <Select onValueChange={(v) => actions.paperSize(v as PaperSizeKey)}>
                <SelectTrigger className="h-7 text-xs bg-white">
                  <SelectValue placeholder={PAPER_SIZES[flags.paperKey as keyof typeof PAPER_SIZES]?.label ?? "Pilih kertas"} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAPER_SIZES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))
                  }
                  <SelectItem value="custom">Kustom (atur manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TBtn onClick={() => actions.orientation("portrait")} active={flags.orientation === "portrait"} title="Tegak (Portrait)"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="7" y="3" width="10" height="18" rx="1"/></svg> Tegak</TBtn>
            <TBtn onClick={() => actions.orientation("landscape")} active={flags.orientation === "landscape"} title="Mendatar (Landscape)"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="10" rx="1"/></svg> Mendatar</TBtn>
            <span className="ed-tool-sep" />
            <span className="text-[11px] text-slate-500 mr-1 font-medium">Margin:</span>
            <div className="w-40">
              <Select onValueChange={(v) => actions.marginPreset(v)}>
                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder="Preset margin" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MARGIN_PRESETS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TBtn onClick={actions.pageSetupDialog} title="Pengaturan halaman rinci"><Type className="h-4 w-4" /> Atur Halaman…</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.insertPageBreak} title="Sisipkan pemisah halaman"><FileText className="h-4 w-4" /> Pemisah</TBtn>
          </>
        )}

        {tab === "references" && (
          <>
            <TBtn onClick={actions.insertToc} title="Sisipkan daftar isi otomatis dari judul"><ListTree className="h-4 w-4" /> Daftar Isi</TBtn>
            <TBtn onClick={actions.updateToc} title="Perbarui daftar isi & nomor halaman"><RefreshIcon /> Perbarui Daftar Isi</TBtn>
            <TBtn onClick={() => actions.style("h1")} title="Tandai paragraf sebagai Judul 1"><Type className="h-4 w-4" /> Tandai Judul 1</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.pageNumberDialog} title="Pengaturan nomor halaman"><Hash className="h-4 w-4" /> Nomor Halaman</TBtn>
          </>
        )}

        {tab === "review" && (
          <>
            <TBtn onClick={actions.reviewDialog} title="Pemeriksaan dokumen (kata, huruf, bahasa)"><Sigma className="h-4 w-4" /> Pemeriksaan</TBtn>
            <TBtn onClick={() => actions.spellcheck(!flags.spellcheck)} active={flags.spellcheck} title="Pemeriksa ejaan bawaan peramban"><SpellCheck className="h-4 w-4" /> Ejaan</TBtn>
            <div className="w-36">
              <Select onValueChange={(v) => actions.lang(v)}>
                <SelectTrigger className="h-7 text-xs bg-white"><SelectValue placeholder="Bahasa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="id-ID">Indonesia</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.versions} title="Riwayat versi dokumen"><History className="h-4 w-4" /> Riwayat Versi</TBtn>
            <TBtn onClick={() => actions.findOpen(true)} title="Cari & ganti"><Replace className="h-4 w-4" /> Cari & Ganti</TBtn>
          </>
        )}

        {tab === "view" && (
          <>
            <TBtn onClick={actions.zoomOut} title="Perkecil"><ZoomOut className="h-4 w-4" /></TBtn>
            <span className="text-xs w-11 text-center font-medium">{Math.round(flags.zoom * 100)}%</span>
            <TBtn onClick={actions.zoomIn} title="Perbesar"><ZoomIn className="h-4 w-4" /></TBtn>
            <TBtn onClick={actions.zoomFitW} title="Sesuai lebar"><ArrowRightToLine className="h-4 w-4" /> Lebar</TBtn>
            <TBtn onClick={actions.zoomFitP} title="Sesuai halaman"><Eye className="h-4 w-4" /> Halaman</TBtn>
            <span className="ed-tool-sep" />
            <TBtn onClick={actions.toggleRuler} active={flags.ruler} title="Tampilkan/sembunyikan penggaris"><RulerIcon className="h-4 w-4" /> Penggaris</TBtn>
            <TBtn onClick={actions.toggleOutline} active={flags.outline} title="Panel navigasi dokumen"><PanelLeft className="h-4 w-4" /> Navigasi</TBtn>
            <TBtn onClick={actions.togglePreview} active={flags.preview} title="Pratinjau cetak (tampilan per halaman)"><Eye className="h-4 w-4" /> Pratinjau Cetak</TBtn>
            <TBtn onClick={actions.fullscreen} title="Layar penuh"><Maximize className="h-4 w-4" /> Layar Penuh</TBtn>
          </>
        )}
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
    </svg>
  );
}

