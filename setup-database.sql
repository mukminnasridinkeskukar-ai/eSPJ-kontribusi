-- ============================================================
-- eSPJ-Kontribusi — Struktur Database (PostgreSQL)
-- Dinas Kesehatan Kab. Kutai Kartanegara
--
-- CARA PAKAI:
--   1. Siapkan layanan penyimpanan basis data (langkah lengkap di PANDUAN.txt)
--   2. Buka menu "SQL Editor" pada layanan tersebut
--   3. Salin seluruh isi file ini -> klik "Run"
--   4. Ambil Alamat Server & Kunci Akses Publik dari pengaturan
--      koneksi layanan, lalu isi pada aplikasi (tombol status di kanan atas)
-- ============================================================

-- ---------- TABEL UTAMA: kegiatan (satu baris = satu pelatihan) ----------
create table if not exists public.kegiatan (
  id                uuid primary key default gen_random_uuid(),
  "no"              integer      not null default 0,
  "namaDirektur"    text         default '',
  "vendor"          text         default '',
  "jabatanVendor"   text         default '',
  "alamatVendor"    text         default '',
  "cpVendor"        text         default '',
  "namaKegiatan"    text         default '',
  "dasarSurat"      text         default '',
  "noSuratPenawaran" text        default '',
  "tglSuratPenawaran" text       default '',
  "tglMulai"        text         default '',
  "tglSelesai"      text         default '',
  "metode"          text         default 'Klasikal',
  "tempat"          text         default '',
  "noInvoice"       text         default '',
  "tglInvoice"      text         default '',
  "noRekening"      text         default '',
  "namaBank"        text         default '',
  "pemilikRekening" text         default '',
  "noBAP"           text         default '',
  "tglBAP"          text         default '',
  "noBAST"          text         default '',
  "tglBAST"         text         default '',
  "noBABayar"       text         default '',
  "tglBABayar"      text         default '',
  "noBAMaterai"     text         default '',
  "tglBAMaterai"    text         default '',
  "jumlahPeserta"   integer      default 0,
  "biayaSatuan"     double precision default 0,
  "peserta"         text         default '',
  "uraianPembayaran" text        default '',
  "ppn"             double precision default 0,
  "pph23"           double precision default 0,
  "sumberDana"      text         default '',
  "noSPPA"          text         default '',
  "createdAt"       timestamptz  not null default now(),
  "updatedAt"       timestamptz  not null default now()
);

-- ---------- TABEL: participant (baris sheet "Daftar Pembayaran Penggantian U") ----------
create table if not exists public.participant (
  id                uuid primary key default gen_random_uuid(),
  "kegiatanId"      uuid not null references public.kegiatan(id) on delete cascade,
  "urutan"          integer      default 0,
  "nama"            text         default '',
  "jabatan"         text         default '',
  "nip"             text         default '',
  "pangkat"         text         default '',
  "npwp"            text         default '',
  "noRekening"      text         default '',
  "pemilikRekening" text         default '',
  "jumlah"          double precision default 0,
  "keterangan"      text         default ''
);
create index if not exists participant_kegiatan_idx on public.participant("kegiatanId");

-- ---------- TABEL: pejabat (KPA / PPTK / BP / BPP / VERIFIKATOR / PPHP) ----------
create table if not exists public.pejabat (
  id               uuid primary key default gen_random_uuid(),
  kode             text not null unique,
  nama             text default '',
  nip              text default '',
  jabatan          text default '',
  "jabatanPanjang" text default ''
);

-- ---------- TABEL: pengaturan (identitas instansi, satu baris id 'utama') ----------
create table if not exists public.pengaturan (
  id                   text primary key default 'utama',
  pemerintah           text default 'PEMERINTAH KABUPATEN KUTAI KARTANEGARA',
  instansi             text default 'DINAS KESEHATAN',
  "alamat1"            text default 'Jalan Cut Nyak Dien Nomor 33, Melayu, Tenggarong, Kutai Kartanegara',
  "alamat2"            text default 'Kalimantan Timur 75512',
  laman                text default 'Laman : dinkes.kukarkab.go.id Pos-el : dinaskesehatan.kukar@gmail.com',
  program              text default 'Peningkatan Kapasitas Sumber Daya Manusia Kesehatan',
  kegiatan             text default 'Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota',
  "subKegiatan"        text default 'Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota',
  pekerjaan            text default 'Belanja Kursus Singkat/Pelatihan',
  lokasi               text default 'Dinas Kesehatan Kab. Kutai Kartanegara',
  "lokasiPekerjaan"    text default 'Samarinda',
  "anggaranLabel"      text default 'DAK NON FISIK TA 2026',
  "kotaTtd"            text default 'Tenggarong',
  "tahunAnggaran"      text default '2026',
  "sumberDanaDefault"  text default 'DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026',
  "kodeRekening"       text default '5.1.02.02.012.00001',
  "uraianKodeRekening" text default 'Belanja Kursus Singkat/Pelatihan',
  "noDPA"              text default 'DPPA/A.1/1.02.0.00.0.00.01.0000/001/2026',
  "skKPA"              text default 'Berdasarkan SK Bupati Kutai Kartanegara Nomor : 39/SK-BUP/HK/2026, tanggal 15 Januari 2026, tentang Pelimpahan Kewenangan Pengguna Anggaran kepada Kuasa Pengguna Anggaran dan penunjukan Bendahara Pengeluaran Pembantu pada Dinas Kesehatan Tahun Anggaran 2026',
  "jabatanPPTKPanjang" text default 'Pejabat Pelaksana Teknis Kegiatan (PPTK) Sub Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota Tahun Anggaran 2026 yang diangkat berdasarkan Keputusan Kuasa Pengguna Anggaran Nomor: B-208/DINKES/SKRT-UTK/900.1.15/2/2026, Tanggal 09 Februari 2026',
  "jabatanKPAPanjang"  text default 'Kuasa Pengguna Anggaran Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota yang diangkat Berdasarkan SK Bupati Kutai Kartanegara Nomor : 39/SK-BUP/HK/2026, tanggal 15 Januari 2026, tentang Pelimpahan Kewenangan Pengguna Anggaran kepada Kuasa Pengguna Anggaran dan penunjukan Bendahara Pengeluaran Pembantu pada Dinas Kesehatan Tahun Anggaran 2026'
);

-- ---------- TABEL: dokumen_sunting (hasil suntingan manual dokumen SPJ) ----------
-- Setiap kali pengguna menekan "Simpan Dokumen" pada menu Dokumen SPJ,
-- isi lengkap dokumen (HTML) disimpan di sini dan menggantikan isi otomatis.
-- id = "<id kegiatan>::<kunci dokumen>" — satu baris per dokumen per kegiatan.
create table if not exists public.dokumen_sunting (
  id               text primary key,
  "kegiatanId"     uuid not null references public.kegiatan(id) on delete cascade,
  "dokumenKey"     text not null default '',
  "kontenHtml"     text not null default '',
  "updatedAt"      timestamptz not null default now()
);
create index if not exists dokumen_sunting_kegiatan_idx on public.dokumen_sunting("kegiatanId");

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Aplikasi dipakai internal tanpa login, jadi kunci publik diberi
-- akses penuh. Jika ingin lebih aman, aktifkan fitur autentikasi
-- layanan Anda lalu batasi policy (lihat catatan di bagian bawah).
-- ============================================================
alter table public.kegiatan         enable row level security;
alter table public.participant      enable row level security;
alter table public.pejabat          enable row level security;
alter table public.pengaturan       enable row level security;
alter table public.dokumen_sunting  enable row level security;

drop policy if exists "espj_publik_kegiatan"        on public.kegiatan;
drop policy if exists "espj_publik_participant"     on public.participant;
drop policy if exists "espj_publik_pejabat"         on public.pejabat;
drop policy if exists "espj_publik_pengaturan"      on public.pengaturan;
drop policy if exists "espj_publik_dokumen_sunting" on public.dokumen_sunting;

create policy "espj_publik_kegiatan"        on public.kegiatan        for all to anon, authenticated using (true) with check (true);
create policy "espj_publik_participant"     on public.participant     for all to anon, authenticated using (true) with check (true);
create policy "espj_publik_pejabat"         on public.pejabat         for all to anon, authenticated using (true) with check (true);
create policy "espj_publik_pengaturan"      on public.pengaturan      for all to anon, authenticated using (true) with check (true);
create policy "espj_publik_dokumen_sunting" on public.dokumen_sunting for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- DATA AWAL (opsional)
-- Boleh dilewati: aplikasi menyediakan tombol "Isi Data Awal"
-- yang memuat 5 kegiatan contoh dari file Excel beserta
-- pejabat & pengaturan. Bagian di bawah melakukan hal yang
-- sama langsung dari sisi database (idempoten).
-- ============================================================

-- Pengaturan & pejabat
insert into public.pengaturan (id) values ('utama') on conflict (id) do nothing;

insert into public.pejabat (kode, nama, nip, jabatan, "jabatanPanjang") values
  ('KPA', 'Budi Setiawan, S.Sos., M.Kes', '19790329 199803 1 001', 'Kuasa Pengguna Anggaran',
   'Kuasa Pengguna Anggaran Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota yang diangkat Berdasarkan SK Bupati Kutai Kartanegara Nomor : 39/SK-BUP/HK/2026, tanggal 15 Januari 2026, tentang Pelimpahan Kewenangan Pengguna Anggaran kepada Kuasa Pengguna Anggaran dan penunjukan Bendahara Pengeluaran Pembantu pada Dinas Kesehatan Tahun Anggaran 2026'),
  ('PPTK', 'Mukmin Nasri, S.Kep', '19800517 201101 1 003', 'Pejabat Pelaksana Teknis Kegiatan',
   'Pejabat Pelaksana Teknis Kegiatan (PPTK) Sub Kegiatan Pengembangan Mutu dan Peningkatan Kompetensi Teknis Sumber Daya Manusia Kesehatan Tingkat Daerah Kabupaten/Kota Tahun Anggaran 2026 yang diangkat berdasarkan Keputusan Kuasa Pengguna Anggaran Nomor: B-208/DINKES/SKRT-UTK/900.1.15/2/2026, Tanggal 09 Februari 2026'),
  ('BP', 'Milawati Savitri, SE', '198500723 201001 2 025', 'Bendahara Pengeluaran',
   'Bendahara Pengeluaran Dinas Kesehatan Kabupaten Kutai Kartanegara'),
  ('BPP', 'Irma Arziani', '19850914 201001 2 001', 'Bendahara Pengeluaran Pembantu',
   'Bendahara Pengeluaran Pembantu Dinas Kesehatan Kabupaten Kutai Kartanegara'),
  ('VERIFIKATOR', 'Nurmala, SE', '', 'Verifikator',
   'Verifikator SPJ Dinas Kesehatan Kabupaten Kutai Kartanegara'),
  ('PPHP', 'Sri Rezki Amelia, S.Kom', '', 'PJPHP/PPHP',
   'Pejabat Pelaksana Pemeriksa Harian Pengeluaran (PJPHP/PPHP)')
on conflict (kode) do nothing;

-- 5 kegiatan contoh (hanya bila tabel kegiatan masih kosong)
do $$
declare
  sd text := 'DAK Non Fisik Dinas Kesehatan Kab. Kutai Kartanegara Tahun 2026';
  k1 uuid; k2 uuid; k3 uuid; k4 uuid; k5 uuid;
begin
  if exists (select 1 from public.kegiatan) then
    return;
  end if;

  insert into public.kegiatan ("no","namaDirektur","vendor","jabatanVendor","dasarSurat","noSuratPenawaran","tglSuratPenawaran","alamatVendor","cpVendor","namaKegiatan","tglMulai","tglSelesai","metode","tempat","noInvoice","tglInvoice","noRekening","namaBank","pemilikRekening","noBAP","tglBAP","noBAST","tglBAST","noBABayar","tglBABayar","noBAMaterai","tglBAMaterai","jumlahPeserta","biayaSatuan","peserta","ppn","pph23","sumberDana")
  values (1,'Ns. Adhies Satya Putra, M.Kep','PT. INTRAINA JAYA MANDIRI','Direktur',
    'Surat Penawaran Program Pelatihan Nomor : 149.16/DIKLAT/INTRAINA/VI/2026 tanggal 24 Juni 2026',
    '149.16/DIKLAT/INTRAINA/VI/2026','24 Juni 2026',
    'Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur','082351333456',
    'Pelatihan Sumber Daya Manusia (SDM) bagi Tenaga Kesehatan dalam Upaya Berhenti Merokok (UBM) di Fasilitas Pelayanan Kesehatan Primer',
    '19 Juli 2026','24 Juli 2026','Klasikal','Hotel Horison Samarinda',
    '079.18/DIKLAT/INTRAINA/VII/2026','23 Juli 2026','1381555018','BPD Kaltimtara','PT. Intraina Jaya Mandiri',
    'B-1152/DINKES/SDK-SDMK/400.3.8.3/7/2026','27 Juli 2026',
    'B-1153/DINKES/SDK-SDMK/400.3.8.3/7/2026','27 Juli 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    'B-1372/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    30,5500000,'Agus Pirma, A.Md.Kep',0,2972972.97,sd)
  returning id into k1;

  insert into public.kegiatan ("no","namaDirektur","vendor","jabatanVendor","dasarSurat","noSuratPenawaran","tglSuratPenawaran","alamatVendor","cpVendor","namaKegiatan","tglMulai","tglSelesai","metode","tempat","noInvoice","tglInvoice","noRekening","namaBank","pemilikRekening","noBAP","tglBAP","noBAST","tglBAST","noBABayar","tglBABayar","noBAMaterai","tglBAMaterai","jumlahPeserta","biayaSatuan","peserta","ppn","pph23","sumberDana")
  values (2,'Ns. Adhies Satya Putra, M.Kep.','PT. INTRAINA JAYA MANDIRI','Direktur',
    'Surat Penawaran Program Pelatihan Nomor: 151.16/DIKLAT/INTRAINA/VI/2026 tanggal 24 Juni 2026',
    '151.16/DIKLAT/INTRAINA/VI/2026','24 Juni 2026',
    'Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur','082351333456',
    'Pelatihan Tata Laksana Malaria Bagi Tenaga Medis di Fasilitas Pelayanan Kesehatan',
    '27 Juli 2026','2 Agustus 2026','Klasikal','Hotel Puri Senyiur Samarinda',
    '084.18/DIKLAT/INTRAINA/VIII/2026','2 Agustus 2026','1381555018','BPD Kaltimtara','PT. Intraina Jaya Mandiri',
    'B-1151/DINKES/SDK-SDMK/400.3.8.3/8/2026','3 Agustus 2026',
    'B-1166/DINKES/SDK-SDMK/400.3.8.3/8/2026','3 Agustus 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3//2026','',
    'B-/DINKES/SDK-SDMK/400.3.8.3//2026','',
    30,6800000,'dr. Alexandra Giacintya Bulan Bo',0,3675675.68,sd)
  returning id into k2;

  insert into public.kegiatan ("no","namaDirektur","vendor","jabatanVendor","dasarSurat","noSuratPenawaran","tglSuratPenawaran","alamatVendor","cpVendor","namaKegiatan","tglMulai","tglSelesai","metode","tempat","noInvoice","tglInvoice","noRekening","namaBank","pemilikRekening","noBAP","tglBAP","noBAST","tglBAST","noBABayar","tglBABayar","noBAMaterai","tglBAMaterai","jumlahPeserta","biayaSatuan","peserta","ppn","pph23","sumberDana")
  values (3,'Muhammad Iqbal Fauzie, SE','PERKUMPULAN BERSAMA BANGKIT BERJAYA','Manager Diklat dan Pelatihan',
    'Surat Penawaran Pelatihan Teknis Nomor: 019/BB/SKel-UND/VII/2026 tanggal 6 Juli 2026',
    '019/BB/SKel-UND/VII/2026','6 Juli 2026',
    'Jl. Mayjend Soetoyo 38A Samarinda','089681979443',
    'Pelatihan Pencegahan dan Pengendalian Penyakit Kusta dan Frambusia bagi Pengelola Program Kusta dan Frambusia Tingkat Puskesmas',
    '3 Agustus 2026','7 Agustus 2026','Klasikal','UPTD Balai Pelatihan Kesehatan (Bapelkes) Provinsi Kaltim',
    '022/BB/SKel-INV/VIII/2026','7 Agustus 2026','1381504201','Bank Kaltimtara','PERK. BERSAMA BANGKIT BERJAYA',
    'B-1149/DINKES/SDK-SDMK/400.3.8.3/8/2026','10 Agustus 2026',
    'B-1150/DINKES/SDK-SDMK/400.3.8.3/8/2026','10 Agustus 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    'B-1373/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    30,5000000,'Duwi Bagus Cahyadi',0,2702702.7,sd)
  returning id into k3;

  insert into public.kegiatan ("no","namaDirektur","vendor","jabatanVendor","dasarSurat","noSuratPenawaran","tglSuratPenawaran","alamatVendor","cpVendor","namaKegiatan","tglMulai","tglSelesai","metode","tempat","noInvoice","tglInvoice","noRekening","namaBank","pemilikRekening","noBAP","tglBAP","noBAST","tglBAST","noBABayar","tglBABayar","noBAMaterai","tglBAMaterai","jumlahPeserta","biayaSatuan","peserta","ppn","pph23","sumberDana")
  values (4,'Muhammad Iqbal Fauzie, SE.','PERKUMPULAN BERSAMA BANGKIT BERJAYA','Manager Diklat dan Pelatihan',
    'Surat Penawaran Pelatihan Teknis Nomor: 024/BB/SKel-UND/VII/2026 tanggal 13 Juli 2026',
    '024/BB/SKel-UND/VII/2026','13 Juli 2026',
    'Jl. Mayjend Soetoyo 38A Samarinda','089681979443',
    'Pelatihan Pengelolaan Limbah Fasyankes',
    '18 Agustus 2026','22 Agustus 2026','Klasikal','UPTD Balai Pelatihan Kesehatan (Bapelkes) Provinsi Kaltim',
    '','','1381504201','Bank Kaltimtara','PERK. BERSAMA BANGKIT BERJAYA',
    'B-1229/DINKES/SDK-SDMK/400.3.8.3/8/2026','22 Agustus 2026',
    'B-1230/DINKES/SDK-SDMK/400.3.8.3/8/2026','22 Agustus 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','09 September 2026',
    30,4500000,'Asdiannur, A.M.K.L',0,2432432.43,sd)
  returning id into k4;

  insert into public.kegiatan ("no","namaDirektur","vendor","jabatanVendor","dasarSurat","noSuratPenawaran","tglSuratPenawaran","alamatVendor","cpVendor","namaKegiatan","tglMulai","tglSelesai","metode","tempat","noInvoice","tglInvoice","noRekening","namaBank","pemilikRekening","noBAP","tglBAP","noBAST","tglBAST","noBABayar","tglBABayar","noBAMaterai","tglBAMaterai","jumlahPeserta","biayaSatuan","peserta","ppn","pph23","sumberDana")
  values (5,'Ns. Adhies Satya Putra, M.Kep.','PT. INTRAINA JAYA MANDIRI','Direktur',
    'Surat Penawaran Program Pelatihan Nomor: 154.16/DIKLAT/INTRAINA/VI/2026',
    '154.16/DIKLAT/INTRAINA/VI/2026','25 Juni 2026',
    'Jl. Kebon Agung RT 6 No 49 Kelurahan Lempake Samarinda-Kalimantan Timur','082351333456',
    'Pelatihan Pelayanan Kontrasepsi bagi Dokter dan Bidan di Fasilitas Pelayanan Kesehatan',
    '31 Agustus 2026','12 September 2026','Blended Learning','Hotel Yello Samarinda',
    '113.18/DIKLAT/INTRAINA/IX/2026','12 September 2026','1381555018','BPD Kaltimtara','PT. Intraina Jaya Mandiri',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','14 September 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','14 September 2026',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','',
    'B-/DINKES/SDK-SDMK/400.3.8.3/9/2026','',
    25,8750000,'Annisa Nur Mia Fauzi, S.Tr.Keb',0,3941441.44,sd)
  returning id into k5;

  -- Peserta penggantian biaya kontribusi (kegiatan no. 5)
  insert into public.participant ("kegiatanId","urutan","nama","jabatan","nip","pangkat","npwp","noRekening","pemilikRekening","jumlah","keterangan") values
    (k5,1,'LENI ASTUTI','Kepala Bidang Kesehatan Masyarakat','197703072008012016','Penata Tk. I - III/d','14.467.246.6-728.001','0042919934','LENI ASTUTI',3500000,'Bankaltimtara'),
    (k5,2,'MEIDIANTATI, S.Tr.Keb., Bd','Ketua Tim Kerja Pelayanan Kesehatan Keluarga','197205111992032006','Penata Tk. I - III/d','78.604.714.2-728.000','0048411118','MEIDIANTATI',3500000,'Bankaltimtara'),
    (k5,3,'HERLENA HAYATI, S.ST., M.K.M','Administrator Kesehatan Ahli Pertama','198003262005022003','Penata - III/c','78.376.358.4-728.000','0048000014','HERLENA HAYATI',3500000,'Bankaltimtara');
end $$;

-- ============================================================
-- CATATAN KEAMANAN (opsional, untuk tahap lanjut):
-- Policy di atas membuka akses penuh bagi siapa saja yang
-- memegang kunci akses publik (sesuai kebutuhan aplikasi
-- internal tanpa login). Bila ingin diperketat, aktifkan fitur
-- autentikasi penyedia layanan Anda lalu ganti using (true)
-- menjadi, misalnya:
--   using (auth.role() = 'authenticated')
-- ============================================================
