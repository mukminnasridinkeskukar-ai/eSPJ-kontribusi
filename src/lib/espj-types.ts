// Tipe data bersama platform eSPJ-Kontribusi

export type Participant = {
  id?: string;
  kegiatanId?: string;
  urutan?: number;
  nama: string;
  jabatan: string;
  nip: string;
  pangkat: string;
  npwp: string;
  noRekening: string;
  pemilikRekening: string;
  jumlah: number;
  keterangan: string;
};

export type Kegiatan = {
  id: string;
  no: number;
  namaDirektur: string;
  vendor: string;
  jabatanVendor: string;
  alamatVendor: string;
  cpVendor: string;
  namaKegiatan: string;
  dasarSurat: string;
  noSuratPenawaran: string;
  tglSuratPenawaran: string;
  tglMulai: string;
  tglSelesai: string;
  metode: string;
  tempat: string;
  noInvoice: string;
  tglInvoice: string;
  noRekening: string;
  namaBank: string;
  pemilikRekening: string;
  noBAP: string;
  tglBAP: string;
  noBAST: string;
  tglBAST: string;
  noBABayar: string;
  tglBABayar: string;
  noBAMaterai: string;
  tglBAMaterai: string;
  jumlahPeserta: number;
  biayaSatuan: number;
  peserta: string;
  uraianPembayaran: string;
  ppn: number;
  pph23: number;
  sumberDana: string;
  noSPPA: string;
  participants: Participant[];
  createdAt?: string;
  updatedAt?: string;
};

export type Pejabat = {
  id?: string;
  kode: string; // KPA | PPTK | BP | BPP | VERIFIKATOR | PPHP
  nama: string;
  nip: string;
  jabatan: string;
  jabatanPanjang: string;
};

export type Pengaturan = {
  id: string;
  pemerintah: string;
  instansi: string;
  alamat1: string;
  alamat2: string;
  laman: string;
  program: string;
  kegiatan: string;
  subKegiatan: string;
  pekerjaan: string;
  lokasi: string;
  lokasiPekerjaan: string;
  anggaranLabel: string;
  kotaTtd: string;
  tahunAnggaran: string;
  sumberDanaDefault: string;
  kodeRekening: string;
  uraianKodeRekening: string;
  noDPA: string;
  skKPA: string;
  jabatanPPTKPanjang: string;
  jabatanKPAPanjang: string;
};

export const PEJABAT_LABEL: Record<string, string> = {
  KPA: "Kuasa Pengguna Anggaran (KPA)",
  PPTK: "Pejabat Pelaksana Teknis Kegiatan (PPTK)",
  BP: "Bendahara Pengeluaran",
  BPP: "Bendahara Pengeluaran Pembantu",
  VERIFIKATOR: "Verifikator",
  PPHP: "PJPHP/PPHP",
};

// Dokumen yang dihasilkan platform (sheet 2 dst. pada file Excel)
export type DocKey =
  | "cover"
  | "bap"
  | "bast"
  | "baBayar"
  | "baMaterai"
  | "buktiPengeluaran"
  | "disposisi"
  | "daftarPembayaran"
  | "pernyataanPA";

export const DOC_LIST: {
  key: DocKey;
  nama: string;
  sumber: string;
  orientasi: "portrait" | "landscape";
  deskripsi: string;
}[] = [
  {
    key: "cover",
    nama: "Cover SPJ",
    sumber: "Sheet: Cover",
    orientasi: "portrait",
    deskripsi: "Sampul pengajuan proses verifikasi SPJ GU/LS.",
  },
  {
    key: "bap",
    nama: "BA Pemeriksaan Pekerjaan (BAP)",
    sumber: "Sheet: BAP H1/H2",
    orientasi: "portrait",
    deskripsi: "Berita Acara Pemeriksaan Pekerjaan antara KPA dan vendor.",
  },
  {
    key: "bast",
    nama: "BA Serah Terima Pekerjaan (BAST)",
    sumber: "Sheet: BAST H1/H2",
    orientasi: "portrait",
    deskripsi: "Berita Acara Serah Terima Pekerjaan hasil pelatihan.",
  },
  {
    key: "baBayar",
    nama: "BA Pembayaran",
    sumber: "Sheet: BA Bayar H1/H2",
    orientasi: "portrait",
    deskripsi: "Berita Acara Pembayaran dengan rekapitulasi nilai kontrak.",
  },
  {
    key: "baMaterai",
    nama: "BA Pembayaran Bermaterai",
    sumber: "Sheet: BAP Materai H1/H2",
    orientasi: "portrait",
    deskripsi: "Berita Acara Bermaterai atas nilai invoice.",
  },
  {
    key: "buktiPengeluaran",
    nama: "Bukti Pengeluaran (Bend. 20)",
    sumber: "Sheet: Ben_20 Ke-1/Ke2",
    orientasi: "portrait",
    deskripsi: "Kwitansi Bendahara 20 beserta potongan pajak.",
  },
  {
    key: "disposisi",
    nama: "Lembar Disposisi SPJ",
    sumber: "Sheet: Disposisi",
    orientasi: "portrait",
    deskripsi: "Checklist 33 kelengkapan SPJ beserta instruksi/paraf.",
  },
  {
    key: "daftarPembayaran",
    nama: "Daftar Pembayaran Penggantian Uang",
    sumber: "Sheet: Daftar Pembayaran Penggantian U",
    orientasi: "landscape",
    deskripsi: "Daftar peserta penerima penggantian biaya kontribusi bimtek.",
  },
  {
    key: "pernyataanPA",
    nama: "Surat Pernyataan PA/PPTK",
    sumber: "Sheet: Pernyataan PA",
    orientasi: "portrait",
    deskripsi: "Surat pernyataan penggantian uang untuk dokumen SPJ TNT.",
  },
];
