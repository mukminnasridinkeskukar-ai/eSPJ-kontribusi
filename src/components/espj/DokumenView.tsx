"use client";

// ============================================================
// Dokumen SPJ (F4) — EDITOR-FIRST
// Pilih kegiatan & dokumen -> langsung terbuka di Editor Dokumen
// (ala pengolah kata). Isi awal digenerate dari Data Pelatihan,
// setelah itu bebas disunting & tersimpan otomatis.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw, FolderOpen, Loader2, FileText, PencilLine, PenLine,
} from "lucide-react";
import type { Kegiatan, Pejabat, Pengaturan, DocKey } from "@/lib/espj-types";
import { DOC_LIST } from "@/lib/espj-types";
import DocumentEditor from "@/components/editor/DocumentEditor";
import { ensureSpjDoc, renderSpjDocHtml, spjEditorSettings } from "./seed-doc";

type Props = {
  kegiatan: Kegiatan[];
  pengaturan: Pengaturan | null;
  pejabat: Pejabat[];
  /** buka manajer seluruh dokumen (tab Editor Dokumen) */
  onKelola?: () => void;
};

export default function DokumenView({ kegiatan, pengaturan, pejabat, onKelola }: Props) {
  const { toast } = useToast();
  const [kegiatanId, setKegiatanId] = useState("");
  const [docKey, setDocKey] = useState<DocKey>("bap");
  const [known, setKnown] = useState<{ id: string; source: string }[]>([]);
  const [docId, setDocId] = useState<string | null>(null);
  const [manualClosed, setManualClosed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [nonce, setNonce] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  const effKegiatanId = kegiatanId || kegiatan[0]?.id || "";
  const k = kegiatan.find((x) => x.id === effKegiatanId);
  const meta = DOC_LIST.find((x) => x.key === docKey) ?? DOC_LIST[1];

  const pjMap = useMemo(() => {
    const m: Record<string, Pejabat> = {};
    for (const p of pejabat) m[p.kode] = p;
    return m;
  }, [pejabat]);

  const loadDocs = useCallback(async () => {
    try {
      const r = await fetch("/api/documents", { cache: "no-store" });
      if (r.ok) {
        const all = await r.json();
        setKnown(all.map((d: { id: string; source: string }) => ({ id: d.id, source: d.source })));
      }
    } catch { /* diabaikan, ensureSpjDoc cek ulang sendiri */ }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const openDoc = useCallback(
    async (kid: string, dk: DocKey) => {
      if (!kid || !pengaturan) return;
      setPreparing(true);
      try {
        const res = await ensureSpjDoc({
          kegiatanId: kid,
          docKey: dk,
          kegiatanList: kegiatan,
          pengaturan,
          pjMap,
          known,
          fallbackHost: hostRef.current,
        });
        if (res) {
          setDocId(res.id);
          setManualClosed(false);
          setNonce((n) => n + 1); // pastikan editor selalu memuat konten terbaru
          if (res.created) {
            const m = DOC_LIST.find((x) => x.key === dk);
            toast({ title: "Dokumen siap disunting", description: m?.nama });
          }
        }
      } catch {
        toast({ title: "Gagal menyiapkan dokumen", variant: "destructive" });
      } finally {
        setPreparing(false);
      }
    },
    [kegiatan, pengaturan, pjMap, known, toast]
  );

  // buka otomatis saat halaman dipilih / seleksi berubah
  useEffect(() => {
    if (manualClosed || docId || preparing) return;
    if (!effKegiatanId || !pengaturan) return;
    openDoc(effKegiatanId, docKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effKegiatanId, docKey, pengaturan, manualClosed]);

  /** ganti seleksi kegiatan/dokumen -> buka editor baru */
  const pilih = (kid: string, dk: DocKey) => {
    if (kid === effKegiatanId && dk === docKey && docId) return;
    setKegiatanId(kid);
    setDocKey(dk);
    setManualClosed(false);
    setDocId(null);
  };

  /** generate ulang isi dokumen dari Data Pelatihan */
  const perbaruiDariData = async () => {
    if (!docId || !k || !pengaturan) return;
    setRegenerating(true);
    try {
      const html = await renderSpjDocHtml(docKey, k, pengaturan, pjMap, hostRef.current);
      if (!html) throw new Error("render gagal");
      const r = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: html,
          settings: JSON.stringify(spjEditorSettings(docKey)),
        }),
      });
      if (!r.ok) throw new Error("simpan gagal");
      setNonce((n) => n + 1);
      toast({
        title: "Isi dokumen diperbarui",
        description: "Isi digenerate ulang dari Data Pelatihan. Suntingan manual sebelumnya digantikan.",
      });
    } catch {
      toast({ title: "Gagal memperbarui isi dokumen", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  // ---------- Strip pemilih dokumen (tampil di dalam editor) ----------
  const strip = (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 print-hide">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 shrink-0">
        Dokumen SPJ
      </span>
      <Select value={effKegiatanId} onValueChange={(v) => pilih(v, docKey)}>
        <SelectTrigger className="w-[250px] h-8 text-xs">
          <SelectValue placeholder="Pilih Kegiatan" />
        </SelectTrigger>
        <SelectContent>
          {kegiatan.map((x) => (
            <SelectItem key={x.id} value={x.id} className="text-xs">
              {x.no}. {x.namaKegiatan.length > 42 ? x.namaKegiatan.slice(0, 42) + "…" : x.namaKegiatan}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={docKey} onValueChange={(v) => pilih(effKegiatanId, v as DocKey)}>
        <SelectTrigger className="w-[230px] h-8 text-xs">
          <SelectValue placeholder="Pilih Dokumen" />
        </SelectTrigger>
        <SelectContent>
          {DOC_LIST.map((x) => (
            <SelectItem key={x.key} value={x.key} className="text-xs">
              {x.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs"
        disabled={regenerating || !docId || preparing}
        onClick={perbaruiDariData}
        title="Generate ulang isi dokumen dari data Data Pelatihan terkini"
      >
        {regenerating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
        Perbarui dari Data
      </Button>
      {onKelola && (
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onKelola}>
          <FolderOpen className="h-3.5 w-3.5 mr-1" /> Kelola semua dokumen
        </Button>
      )}
      <span className="ml-auto text-[11px] text-slate-400 hidden md:inline">
        {meta.orientasi === "landscape" ? "F4 mendatar 330 × 215 mm" : "F4 tegak 215 × 330 mm"} • tersimpan otomatis
      </span>
    </div>
  );

  // host render tersembunyi (fallback seed)
  const host = <div ref={hostRef} style={{ position: "absolute", left: -99999, top: 0, width: 700 }} aria-hidden />;

  // ---------- Editor terbuka ----------
  if (docId) {
    return (
      <>
        {host}
        <DocumentEditor
          key={`${docId}:${nonce}`}
          docId={docId}
          topStrip={strip}
          onClosed={() => {
            setDocId(null);
            setManualClosed(true);
            loadDocs();
          }}
        />
      </>
    );
  }

  // ---------- Menyiapkan dokumen ----------
  if (preparing || (!manualClosed && effKegiatanId && pengaturan)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        {host}
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
        <p className="text-sm font-medium">Menyiapkan dokumen di editor…</p>
        <p className="text-xs">{meta.nama} — format F4 {meta.orientasi === "landscape" ? "mendatar" : "tegak"}</p>
      </div>
    );
  }

  // ---------- Ditutup manual / belum ada data ----------
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {host}
      <div className="rounded-full bg-emerald-50 p-4">
        <PenLine className="h-8 w-8 text-emerald-700" />
      </div>
      {kegiatan.length === 0 ? (
        <>
          <p className="text-sm font-semibold">Belum ada kegiatan</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tambahkan data pelatihan terlebih dahulu melalui menu <b>Data Pelatihan</b>, lalu seluruh dokumen SPJ-nya
            dapat dibuka dan disunting di sini.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Editor ditutup</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Dokumen {meta.nama} siap dibuka kembali di editor — lengkap dengan kop, tabel, dan format F4.
          </p>
          <Button onClick={() => openDoc(effKegiatanId, docKey)} disabled={preparing}>
            {preparing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PencilLine className="h-4 w-4 mr-2" />}
            Buka kembali di editor
          </Button>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" /> Atau ganti kegiatan/dokumen dari strip pemilih di atas editor.
          </p>
        </>
      )}
    </div>
  );
}
