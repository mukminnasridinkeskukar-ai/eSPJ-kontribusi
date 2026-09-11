"use client";

// ============================================================
// Editor Dokumen — seluruh dialog
// ============================================================
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { History, RotateCcw, Trash2 } from "lucide-react";
import type { DocSettings, VersionItem } from "@/lib/editor/types";
import { PAPER_SIZES, MARGIN_PRESETS } from "@/lib/editor/types";
import type { TabStop } from "@/lib/editor/commands";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

/* ---------------- Pengaturan Halaman ---------------- */

function SizeInputs({ w, h, onCommit }: { w: number; h: number; onCommit: (w: number, h: number) => void }) {
  const [ws, setWs] = useState(String(w));
  const [hs, setHs] = useState(String(h));
  return (
    <Row>
      <div className="flex-1 space-y-1.5">
        <Label>Lebar (mm)</Label>
        <Input
          value={ws} type="number" min={80} max={600}
          onChange={(e) => setWs(e.target.value)}
          onBlur={() => onCommit(parseFloat(ws) || w, parseFloat(hs) || h)}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label>Tinggi (mm)</Label>
        <Input
          value={hs} type="number" min={80} max={800}
          onChange={(e) => setHs(e.target.value)}
          onBlur={() => onCommit(parseFloat(ws) || w, parseFloat(hs) || h)}
        />
      </div>
    </Row>
  );
}

export function PageSetupDialog({
  open, onClose, settings, onChange,
}: {
  open: boolean; onClose: () => void; settings: DocSettings;
  onChange: (s: Partial<DocSettings>) => void;
}) {

  const setMargin = (k: keyof typeof settings.margins, v: string) => {
    const num = parseFloat(v);
    if (isNaN(num) || num < 0) return;
    onChange({ margins: { ...settings.margins, [k]: num }, paper: "custom" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Pengaturan Halaman</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <Label>Ukuran kertas</Label>
            <Select
              value={settings.paper}
              onValueChange={(k) => {
                if (k === "custom") { onChange({ paper: "custom" }); return; }
                const p = PAPER_SIZES[k as keyof typeof PAPER_SIZES];
                onChange({ paper: k as DocSettings["paper"], paperW: p.w, paperH: p.h });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_SIZES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
                <SelectItem value="custom">Kustom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SizeInputs
            key={`${settings.paper}-${settings.paperW}x${settings.paperH}`}
            w={settings.paperW} h={settings.paperH}
            onCommit={(nw, nh) => onChange({ paperW: nw, paperH: nh, paper: "custom" })}
          />
          <div className="space-y-1.5">
            <Label>Orientasi</Label>
            <Row>
              <Button variant={settings.orientation === "portrait" ? "default" : "outline"} size="sm" onClick={() => onChange({ orientation: "portrait" })}>Tegak</Button>
              <Button variant={settings.orientation === "landscape" ? "default" : "outline"} size="sm" onClick={() => onChange({ orientation: "landscape" })}>Mendatar</Button>
            </Row>
          </div>
          <div className="space-y-1.5">
            <Label>Margin (mm)</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["top", "right", "bottom", "left"] as const).map((k) => (
                <div key={k} className="space-y-1">
                  <span className="text-[10px] text-slate-500 capitalize">{k === "top" ? "Atas" : k === "bottom" ? "Bawah" : k === "left" ? "Kiri" : "Kanan"}</span>
                  <Input type="number" min={0} max={120} value={settings.margins[k]} onChange={(e) => setMargin(k, e.target.value)} className="h-8" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(MARGIN_PRESETS).map(([k, v]) => (
                <Button
                  key={k} size="sm" variant="outline"
                  onClick={() => onChange({ margins: { top: v.top, right: v.right, bottom: v.bottom, left: v.left }, paper: k === "f4dinkes" ? settings.paper : "custom" })}
                >
                  {v.label}
                </Button>
              ))}
            </div>
          </div>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Jarak kop dari atas (mm)</Label>
              <Input type="number" min={0} max={100} value={settings.headerDist} onChange={(e) => onChange({ headerDist: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Jarak kaki dari bawah (mm)</Label>
              <Input type="number" min={0} max={100} value={settings.footerDist} onChange={(e) => onChange({ footerDist: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
          </Row>
          <Row>
            <Switch checked={settings.differentFirstPage} onCheckedChange={(v) => onChange({ differentFirstPage: v })} id="dfp" />
            <Label htmlFor="dfp">Halaman pertama berbeda (kop/kaki khusus)</Label>
          </Row>
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onClose}>Selesai</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Properti Paragraf ---------------- */

export type ParagraphProps = {
  align: "left" | "center" | "right" | "justify";
  lineSpacing: string; // "1" | "1.15" | "1.5" | "2" | custom numeric
  beforePt: number; afterPt: number;
  leftMm: number; rightMm: number; firstMm: number; hangMm: number;
};

export function ParagraphDialog({
  open, onClose, initial, onApply,
}: {
  open: boolean; onClose: () => void;
  initial: ParagraphProps | null;
  onApply: (p: Partial<ParagraphProps>) => void;
}) {
  const [p, setP] = useState<ParagraphProps>(
    initial ?? { align: "left", lineSpacing: "1.15", beforePt: 0, afterPt: 6, leftMm: 0, rightMm: 0, firstMm: 0, hangMm: 0 }
  );
  const key = open ? (initial ? JSON.stringify(initial) : "init") : "closed";
  if (!open) return null;
  void key;
  const upd = (patch: Partial<ParagraphProps>) => setP((o) => ({ ...o, ...patch }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Paragraf</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Perataan</Label>
              <Select value={p.align} onValueChange={(v) => upd({ align: v as ParagraphProps["align"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Kiri</SelectItem>
                  <SelectItem value="center">Tengah</SelectItem>
                  <SelectItem value="right">Kanan</SelectItem>
                  <SelectItem value="justify">Rata kanan-kiri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Spasi baris</Label>
              <Select value={p.lineSpacing} onValueChange={(v) => upd({ lineSpacing: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1,0</SelectItem>
                  <SelectItem value="1.15">1,15</SelectItem>
                  <SelectItem value="1.5">1,5</SelectItem>
                  <SelectItem value="2">2,0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Jarak sebelum (pt)</Label>
              <Input type="number" min={0} value={p.beforePt} onChange={(e) => upd({ beforePt: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Jarak sesudah (pt)</Label>
              <Input type="number" min={0} value={p.afterPt} onChange={(e) => upd({ afterPt: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Inden kiri (mm)</Label>
              <Input type="number" min={0} value={p.leftMm} onChange={(e) => upd({ leftMm: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Inden kanan (mm)</Label>
              <Input type="number" min={0} value={p.rightMm} onChange={(e) => upd({ rightMm: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Baris pertama (mm)</Label>
              <Input type="number" value={p.firstMm} onChange={(e) => upd({ firstMm: parseFloat(e.target.value) || 0, hangMm: 0 })} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Gantung (mm)</Label>
              <Input type="number" min={0} value={p.hangMm} onChange={(e) => upd({ hangMm: parseFloat(e.target.value) || 0, firstMm: 0 })} className="h-8" />
            </div>
          </Row>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => { onApply(p); onClose(); }}>Terapkan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Sisipkan Tabel ---------------- */

export function InsertTableDialog({
  open, onClose, onInsert,
}: {
  open: boolean; onClose: () => void;
  onInsert: (rows: number, cols: number, header: boolean) => void;
}) {
  const [hover, setHover] = useState({ r: 3, c: 3 });
  const [header, setHeader] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Sisipkan Tabel</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-center">
            <div className="inline-grid grid-cols-8 gap-0.5 p-1 border rounded bg-slate-50">
              {Array.from({ length: 8 }).map((_, r) =>
                Array.from({ length: 8 }).map((_, c) => (
                  <button
                    key={`${r}-${c}`}
                    className={`w-6 h-6 rounded-sm border ${r < hover.r && c < hover.c ? "bg-emerald-500 border-emerald-600" : "bg-white border-slate-300"}`}
                    onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
                    onClick={() => { onInsert(r + 1, c + 1, header); onClose(); }}
                  />
                ))
              )}
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">{hover.r} baris × {hover.c} kolom</p>
          <div className="flex items-center justify-center gap-2">
            <Switch checked={header} onCheckedChange={setHeader} id="hdr" />
            <Label htmlFor="hdr">Baris pertama sebagai kepala tabel</Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Properti Tabel ---------------- */

export function TablePropsDialog({
  open, onClose, initial, onApply,
}: {
  open: boolean; onClose: () => void;
  initial: {
    widthMm: number; align: "left" | "center" | "right";
    borderColor: string; borderWidthMm: number; noBorder: boolean;
    paddingMm: number; headerRow: boolean; repeatHeader: boolean;
  } | null;
  onApply: (v: {
    widthMm: number; align: "left" | "center" | "right";
    borderColor: string; borderWidthMm: number; noBorder: boolean;
    paddingMm: number; headerRow: boolean; repeatHeader: boolean;
  }) => void;
}) {
  const [v, setV] = useState(initial);
  if (!open || !v) return null;
  const upd = (patch: Partial<typeof v>) => setV((o) => (o ? { ...o, ...patch } : o));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Properti Tabel</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Lebar (mm)</Label>
              <Input type="number" min={20} value={v.widthMm} onChange={(e) => upd({ widthMm: parseFloat(e.target.value) || v.widthMm })} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Perataan tabel</Label>
              <Select value={v.align} onValueChange={(a) => upd({ align: a as "left" | "center" | "right" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Kiri</SelectItem>
                  <SelectItem value="center">Tengah</SelectItem>
                  <SelectItem value="right">Kanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Warna garis</Label>
              <input type="color" value={v.borderColor} onChange={(e) => upd({ borderColor: e.target.value })} className="h-8 w-full cursor-pointer rounded" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Tebal garis (mm)</Label>
              <Input type="number" step="0.1" min={0.1} value={v.borderWidthMm} onChange={(e) => upd({ borderWidthMm: parseFloat(e.target.value) || 0.3 })} className="h-8" />
            </div>
          </Row>
          <Row>
            <Switch checked={v.noBorder} onCheckedChange={(c) => upd({ noBorder: c })} id="nb" />
            <Label htmlFor="nb">Tanpa garis</Label>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Jarak isi sel (mm)</Label>
              <Input type="number" step="0.5" min={0} value={v.paddingMm} onChange={(e) => upd({ paddingMm: parseFloat(e.target.value) || 0 })} className="h-8" />
            </div>
          </Row>
          <div className="space-y-2">
            <Row>
              <Switch checked={v.headerRow} onCheckedChange={(c) => upd({ headerRow: c })} id="hr" />
              <Label htmlFor="hr">Baris pertama = kepala tabel</Label>
            </Row>
            <Row>
              <Switch checked={v.repeatHeader} onCheckedChange={(c) => upd({ repeatHeader: c })} id="rh" />
              <Label htmlFor="rh">Ulangi kepala tabel di setiap halaman</Label>
            </Row>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => { onApply(v); onClose(); }}>Terapkan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Properti Gambar ---------------- */

export function ImageDialog({
  open, onClose, initial, onApply,
}: {
  open: boolean; onClose: () => void;
  initial: { w: number; h: number; natW: number; natH: number; alt: string } | null;
  onApply: (v: { w: number; h: number; alt: string }) => void;
}) {
  const [v, setV] = useState(initial);
  const [lock, setLock] = useState(true);
  if (!open || !v) return null;
  const ratio = v.natW && v.natH ? v.natW / v.natH : 1;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Properti Gambar</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Lebar (px)</Label>
              <Input type="number" min={20} value={v.w} onChange={(e) => {
                const w = parseInt(e.target.value, 10) || v.w;
                setV((o) => (o ? { ...o, w, h: lock ? Math.round(w / ratio) : o.h } : o));
              }} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Tinggi (px)</Label>
              <Input type="number" min={20} value={v.h} onChange={(e) => {
                const h = parseInt(e.target.value, 10) || v.h;
                setV((o) => (o ? { ...o, h, w: lock ? Math.round(h * ratio) : o.w } : o));
              }} className="h-8" />
            </div>
          </Row>
          <Row>
            <Switch checked={lock} onCheckedChange={setLock} id="lock" />
            <Label htmlFor="lock">Kunci rasio aspek</Label>
          </Row>
          <div className="space-y-1.5">
            <Label>Teks alternatif (alt)</Label>
            <Input value={v.alt} onChange={(e) => setV((o) => (o ? { ...o, alt: e.target.value } : o))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={() => { onApply(v); onClose(); }}>Terapkan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Tautan ---------------- */

export function LinkDialog({
  open, onClose, initialText, onApply, onRemove,
}: {
  open: boolean; onClose: () => void;
  initialText: string;
  onApply: (url: string, text: string) => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState(initialText);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Sisipkan Tautan</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <Label>Alamat (URL / surel)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… atau mailto:nama@contoh.id" />
          </div>
          <div className="space-y-1.5">
            <Label>Teks tampilan</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Kosongkan bila teks sudah terseleksi" />
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="destructive" size="sm" onClick={() => { onRemove(); onClose(); }}>Hapus tautan</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Batal</Button>
              <Button onClick={() => { onApply(url, text); onClose(); }}>Terapkan</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Tab Stop ---------------- */

export function TabStopsDialog({
  open, onClose, stops, posMm, onAdd, onRemove, onClear,
}: {
  open: boolean; onClose: () => void;
  stops: TabStop[]; posMm: number;
  onAdd: (pos: number, type: TabStop["type"]) => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
}) {
  const [pos, setPos] = useState(String(posMm > 0 ? posMm.toFixed(1) : "12.7"));
  const [type, setType] = useState<TabStop["type"]>("left");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Tab Stop Paragraf</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Posisi (mm)</Label>
              <Input value={pos} onChange={(e) => setPos(e.target.value)} type="number" min={1} className="h-8" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Jenis</Label>
              <Select value={type} onValueChange={(t) => setType(t as TabStop["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Rata kiri</SelectItem>
                  <SelectItem value="center">Rata tengah</SelectItem>
                  <SelectItem value="right">Rata kanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="mt-5" onClick={() => { onAdd(parseFloat(pos) || 12.7, type); }}>Tambah</Button>
          </Row>
          <div className="border rounded divide-y max-h-40 overflow-y-auto">
            {stops.length === 0 && <p className="text-xs text-slate-400 p-3">Belum ada tab stop. Klik dua kali pada penggaris untuk menambah cepat.</p>}
            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="flex-1">{s.pos.toFixed(1)} mm</span>
                <span className="text-slate-500 capitalize">{s.type}</span>
                <button className="text-red-500 hover:text-red-700" onClick={() => onRemove(i)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={onClear} disabled={!stops.length}>Hapus semua</Button>
            <Button size="sm" onClick={onClose}>Selesai</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Riwayat Versi ---------------- */

export function VersionsDialog({
  open, onClose, versions, onCreate, onRestore, busy,
}: {
  open: boolean; onClose: () => void;
  versions: VersionItem[]; onCreate: (label: string) => void; onRestore: (id: string) => void; busy: boolean;
}) {
  const [label, setLabel] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Riwayat Versi</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Row>
            <Input
              value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Keterangan versi (mis. Revisi nomor surat)"
              onKeyDown={(e) => { if (e.key === "Enter" && !busy) { onCreate(label); setLabel(""); } }}
            />
            <Button onClick={() => { onCreate(label); setLabel(""); }} disabled={busy}>Simpan versi</Button>
          </Row>
          <p className="text-[11px] text-slate-500">Versi lama tidak pernah dihapus otomatis. Pemulihan juga menyimpan keadaan sekarang sebagai versi &quot;Sebelum pemulihan&quot;.</p>
          <div className="border rounded divide-y max-h-80 overflow-y-auto">
            {versions.length === 0 && <p className="text-xs text-slate-400 p-3">Belum ada versi tersimpan.</p>}
            {versions.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(v.createdAt).toLocaleString("id-ID")} • {v.author}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onRestore(v.id)} disabled={busy}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Pulihkan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Pemeriksaan Dokumen ---------------- */

export function ReviewDialog({
  open, onClose, stats, spellcheck, onSpellcheck, lang, onLang,
}: {
  open: boolean; onClose: () => void;
  stats: { words: number; chars: number; charsNoSpace: number; paragraphs: number; tables: number; images: number; headings: number };
  spellcheck: boolean; onSpellcheck: (v: boolean) => void;
  lang: string; onLang: (v: string) => void;
}) {
  const items: [string, string | number][] = [
    ["Kata", stats.words.toLocaleString("id-ID")],
    ["Karakter (dengan spasi)", stats.chars.toLocaleString("id-ID")],
    ["Karakter (tanpa spasi)", stats.charsNoSpace.toLocaleString("id-ID")],
    ["Paragraf", stats.paragraphs],
    ["Judul (Heading)", stats.headings],
    ["Tabel", stats.tables],
    ["Gambar", stats.images],
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Pemeriksaan Dokumen</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="border rounded divide-y">
            {items.map(([k, v]) => (
              <div key={k} className="flex justify-between px-3 py-1.5">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <Row>
            <Switch checked={spellcheck} onCheckedChange={onSpellcheck} id="sp" />
            <Label htmlFor="sp">Pemeriksa ejaan aktif</Label>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Bahasa dokumen</Label>
              <Select value={lang} onValueChange={onLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="id-ID">Indonesia (id-ID)</SelectItem>
                  <SelectItem value="en-US">English (en-US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Row>
          <div className="flex justify-end">
            <Button onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Pengaturan Nomor Halaman ---------------- */

export function PageNumberDialog({
  open, onClose, settings, onChange, onInsertField,
}: {
  open: boolean; onClose: () => void;
  settings: DocSettings; onChange: (s: Partial<DocSettings>) => void;
  onInsertField: () => void;
}) {
  const pn = settings.pageNumber;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Nomor Halaman</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <Row>
            <Switch checked={pn.enabled} onCheckedChange={(v) => onChange({ pageNumber: { ...pn, enabled: v } })} id="pn1" />
            <Label htmlFor="pn1">Tampilkan nomor halaman di kaki bawah</Label>
          </Row>
          <Row>
            <div className="flex-1 space-y-1.5">
              <Label>Posisi</Label>
              <Select value={pn.position} onValueChange={(v) => onChange({ pageNumber: { ...pn, position: v as typeof pn.position } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Kiri</SelectItem>
                  <SelectItem value="center">Tengah</SelectItem>
                  <SelectItem value="right">Kanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Format</Label>
              <Select value={pn.format} onValueChange={(v) => onChange({ pageNumber: { ...pn, format: v as typeof pn.format } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="n">1, 2, 3, …</SelectItem>
                  <SelectItem value="hal-n">Halaman 1</SelectItem>
                  <SelectItem value="n-dari-y">1 dari 5</SelectItem>
                  <SelectItem value="n/y">1 / 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Row>
          <div className="space-y-1.5">
            <Label>Mulai nomor dari</Label>
            <Input type="number" min={0} value={pn.start} onChange={(e) => onChange({ pageNumber: { ...pn, start: parseInt(e.target.value, 10) || 1 } })} className="h-8 w-28" />
          </div>
          <p className="text-[11px] text-slate-500">
            Nomor otomatis mengikuti jumlah halaman saat dicetak / PDF. Tombol di bawah menyisipkan field nomor halaman pada posisi kursor (mis. di dalam kop/kaki).
          </p>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={onInsertField}>Sisipkan field di kursor</Button>
            <Button onClick={onClose}>Selesai</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
