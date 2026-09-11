"use client";

// ============================================================
// seed-doc — jembatan Data Pelatihan -> Editor Dokumen
// Render komponen dokumen SPJ menjadi HTML lalu pastikan ada
// record dokumen di penyimpanan (dibuat sekali, dipakai ulang).
// ============================================================
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
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
import { docSourceKey, defaultSettings } from "@/lib/editor/types";

function DocComponent({ docKey, d }: { docKey: DocKey; d: ReturnType<typeof buildDocData> }) {
  switch (docKey) {
    case "cover": return <DocCover d={d} />;
    case "bap": return <DocBAP d={d} />;
    case "bast": return <DocBAST d={d} />;
    case "baBayar": return <DocBABayar d={d} />;
    case "baMaterai": return <DocBAMaterai d={d} />;
    case "buktiPengeluaran": return <DocBuktiPengeluaran d={d} />;
    case "disposisi": return <DocDisposisi d={d} />;
    case "daftarPembayaran": return <DocDaftarPembayaran d={d} />;
    case "pernyataanPA": return <DocPernyataanPA d={d} />;
  }
}

/** Pengaturan halaman standar dokumen SPJ (F4, margin 12/15, Tahoma 9,5) */
export function spjEditorSettings(docKey: DocKey) {
  const meta = DOC_LIST.find((x) => x.key === docKey)!;
  return defaultSettings({
    paper: "f4",
    orientation: meta.orientasi,
    docFont: "Tahoma",
    docFontSize: 9.5,
    docLineHeight: 1.32,
    margins: { top: 12, right: 15, bottom: 12, left: 15 },
  });
}

/** Render komponen dokumen SPJ menjadi HTML statis (isi awal editor) */
export async function renderSpjDocHtml(
  docKey: DocKey,
  k: Kegiatan,
  pengaturan: Pengaturan,
  pjMap: Record<string, Pejabat>,
  fallbackHost?: HTMLElement | null
): Promise<string | null> {
  const d = buildDocData(k, pengaturan, pjMap);
  let html: string;
  try {
    const { renderToStaticMarkup } = await import("react-dom/server");
    html = renderToStaticMarkup(
      <div style={{ fontFamily: "Tahoma, Verdana, Arial, sans-serif", fontSize: "9.5pt", lineHeight: 1.32 }}>
        <DocComponent docKey={docKey} d={d} />
      </div>
    );
  } catch (e) {
    console.error("renderToStaticMarkup gagal, coba createRoot", e);
    if (!fallbackHost) return null;
    const root = createRoot(fallbackHost);
    try {
      flushSync(() => {
        root.render(
          <div style={{ fontFamily: "Tahoma, Verdana, Arial, sans-serif", fontSize: "9.5pt", lineHeight: 1.32 }}>
            <DocComponent docKey={docKey} d={d} />
          </div>
        );
      });
    } catch {
      root.unmount();
      return null;
    }
    html = fallbackHost.innerHTML;
    root.unmount();
  }
  // rapikan sumber gambar next/image -> path asli
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  wrap.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src.includes("/_next/image?")) {
      try {
        const real = decodeURIComponent(new URL(src, location.href).searchParams.get("url") || "");
        if (real) img.setAttribute("src", real);
      } catch { /* biarkan */ }
    }
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
  });
  const out = wrap.innerHTML;
  wrap.innerHTML = "";
  return out;
}

type EnsureOpts = {
  kegiatanId: string;
  docKey: DocKey;
  kegiatanList: Kegiatan[];
  pengaturan: Pengaturan;
  pjMap: Record<string, Pejabat>;
  /** daftar dokumen yang sudah diketahui (agar tidak POST dobel) */
  known?: { id: string; source: string }[];
  fallbackHost?: HTMLElement | null;
};

/** Pastikan ada record dokumen editor utk (kegiatan, dokumen); buat bila belum ada */
export async function ensureSpjDoc(opts: EnsureOpts): Promise<{ id: string; created: boolean } | null> {
  const { kegiatanId, docKey, kegiatanList, pengaturan, pjMap, known, fallbackHost } = opts;
  const k = kegiatanList.find((x) => x.id === kegiatanId);
  if (!k) return null;
  const source = docSourceKey(kegiatanId, docKey);
  const meta = DOC_LIST.find((x) => x.key === docKey)!;

  const existing = known?.find((x) => x.source === source);
  if (existing) return { id: existing.id, created: false };

  // cek ulang ke penyimpanan (daftar lokal bisa basi)
  try {
    const r = await fetch("/api/documents", { cache: "no-store" });
    if (r.ok) {
      const all: { id: string; source: string }[] = await r.json();
      const hit = all.find((x) => x.source === source);
      if (hit) return { id: hit.id, created: false };
    }
  } catch { /* lanjut buat baru */ }

  const html = (await renderSpjDocHtml(docKey, k, pengaturan, pjMap, fallbackHost)) ?? "<p><br></p>";
  const r = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `${meta.nama} — ${k.namaKegiatan.slice(0, 60)}`,
      source,
      kegiatanId,
      docKey,
      content: html,
      settings: JSON.stringify(spjEditorSettings(docKey)),
    }),
  });
  if (!r.ok) throw new Error("gagal membuat dokumen");
  const doc = await r.json();
  return { id: doc.id, created: true };
}
