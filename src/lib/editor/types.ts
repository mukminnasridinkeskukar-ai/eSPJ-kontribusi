// ============================================================
// Editor Dokumen — tipe data & preset halaman
// ============================================================

export const MM = 3.77952768; // 1mm dalam px (96dpi)

export type PaperSizeKey = "f4" | "a4" | "a5" | "letter" | "legal" | "custom";

export type Margins = { top: number; right: number; bottom: number; left: number };

export type PageNumberFormat = "n" | "hal-n" | "n-dari-y" | "n/y";
export type PageNumberPosition = "left" | "center" | "right";

export type DocSettings = {
  paper: PaperSizeKey;
  paperW: number; // mm (portrait) — saat landscape tertukar
  paperH: number;
  orientation: "portrait" | "landscape";
  margins: Margins; // mm
  headerDist: number; // mm
  footerDist: number; // mm
  differentFirstPage: boolean;
  docFont: string;
  docFontSize: number; // pt
  docLineHeight: number;
  pageNumber: {
    enabled: boolean;
    position: PageNumberPosition;
    format: PageNumberFormat;
    start: number;
  };
};

// Ukuran kertas (mm, tegak)
export const PAPER_SIZES: Record<Exclude<PaperSizeKey, "custom">, { w: number; h: number; label: string }> = {
  f4: { w: 215, h: 330, label: "F4 / Folio (215 × 330 mm)" },
  a4: { w: 210, h: 297, label: "A4 (210 × 297 mm)" },
  a5: { w: 148, h: 210, label: "A5 (148 × 210 mm)" },
  letter: { w: 215.9, h: 279.4, label: "Letter (215,9 × 279,4 mm)" },
  legal: { w: 215.9, h: 355.6, label: "Legal (215,9 × 355,6 mm)" },
};

export const MARGIN_PRESETS: Record<string, Margins & { label: string }> = {
  normal: { label: "Normal", top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
  narrow: { label: "Sempit", top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  moderate: { label: "Moderat", top: 25.4, right: 19.1, bottom: 25.4, left: 19.1 },
  f4dinkes: { label: "F4 SPJ (12/15)", top: 12, right: 15, bottom: 12, left: 15 },
  wide: { label: "Lebar", top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },
};

export const FONT_LIST = [
  "Arial",
  "Calibri",
  "Times New Roman",
  "Cambria",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Courier New",
];

export const FONT_SIZES = [8, 9, 9.5, 10, 10.5, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 48, 72];

export function defaultSettings(over?: Partial<DocSettings>): DocSettings {
  return {
    paper: "f4",
    paperW: 215,
    paperH: 330,
    orientation: "portrait",
    margins: { top: 12, right: 15, bottom: 12, left: 15 },
    headerDist: 8,
    footerDist: 8,
    differentFirstPage: false,
    docFont: "Times New Roman",
    docFontSize: 11,
    docLineHeight: 1.5,
    pageNumber: { enabled: false, position: "center", format: "n", start: 1 },
    ...over,
  };
}

export function parseSettings(json: string | null | undefined): DocSettings {
  if (!json) return defaultSettings();
  try {
    const o = JSON.parse(json);
    return defaultSettings(o);
  } catch {
    return defaultSettings();
  }
}

/** Dimensi kertas efektif (mm) sesuai orientasi */
export function effectivePaper(s: DocSettings): { w: number; h: number } {
  return s.orientation === "landscape"
    ? { w: s.paperH, h: s.paperW }
    : { w: s.paperW, h: s.paperH };
}

/** Tinggi area isi halaman (mm) */
export function contentHeight(s: DocSettings): number {
  const p = effectivePaper(s);
  return p.h - s.margins.top - s.margins.bottom;
}

/** Lebar area isi (mm) */
export function contentWidth(s: DocSettings): number {
  const p = effectivePaper(s);
  return p.w - s.margins.left - s.margins.right;
}

export const mm2twip = (mm: number) => Math.round(mm * 56.6929);
export const px2twip = (px: number) => Math.round((px / MM) * 56.6929);
export const pt2half = (pt: number) => Math.round(pt * 2);

export type DocListItem = {
  id: string;
  title: string;
  source: string;
  kegiatanId: string | null;
  docKey: string | null;
  settings: string;
  createdAt: string;
  updatedAt: string;
  versions: number;
};

export type VersionItem = {
  id: string;
  label: string;
  author: string;
  title: string;
  createdAt: string;
};

export type FullDoc = DocListItem & {
  content: string;
  headerHtml: string;
  headerFirst: string;
  footerHtml: string;
  footerFirst: string;
};

export function docSourceKey(kegiatanId: string, docKey: string) {
  return `gen:${kegiatanId}:${docKey}`;
}

export function parseSource(source: string): { kegiatanId: string; docKey: string } | null {
  if (!source.startsWith("gen:")) return null;
  const [, kegiatanId, docKey] = source.split(":");
  return kegiatanId && docKey ? { kegiatanId, docKey } : null;
}
