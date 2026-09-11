// Builder data turunan untuk dokumen SPJ
import {
  Kegiatan,
  Pejabat,
  Pengaturan,
} from "@/lib/espj-types";
import {
  kalimatTanggal,
  terbilang,
  fmtNum,
  hitungPPh23,
  templateUraianPembayaran,
  templateUraianKontrak,
  templateUraianPekerjaan,
  normTgl,
} from "@/lib/espj";

export type PejabatMap = Record<string, Pejabat>;

export function buildDocData(k: Kegiatan, s: Pengaturan, pj: PejabatMap) {
  const jumlahBiaya = k.jumlahPeserta * k.biayaSatuan;
  const pph23 = k.pph23 > 0 ? k.pph23 : hitungPPh23(jumlahBiaya);
  const ppn = k.ppn || 0;
  const setelahPotongan = jumlahBiaya - ppn - pph23;

  const kpa = pj["KPA"];
  const pptk = pj["PPTK"];
  const bp = pj["BP"];
  const bpp = pj["BPP"];
  const verifikator = pj["VERIFIKATOR"];
  const pphp = pj["PPHP"];

  return {
    k,
    s,
    kpa,
    pptk,
    bp,
    bpp,
    verifikator,
    pphp,
    jumlahBiaya,
    ppn,
    pph23,
    setelahPotongan,
    terbilangBiaya: `${terbilang(jumlahBiaya)} Rupiah`,
    terhitungBiaya: `Rp ${fmtNum(jumlahBiaya)} (${terbilang(jumlahBiaya)} Rupiah)`,
    kalimatBAP: k.tglBAP ? kalimatTanggal(k.tglBAP) : "",
    kalimatBAST: k.tglBAST ? kalimatTanggal(k.tglBAST) : "",
    kalimatBABayar: k.tglBABayar ? kalimatTanggal(k.tglBABayar) : "",
    kalimatBAMaterai: k.tglBAMaterai ? kalimatTanggal(k.tglBAMaterai) : "",
    uraianPembayaran: k.uraianPembayaran
      ? k.uraianPembayaran
      : templateUraianPembayaran(k),
    uraianKontrak: templateUraianKontrak(k),
    uraianPekerjaan: templateUraianPekerjaan(k),
    periode: `${normTgl(k.tglMulai)} s/d ${normTgl(k.tglSelesai)}`,
    tanggalPengeluaran:
      normTgl(k.tglBABayar) || normTgl(k.tglBAMaterai) || normTgl(k.tglBAP),
  };
}

export type DocData = ReturnType<typeof buildDocData>;
