// Seed data awal eSPJ-Kontribusi dari file SPJ KONTRIBUSI.xlsx
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const kegiatanData = [
  {
    no: 1,
    namaDirektur: "Ns. Adhies Satya Putra, M.Kep",
    vendor: "PT. INTRAINA JAYA MANDIRI",
    jabatanVendor: "Direktur",
    dasarSurat:
      "Surat Penawaran Program Pelatihan Nomor : 149.16/DIKLAT/INTRAINA/VI/2026 tanggal 24 Juni 2026",
    noSuratPenawaran: "149.16/DIKLAT/INTRAINA/VI/2026",
    tglSuratPenawaran: "24 Juni 2026",
    alamatVendor:
      "Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur",
    cpVendor: "082351333456",
    namaKegiatan:
      "Pelatihan Sumber Daya Manusia (SDM) bagi Tenaga Kesehatan dalam Upaya Berhenti Merokok (UBM) di Fasilitas Pelayanan Kesehatan Primer",
    tglMulai: "19 Juli 2026",
    tglSelesai: "24 Juli 2026",
    metode: "Klasikal",
    tempat: "Hotel Horison Samarinda",
    noInvoice: "079.18/DIKLAT/INTRAINA/VII/2026",
    tglInvoice: "23 Juli 2026",
    noRekening: "1381555018",
    namaBank: "BPD Kaltimtara",
    pemilikRekening: "PT. Intraina Jaya Mandiri",
    noBAP: "B-1152/DINKES/SDK-SDMK/400.3.8.3/7/2026",
    tglBAP: "27 Juli 2026",
    noBAST: "B-1153/DINKES/SDK-SDMK/400.3.8.3/7/2026",
    tglBAST: "27 Juli 2026",
    noBABayar: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBABayar: "09 September 2026",
    noBAMaterai: "B-1372/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAMaterai: "09 September 2026",
    jumlahPeserta: 30,
    biayaSatuan: 5500000,
    peserta: "Agus Pirma, A.Md.Kep",
    ppn: 0,
    pph23: 2972972.97,
    sumberDana: "DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026",
    noSPPA: "",
  },
  {
    no: 2,
    namaDirektur: "Ns. Adhies Satya Putra, M.Kep.",
    vendor: "PT. INTRAINA JAYA MANDIRI",
    jabatanVendor: "Direktur",
    dasarSurat:
      "Surat Penawaran Program Pelatihan Nomor: 151.16/DIKLAT/INTRAINA/VI/2026 tanggal 24 Juni 2026",
    noSuratPenawaran: "151.16/DIKLAT/INTRAINA/VI/2026",
    tglSuratPenawaran: "24 Juni 2026",
    alamatVendor:
      "Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur",
    cpVendor: "082351333456",
    namaKegiatan:
      "Pelatihan Tata Laksana Malaria Bagi Tenaga Medis di Fasilitas Pelayanan Kesehatan",
    tglMulai: "27 Juli 2026",
    tglSelesai: "2 Agustus 2026",
    metode: "Klasikal",
    tempat: "Hotel Puri Senyiur Samarinda",
    noInvoice: "084.18/DIKLAT/INTRAINA/VIII/2026",
    tglInvoice: "2 Agustus 2026",
    noRekening: "1381555018",
    namaBank: "BPD Kaltimtara",
    pemilikRekening: "PT. Intraina Jaya Mandiri",
    noBAP: "B-1151/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAP: "3 Agustus 2026",
    noBAST: "B-1166/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAST: "3 Agustus 2026",
    noBABayar: "B-/DINKES/SDK-SDMK/400.3.8.3//2026",
    tglBABayar: "",
    noBAMaterai: "B-/DINKES/SDK-SDMK/400.3.8.3//2026",
    tglBAMaterai: "",
    jumlahPeserta: 30,
    biayaSatuan: 6800000,
    peserta: "dr. Alexandra Giacintya Bulan Bo",
    ppn: 0,
    pph23: 3675675.68,
    sumberDana: "DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026",
    noSPPA: "",
  },
  {
    no: 3,
    namaDirektur: "Muhammad Iqbal Fauzie, SE",
    vendor: "PERKUMPULAN BERSAMA BANGKIT BERJAYA",
    jabatanVendor: "Manager Diklat dan Pelatihan",
    dasarSurat:
      "Surat Penawaran Pelatihan Teknis Nomor: 019/BB/SKel-UND/VII/2026 tanggal 6 Juli 2026",
    noSuratPenawaran: "019/BB/SKel-UND/VII/2026",
    tglSuratPenawaran: "6 Juli 2026",
    alamatVendor: "Jl. Mayjend Soetoyo 38A Samarinda",
    cpVendor: "089681979443",
    namaKegiatan:
      "Pelatihan Pencegahan dan Pengendalian Penyakit Kusta dan Frambusia bagi Pengelola Program Kusta dan Frambusia Tingkat Puskesmas",
    tglMulai: "3 Agustus 2026",
    tglSelesai: "7 Agustus 2026",
    metode: "Klasikal",
    tempat: "UPTD Balai Pelatihan Kesehatan (Bapelkes) Provinsi Kaltim",
    noInvoice: "022/BB/SKel-INV/VIII/2026",
    tglInvoice: "7 Agustus 2026",
    noRekening: "1381504201",
    namaBank: "Bank Kaltimtara",
    pemilikRekening: "PERK. BERSAMA BANGKIT BERJAYA",
    noBAP: "B-1149/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAP: "10 Agustus 2026",
    noBAST: "B-1150/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAST: "10 Agustus 2026",
    noBABayar: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBABayar: "09 September 2026",
    noBAMaterai: "B-1373/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAMaterai: "09 September 2026",
    jumlahPeserta: 30,
    biayaSatuan: 5000000,
    peserta: "Duwi Bagus Cahyadi",
    ppn: 0,
    pph23: 2702702.7,
    sumberDana: "DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026",
    noSPPA: "",
  },
  {
    no: 4,
    namaDirektur: "Muhammad Iqbal Fauzie, SE.",
    vendor: "PERKUMPULAN BERSAMA BANGKIT BERJAYA",
    jabatanVendor: "Manager Diklat dan Pelatihan",
    dasarSurat:
      "Surat Penawaran Pelatihan Teknis Nomor: 024/BB/SKel-UND/VII/2026 tanggal 13 Juli 2026",
    noSuratPenawaran: "024/BB/SKel-UND/VII/2026",
    tglSuratPenawaran: "13 Juli 2026",
    alamatVendor: "Jl. Mayjend Soetoyo 38A Samarinda",
    cpVendor: "089681979443",
    namaKegiatan: "Pelatihan Pengelolaan Limbah Fasyankes",
    tglMulai: "18 Agustus 2026",
    tglSelesai: "22 Agustus 2026",
    metode: "Klasikal",
    tempat: "UPTD Balai Pelatihan Kesehatan (Bapelkes) Provinsi Kaltim",
    noInvoice: "",
    tglInvoice: "",
    noRekening: "1381504201",
    namaBank: "Bank Kaltimtara",
    pemilikRekening: "PERK. BERSAMA BANGKIT BERJAYA",
    noBAP: "B-1229/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAP: "22 Agustus 2026",
    noBAST: "B-1230/DINKES/SDK-SDMK/400.3.8.3/8/2026",
    tglBAST: "22 Agustus 2026",
    noBABayar: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBABayar: "09 September 2026",
    noBAMaterai: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAMaterai: "09 September 2026",
    jumlahPeserta: 30,
    biayaSatuan: 4500000,
    peserta: "Asdiannur, A.M.K.L",
    ppn: 0,
    pph23: 2432432.43,
    sumberDana: "DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026",
    noSPPA: "",
  },
  {
    no: 5,
    namaDirektur: "Ns. Adhies Satya Putra, M.Kep.",
    vendor: "PT. INTRAINA JAYA MANDIRI",
    jabatanVendor: "Direktur",
    dasarSurat:
      "Surat Penawaran Program Pelatihan Nomor: 154.16/DIKLAT/INTRAINA/VI/2026",
    noSuratPenawaran: "154.16/DIKLAT/INTRAINA/VI/2026",
    tglSuratPenawaran: "25 Juni 2026",
    alamatVendor:
      "Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur",
    cpVendor: "082351333456",
    namaKegiatan:
      "Pelatihan Pelayanan Kontrasepsi bagi Dokter dan Bidan di Fasilitas Pelayanan Kesehatan",
    tglMulai: "31 Agustus 2026",
    tglSelesai: "12 September 2026",
    metode: "Blended Learning",
    tempat: "Hotel Yello Samarinda",
    noInvoice: "113.18/DIKLAT/INTRAINA/IX/2026",
    tglInvoice: "12 September 2026",
    noRekening: "1381555018",
    namaBank: "BPD Kaltimtara",
    pemilikRekening: "PT. Intraina Jaya Mandiri",
    noBAP: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAP: "14 September 2026",
    noBAST: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAST: "14 September 2026",
    noBABayar: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBABayar: "",
    noBAMaterai: "B-/DINKES/SDK-SDMK/400.3.8.3/9/2026",
    tglBAMaterai: "",
    jumlahPeserta: 25,
    biayaSatuan: 8750000,
    peserta: "Annisa Nur Mia Fauzi, S.Tr.Keb",
    ppn: 0,
    pph23: 3941441.44,
    sumberDana: "DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026",
    noSPPA: "",
    participants: {
      create: [
        {
          urutan: 1,
          nama: "LENI ASTUTI",
          jabatan: "Kepala Bidang Kesehatan Masyarakat",
          nip: "197703072008012016",
          pangkat: "Penata Tk. I - III/d",
          npwp: "14.467.246.6-728.001",
          noRekening: "0042919934",
          pemilikRekening: "LENI ASTUTI",
          jumlah: 3500000,
          keterangan: "Bankaltimtara",
        },
        {
          urutan: 2,
          nama: "MEIDIANTATI, S.Tr.Keb., Bd",
          jabatan: "Ketua Tim Kerja Pelayanan Kesehatan Keluarga",
          nip: "197205111992032006",
          pangkat: "Penata Tk. I - III/d",
          npwp: "78.604.714.2-728.000",
          noRekening: "0048411118",
          pemilikRekening: "MEIDIANTATI",
          jumlah: 3500000,
          keterangan: "Bankaltimtara",
        },
        {
          urutan: 3,
          nama: "HERLENA HAYATI, S.ST., M.K.M",
          jabatan: "Administrator Kesehatan Ahli Pertama",
          nip: "198003262005022003",
          pangkat: "Penata - III/c",
          npwp: "78.376.358.4-728.000",
          noRekening: "0048000014",
          pemilikRekening: "HERLENA HAYATI",
          jumlah: 3500000,
          keterangan: "Bankaltimtara",
        },
      ],
    },
  },
];

const pejabatData = [
  {
    kode: "KPA",
    nama: "Budi Setiawan, S.Sos., M.Kes",
    nip: "19790329 199803 1 001",
    jabatan: "Kuasa Pengguna Anggaran",
    jabatanPanjang:
      "Kuasa Pengguna Anggaran Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota yang diangkat Berdasarkan SK Bupati Kutai Kartanegara Nomor : 39/SK-BUP/HK/2026, tanggal 15 Januari 2026, tentang Pelimpahan Kewenangan Pengguna Anggaran kepada Kuasa Pengguna Anggaran dan penunjukan Bendahara Pengeluaran Pembantu pada Dinas Kesehatan Tahun Anggaran 2026",
  },
  {
    kode: "PPTK",
    nama: "Mukmin Nasri, S.Kep",
    nip: "19800517 201101 1 003",
    jabatan: "Pejabat Pelaksana Teknis Kegiatan",
    jabatanPanjang:
      "Pejabat Pelaksana Teknis Kegiatan (PPTK) Sub Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota Tahun Anggaran 2026 yang diangkat berdasarkan Keputusan Kuasa Pengguna Anggaran Nomor: B-208/DINKES/SKRT-UTK/900.1.15/2/2026, Tanggal 09 Februari 2026",
  },
  {
    kode: "BP",
    nama: "Milawati Savitri, SE",
    nip: "198500723 201001 2 025",
    jabatan: "Bendahara Pengeluaran",
    jabatanPanjang: "Bendahara Pengeluaran Dinas Kesehatan Kabupaten Kutai Kartanegara",
  },
  {
    kode: "BPP",
    nama: "Irma Arziani",
    nip: "19850914 201001 2 001",
    jabatan: "Bendahara Pengeluaran Pembantu",
    jabatanPanjang:
      "Bendahara Pengeluaran Pembantu Dinas Kesehatan Kabupaten Kutai Kartanegara",
  },
  {
    kode: "VERIFIKATOR",
    nama: "Nurmala, SE",
    nip: "",
    jabatan: "Verifikator",
    jabatanPanjang: "Verifikator SPJ Dinas Kesehatan Kabupaten Kutai Kartanegara",
  },
  {
    kode: "PPHP",
    nama: "Sri Rezki Amelia, S.Kom",
    nip: "",
    jabatan: "PJPHP/PPHP",
    jabatanPanjang: "Pejabat Pelaksana Pemeriksa Harian Pengeluaran (PJPHP/PPHP)",
  },
];

async function main() {
  console.log("Seeding eSPJ-Kontribusi ...");
  await db.participant.deleteMany();
  await db.kegiatan.deleteMany();
  await db.pejabat.deleteMany();
  await db.pengaturan.deleteMany();

  for (const k of kegiatanData) {
    await db.kegiatan.create({ data: k });
  }
  for (const p of pejabatData) {
    await db.pejabat.create({ data: p });
  }
  await db.pengaturan.create({ data: { id: "utama" } });

  const n = await db.kegiatan.count();
  console.log(`Seeded: ${n} kegiatan, ${pejabatData.length} pejabat, 1 pengaturan`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
