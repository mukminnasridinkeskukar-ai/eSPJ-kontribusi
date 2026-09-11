// ============================================================
// Utilitas terbilang (angka -> kata bahasa Indonesia),
// format rupiah, dan kalimat tanggal untuk dokumen SPJ.
// ============================================================

const SATUAN = [
  "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
  "Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas",
  "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas",
];

/** Ubah bilangan bulat (0 .. triliunan) menjadi kata bahasa Indonesia. */
export function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Nol";
  return kata(n).trim();
}

function kata(n: number): string {
  if (n < 20) return SATUAN[n];
  if (n < 100) {
    const p = Math.floor(n / 10), s = n % 10;
    return SATUAN[p] + " Puluh" + (s ? " " + SATUAN[s] : "");
  }
  if (n < 200) return "Seratus" + (n % 100 ? " " + kata(n % 100) : "");
  if (n < 1000) {
    const p = Math.floor(n / 100), s = n % 100;
    return SATUAN[p] + " Ratus" + (s ? " " + kata(s) : "");
  }
  if (n < 2000) return "Seribu" + (n % 1000 ? " " + kata(n % 1000) : "");
  if (n < 1000000) {
    const p = Math.floor(n / 1000), s = n % 1000;
    return kata(p) + " Ribu" + (s ? " " + kata(s) : "");
  }
  if (n < 1000000000) {
    const p = Math.floor(n / 1000000), s = n % 1000000;
    return kata(p) + " Juta" + (s ? " " + kata(s) : "");
  }
  if (n < 1000000000000) {
    const p = Math.floor(n / 1000000000), s = n % 1000000000000;
    return kata(p) + " Miliar" + (s ? " " + kata(s) : "");
  }
  const p = Math.floor(n / 1000000000000), s = n % 1000000000000;
  return kata(p) + " Triliun" + (s ? " " + kata(s) : "");
}

/** Format angka gaya Indonesia: 218750000 -> "218.750.000" */
export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

/** Format rupiah: "Rp 218.750.000" */
export function fmtRupiah(n: number | null | undefined): string {
  return "Rp " + fmtNum(n);
}

/** "Rp 218.750.000 (Dua Ratus Delapan Belas Juta ... Rupiah)" — kolom "Terhitung" */
export function terhitung(n: number): string {
  return `${fmtRupiah(n)} (${terbilang(n)} Rupiah)`;
}

// ---------------- Tanggal ----------------

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Parse string tanggal fleksibel:
 *  - ISO  "2026-07-27"
 *  - "27 Juli 2026"
 * Mengembalikan Date (lokal) atau null bila gagal/tidak lengkap.
 */
export function parseTgl(s: string | null | undefined): Date | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const idn = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(t);
  if (idn) {
    const bIdx = BULAN.findIndex((b) => b.toLowerCase() === idn[2].toLowerCase());
    if (bIdx >= 0) return new Date(Number(idn[3]), bIdx, Number(idn[1]));
  }
  return null;
}

/** Format Date -> "27 Juli 2026" */
export function fmtTgl(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return "";
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "27 Juli 2026" atau "2026-07-27" -> "27 Juli 2026" (biarkan teks lain apa adanya) */
export function normTgl(s: string | null | undefined): string {
  const d = parseTgl(s ?? "");
  return d ? fmtTgl(d) : (s ?? "");
}

/** Kalimat dokumen: "Senin tanggal Dua Puluh Tujuh bulan Juli tahun Dua Ribu Dua Puluh Enam" */
export function kalimatTanggal(s: string | null | undefined): string {
  const d = parseTgl(s ?? "");
  if (!d) return (s ?? "").trim();
  return (
    `${HARI[d.getDay()]} tanggal ${terbilang(d.getDate())} ` +
    `bulan ${BULAN[d.getMonth()]} tahun ${terbilangTahun(d.getFullYear())}`
  );
}

/** 2026 -> "Dua Ribu Dua Puluh Enam" */
export function terbilangTahun(y: number): string {
  const ribu = Math.floor(y / 1000);
  const sisa = y % 1000;
  let out = terbilang(ribu) + " Ribu";
  if (sisa === 0) return out;
  if (sisa < 100) {
    // "Dua Puluh Enam", "Sembilan"
    out += " " + kata(sisa);
  } else {
    const ratus = Math.floor(sisa / 100);
    const rest = sisa % 100;
    out += (ratus === 1 ? " Seratus" : " " + SATUAN[ratus] + " Ratus");
    if (rest) out += " " + kata(rest);
  }
  return out;
}

// ---------------- Kalkulasi turunan ----------------

/** Jumlah Biaya = Jumlah Peserta x Biaya Satuan */
export function hitungJumlahBiaya(peserta: number, satuan: number): number {
  return (Number(peserta) || 0) * (Number(satuan) || 0);
}

/** PPh 23 = (Nilai / 1.11) x 2% — sesuai pola data excel */
export function hitungPPh23(nilai: number): number {
  if (!nilai) return 0;
  return Math.round((nilai / 1.11) * 0.02 * 100) / 100;
}

/** Uraian pembayaran (kolom AK) */
export function templateUraianPembayaran(k: {
  namaKegiatan: string; tglMulai: string; tglSelesai: string;
  metode: string; tempat: string; peserta: string;
}): string {
  return (
    `Pembayaran Kontribusi ${k.namaKegiatan}, tanggal ${normTgl(k.tglMulai)} s/d ${normTgl(k.tglSelesai)} ` +
    `secara ${k.metode} di ${k.tempat} an. ${k.peserta}, dkk, sesuai kwitansi terlampir`
  );
}

/** Uraian kontrak (BA Bayar bagian A.5) */
export function templateUraianKontrak(k: {
  namaKegiatan: string; tglMulai: string; tglSelesai: string;
  metode: string; tempat: string;
}): string {
  return (
    `Belanja Kursus Singkat/Pelatihan berupa Pembayaran Kontribusi ${k.namaKegiatan} ` +
    `secara ${k.metode}, tanggal ${normTgl(k.tglMulai)} dan tanggal ${normTgl(k.tglSelesai)} di ${k.tempat}`
  );
}

/** Uraian pekerjaan (BAP Materai F35) */
export function templateUraianPekerjaan(k: {
  namaKegiatan: string; tglMulai: string; tglSelesai: string; tempat: string;
}): string {
  return (
    `Belanja Kursus Singkat/Pelatihan berupa Pembayaran Kontribusi ${k.namaKegiatan} ` +
    `mulai tanggal ${normTgl(k.tglMulai)} s.d tanggal ${normTgl(k.tglSelesai)} di ${k.tempat}`
  );
}

/** Periode judul Daftar Pembayaran: "31 Agustus 2026 s/d 12 September 2026" */
export function periodeSingkat(tglMulai: string, tglSelesai: string): string {
  return `${normTgl(tglMulai)} s/d ${normTgl(tglSelesai)}`;
}
