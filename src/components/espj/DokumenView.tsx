"use client";

// Pratinjau & cetak dokumen SPJ dalam format F4 (215mm x 330mm)
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText, ZoomIn, ZoomOut, PencilLine } from "lucide-react";
import type { Kegiatan, Pejabat, Pengaturan, DocKey } from "@/lib/espj-types";
import { DOC_LIST } from "@/lib/espj-types";
import { buildDocData } from "./doc-data";
import DocCover from "./documents/DocCover";
import DocBAP from "./documents/DocBAP";
import DocBAST from "./documents/DocBAST";
import DocBABayar from "./documents/DocBABayar";
import DocBAMaterai from "./documents/DocBAMaterai";
import DocBuktiPengeluaran from "./documents/DocBuktiPengeluaran";
import DocDisposisi from "./documents/DocDisposisi";
import DocDaftarPembayaran from "./documents/DocDaftarPembayaran";
import DocPernyataanPA from "./documents/DocPernyataanPA";

type Props = {
  kegiatan: Kegiatan[];
  pengaturan: Pengaturan | null;
  pejabat: Pejabat[];
  onBukaEditor?: (kegiatanId: string, docKey: DocKey) => void;
};

export default function DokumenView({ kegiatan, pengaturan, pejabat, onBukaEditor }: Props) {
  const { toast } = useToast();
  const [kegiatanId, setKegiatanId] = useState<string>("");
  const [docKey, setDocKey] = useState<DocKey>("bap");
  const [zoom, setZoom] = useState(0.85);
  const [printing, setPrinting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const k = kegiatan.find((x) => x.id === kegiatanId) ?? kegiatan[0];
  const doc = DOC_LIST.find((x) => x.key === docKey) ?? DOC_LIST[1];

  const pjMap = useMemo(() => {
    const m: Record<string, Pejabat> = {};
    for (const p of pejabat) m[p.kode] = p;
    return m;
  }, [pejabat]);

  const d = useMemo(
    () => (k && pengaturan ? buildDocData(k, pengaturan, pjMap) : null),
    [k, pengaturan, pjMap]
  );

  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 250);
    return () => clearTimeout(t);
  }, [printing]);

  const renderDoc = () => {
    if (!d) return null;
    switch (docKey) {
      case "cover":
        return <DocCover d={d} />;
      case "bap":
        return <DocBAP d={d} />;
      case "bast":
        return <DocBAST d={d} />;
      case "baBayar":
        return <DocBABayar d={d} />;
      case "baMaterai":
        return <DocBAMaterai d={d} />;
      case "buktiPengeluaran":
        return <DocBuktiPengeluaran d={d} />;
      case "disposisi":
        return <DocDisposisi d={d} />;
      case "daftarPembayaran":
        return <DocDaftarPembayaran d={d} />;
      case "pernyataanPA":
        return <DocPernyataanPA d={d} />;
    }
  };

  const handlePrint = () => {
    if (!k) {
      toast({ title: "Belum ada kegiatan", description: "Tambahkan data pelatihan terlebih dahulu.", variant: "destructive" });
      return;
    }
    setPrinting(true);
  };

  // ---- Mode cetak: hanya lembar F4 yang dirender ----
  if (printing) {
    return (
      <div className={`print-root${doc.orientasi === "landscape" ? " landscape-page" : ""}`}>
        <div className={`f4-sheet${doc.orientasi === "landscape" ? " landscape" : ""}`}>
          {renderDoc()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2 pb-4">
        <Select value={kegiatanId || k?.id || ""} onValueChange={setKegiatanId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih Kegiatan" />
          </SelectTrigger>
          <SelectContent>
            {kegiatan.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.no}. {x.namaKegiatan.length > 46 ? x.namaKegiatan.slice(0, 46) + "…" : x.namaKegiatan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={docKey} onValueChange={(v) => setDocKey(v as DocKey)}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Pilih Dokumen" />
          </SelectTrigger>
          <SelectContent>
            {DOC_LIST.map((x) => (
              <SelectItem key={x.key} value={x.key}>
                {x.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handlePrint} disabled={!k}>
          <Printer className="h-4 w-4 mr-2" /> Cetak F4
        </Button>

        {k && onBukaEditor && (
          <Button
            variant="outline"
            onClick={() => onBukaEditor(k.id, docKey)}
            title="Buka dokumen ini di Editor Dokumen untuk penyuntingan bebas"
          >
            <PencilLine className="h-4 w-4 mr-2" /> Buka di Editor
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} title="Perkecil">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} title="Perbesar">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info dokumen */}
      <div className="no-print flex items-center gap-2 pb-3 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>
          <b>{doc.nama}</b> — {doc.deskripsi} Sumber: {doc.sumber}. Ukuran kertas:{" "}
          <b>F4 {doc.orientasi === "portrait" ? "215 × 330 mm (tegak)" : "330 × 215 mm (mendatar)"}</b>.
        </span>
      </div>

      {/* Panggung pratinjau */}
      <div
        ref={stageRef}
        className="f4-stage no-print flex-1 overflow-auto rounded-xl border p-6"
      >
        <div
          className="zoom-wrap mx-auto"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            width: doc.orientasi === "landscape" ? 330 * 3.7795 : 215 * 3.7795,
            height: doc.orientasi === "landscape" ? 215 * 3.7795 : 330 * 3.7795,
            maxWidth: "none",
          }}
        >
          <div className={`f4-sheet${doc.orientasi === "landscape" ? " landscape" : ""}`}>
            {renderDoc()}
          </div>
        </div>
      </div>
    </div>
  );
}
