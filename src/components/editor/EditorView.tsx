"use client";

// ============================================================
// Editor Dokumen — manajer daftar dokumen + integrasi dokumen SPJ
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FilePlus2, FileText, Loader2, PencilLine, Trash2, RefreshCw, FolderOpen, Sparkles,
} from "lucide-react";
import type { Kegiatan, Pejabat, Pengaturan, DocKey } from "@/lib/espj-types";
import { DOC_LIST } from "@/lib/espj-types";
import { docSourceKey, DocListItem, defaultSettings } from "@/lib/editor/types";
import { ensureSpjDoc } from "@/components/espj/seed-doc";
import DocumentEditor from "./DocumentEditor";

type Props = {
  kegiatan: Kegiatan[];
  pengaturan: Pengaturan | null;
  pejabat: Pejabat[];
  initialSeed?: { kegiatanId: string; docKey: DocKey } | null;
  onSeedConsumed?: () => void;
};

export default function EditorView({ kegiatan, pengaturan, pejabat, initialSeed, onSeedConsumed }: Props) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const r = await fetch("/api/documents", { cache: "no-store" });
      if (r.ok) setDocs(await r.json());
    } catch {
      console.error("gagal memuat daftar dokumen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // buka dokumen dari luar (event lintas komponen)
  useEffect(() => {
    const h = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (id) setActiveId(id);
    };
    window.addEventListener("ed-open-doc", h);
    return () => window.removeEventListener("ed-open-doc", h);
  }, []);

  const pjMap = useRef<Record<string, Pejabat>>({});
  useEffect(() => {
    const m: Record<string, Pejabat> = {};
    for (const p of pejabat) m[p.kode] = p;
    pjMap.current = m;
  }, [pejabat]);

  const openOrCreateSpjDoc = useCallback(
    async (kegiatanId: string, docKey: DocKey) => {
      if (!pengaturan) {
        toast({ title: "Data kegiatan belum siap", variant: "destructive" });
        return;
      }
      const source = docSourceKey(kegiatanId, docKey);
      const meta = DOC_LIST.find((x) => x.key === docKey)!;
      setSeeding(source);
      try {
        const res = await ensureSpjDoc({
          kegiatanId,
          docKey,
          kegiatanList: kegiatan,
          pengaturan,
          pjMap: pjMap.current,
          known: docs,
        });
        if (!res) throw new Error();
        if (res.created) {
          const now = new Date().toISOString();
          setDocs((prev) => [
            {
              id: res.id,
              title: `${meta.nama}`,
              source,
              kegiatanId,
              docKey,
              settings: "{}",
              createdAt: now,
              updatedAt: now,
              versions: 0,
            },
            ...prev.filter((x) => x.id !== res.id),
          ]);
          toast({ title: "Dokumen siap disunting", description: meta.nama });
        }
        setActiveId(res.id);
      } catch {
        toast({ title: "Gagal menyiapkan dokumen", variant: "destructive" });
      } finally {
        setSeeding(null);
      }
    },

    [docs, kegiatan, pengaturan, toast]
  );

  // seed dari DokumenView (klik "Buka di Editor")
  useEffect(() => {
    if (!initialSeed || loading || seeding) return;
    onSeedConsumed?.();
    openOrCreateSpjDoc(initialSeed.kegiatanId, initialSeed.docKey);
     
  }, [initialSeed, loading]);

  const createBlank = async () => {
    try {
      const r = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Dokumen Baru",
          content: "<p><br></p>",
          settings: JSON.stringify(defaultSettings()),
        }),
      });
      if (!r.ok) throw new Error();
      const doc = await r.json();
      setDocs((prev) => [doc, ...prev]);
      setActiveId(doc.id);
    } catch {
      toast({ title: "Gagal membuat dokumen", variant: "destructive" });
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Hapus dokumen ini beserta seluruh riwayat versinya?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((x) => x.id !== id));
      toast({ title: "Dokumen dihapus" });
    } catch {
      toast({ title: "Gagal menghapus dokumen", variant: "destructive" });
    }
  };

  if (activeId) {
    return (
      <DocumentEditor
        key={activeId}
        docId={activeId}
        onClosed={() => {
          setActiveId(null);
          loadDocs();
        }}
        onDocChanged={loadDocs}
      />
    );
  }

  const spjDocs = docs.filter((d) => d.source.startsWith("gen:"));
  const customDocs = docs.filter((d) => !d.source.startsWith("gen:"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h2 className="text-lg font-bold">Editor Dokumen</h2>
          <p className="text-xs text-muted-foreground">
            Sunting dokumen bebas ala pengolah kata — format, tabel, gambar, kop/kaki, nomor halaman, tersimpan otomatis.
          </p>
        </div>
        <Button variant="outline" onClick={loadDocs}>
          <RefreshCw className="h-4 w-4 mr-2" /> Muat ulang
        </Button>
        <Button onClick={createBlank}>
          <FilePlus2 className="h-4 w-4 mr-2" /> Dokumen Baru
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat dokumen…
        </div>
      ) : (
        <>
          {/* Dokumen SPJ dari generator */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="flex items-center gap-2 font-semibold text-sm mb-1">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Dokumen SPJ Otomatis (F4)
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Pilih kegiatan lalu buka dokumennya di editor. Isi awal diambil dari Data Pelatihan; setelah itu bebas disunting.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {kegiatan.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-full">Belum ada kegiatan. Tambahkan melalui menu Data Pelatihan.</p>
              )}
              {kegiatan.map((k) => (
                <div key={k.id} className="border rounded-lg p-3">
                  <p className="text-xs font-semibold truncate mb-2" title={k.namaKegiatan}>
                    {k.no}. {k.namaKegiatan}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {DOC_LIST.map((d) => {
                      const src = docSourceKey(k.id, d.key);
                      const made = docs.some((x) => x.source === src);
                      return (
                        <button
                          key={d.key}
                          onClick={() => openOrCreateSpjDoc(k.id, d.key)}
                          disabled={seeding === src}
                          className={`text-[11px] px-2 py-1.5 rounded border flex items-center gap-1 transition-colors ${
                            made
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          title={d.nama}
                        >
                          {seeding === src ? <Loader2 className="h-3 w-3 animate-spin" /> : <PencilLine className="h-3 w-3" />}
                          <span className="truncate">{d.nama}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dokumen tersimpan */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
              <FolderOpen className="h-4 w-4 text-emerald-600" /> Dokumen Tersimpan ({docs.length})
            </h3>
            {docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada dokumen tersimpan.</p>
            ) : (
              <div className="divide-y">
                {[...spjDocs, ...customDocs].map((d) => {
                  const gen = d.source.startsWith("gen:");
                  const k = gen ? kegiatan.find((x) => x.id === d.kegiatanId) : null;
                  const meta = d.docKey ? DOC_LIST.find((x) => x.key === d.docKey) : null;
                  return (
                    <div key={d.id} className="flex items-center gap-3 py-2.5">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {gen ? `SPJ${k ? " • " + k.namaKegiatan.slice(0, 40) : ""}${meta ? " • " + meta.nama : ""}` : "Dokumen bebas"}
                          {" • "}diubah {new Date(d.updatedAt).toLocaleString("id-ID")} • {d.versions} versi
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveId(d.id)}>
                        <PencilLine className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteDoc(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
