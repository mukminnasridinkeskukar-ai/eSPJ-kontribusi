"use client";

// eSPJ-Kontribusi — Dinas Kesehatan Kab. Kutai Kartanegara
// Platform pengelolaan SPJ Kontribusi Pelatihan: formulir Data Pelatihan ->
// dokumen resmi otomatis format F4 (Cover, BAP, BAST, BA Bayar, BA Bermaterai,
// Bukti Pengeluaran Bend.20, Disposisi, Daftar Pembayaran, Pernyataan PA).
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Settings2,
  RefreshCw,
  Printer,
  FileEdit,
} from "lucide-react";
import type { Kegiatan, Pejabat, Pengaturan, DocKey } from "@/lib/espj-types";
import { DashboardView, DataListView, PengaturanView } from "@/components/espj/views";
import DokumenView from "@/components/espj/DokumenView";
import EditorView from "@/components/editor/EditorView";

type View = "dashboard" | "data" | "dokumen" | "editor" | "pengaturan";

const NAV: { key: View; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "data", label: "Data Pelatihan", icon: ClipboardList },
  { key: "dokumen", label: "Dokumen SPJ (F4)", icon: FileText },
  { key: "editor", label: "Editor Dokumen", icon: FileEdit },
  { key: "pengaturan", label: "Pejabat & Pengaturan", icon: Settings2 },
];

export default function Home() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("dashboard");
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [pejabat, setPejabat] = useState<Pejabat[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kegiatan | null>(null);
  const [editorSeed, setEditorSeed] = useState<{ kegiatanId: string; docKey: DocKey } | null>(null);

  const muat = useCallback(async () => {
    try {
      const [rk, rp, rs] = await Promise.all([
        fetch("/api/kegiatan", { cache: "no-store" }),
        fetch("/api/pejabat", { cache: "no-store" }),
        fetch("/api/pengaturan", { cache: "no-store" }),
      ]);
      if (rk.ok) setKegiatan(await rk.json());
      if (rp.ok) setPejabat(await rp.json());
      if (rs.ok) setPengaturan(await rs.json());
    } catch (e) {
      console.error(e);
      toast({ title: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    muat();
  }, [muat]);

  const onSaved = (k: Kegiatan) => {
    setKegiatan((prev) => {
      const ada = prev.some((x) => x.id === k.id);
      const next = ada ? prev.map((x) => (x.id === k.id ? k : x)) : [...prev, k];
      return next.sort((a, b) => a.no - b.no);
    });
  };

  return (
    <div className="app-shell min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40 print-hide">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="rounded-lg bg-white p-1.5 shadow">
            <Image src="/logo-kukar.png" alt="Logo Kukar" width={34} height={39} priority />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
              eSPJ-Kontribusi
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-200 truncate">
              Dinas Kesehatan Kabupaten Kutai Kartanegara — SPJ Kontribusi Pelatihan
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-emerald-700 hidden sm:inline-flex"
              onClick={muat}
              title="Muat ulang"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="hidden md:inline text-[11px] bg-emerald-700 rounded-full px-3 py-1">
              Kertas F4 • 215 × 330 mm
            </span>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-2 flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                view === n.key
                  ? "bg-slate-100 text-emerald-900"
                  : "text-emerald-100 hover:bg-emerald-700"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Konten */}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <RefreshCw className="h-5 w-5 animate-spin" /> Memuat data…
          </div>
        ) : view === "dashboard" ? (
          <DashboardView
            kegiatan={kegiatan}
            onBukaDokumen={() => setView("dokumen")}
            onEdit={(k) => {
              setEditing(k);
              setFormOpen(true);
            }}
          />
        ) : view === "data" ? (
          <DataListView
            kegiatan={kegiatan}
            onTambah={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            onEdit={(k) => {
              setEditing(k);
              setFormOpen(true);
            }}
            onDeleted={(id) => setKegiatan((p) => p.filter((x) => x.id !== id))}
          />
        ) : view === "dokumen" ? (
          <DokumenView
            kegiatan={kegiatan}
            pengaturan={pengaturan}
            pejabat={pejabat}
            onBukaEditor={(kegiatanId, docKey) => {
              setEditorSeed({ kegiatanId, docKey });
              setView("editor");
            }}
          />
        ) : view === "editor" ? (
          <EditorView
            kegiatan={kegiatan}
            pengaturan={pengaturan}
            pejabat={pejabat}
            initialSeed={editorSeed}
            onSeedConsumed={() => setEditorSeed(null)}
          />
        ) : (
          <PengaturanView
            pengaturan={pengaturan}
            pejabat={pejabat}
            onReload={muat}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto print-hide border-t bg-white">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            eSPJ-Kontribusi — Dinas Kesehatan Kab. Kutai Kartanegara • DAK Non Fisik TA 2026
          </span>
          <span className="flex items-center gap-1">
            <Printer className="h-3.5 w-3.5" /> Semua dokumen dicetak pada kertas F4 (215 × 330 mm)
          </span>
        </div>
      </footer>

      <KegiatanFormLazy
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSaved={onSaved}
      />
    </div>
  );
}

// Impor lazily agar dialog besar tidak membebani render awal
import KegiatanForm from "@/components/espj/KegiatanForm";
function KegiatanFormLazy(props: React.ComponentProps<typeof KegiatanForm>) {
  return <KegiatanForm {...props} />;
}
