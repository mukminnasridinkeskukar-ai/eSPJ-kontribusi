"use client";

// Sheet: BAP H1/H2 — Berita Acara Pemeriksaan Pekerjaan
import { KopSurat, Judul, Nomor, Materai, TtdPihak, TtdKanan } from "../doc-parts";
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocBAP({ d }: { d: DocData }) {
  const { k, s, kpa } = d;
  return (
    <div className="doc-body">
      <KopSurat s={s} />
      <Judul baris={["BERITA ACARA PEMERIKSAAN PEKERJAAN"]} />
      <Nomor text={`Nomor : ${k.noBAP}`} />

      <p className="doc-p">
        {d.kalimatBAP ? `Pada hari ini ${d.kalimatBAP}` : "Pada hari ini ............................................"}
        , yang bertanda tangan dibawah ini:
      </p>

      <table className="doc-tbl-pihak">
        <tbody>
          <tr>
            <td className="w-10">I.</td>
            <td className="w-44">N a m a</td>
            <td>:</td>
            <td>{kpa?.nama || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>N I P</td>
            <td>:</td>
            <td>{kpa?.nip || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>Jabatan</td>
            <td>:</td>
            <td>{kpa?.jabatan || "-"}</td>
          </tr>
          <tr>
            <td colSpan={3} />
            <td>{s.skKPA}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat Kantor</td>
            <td>:</td>
            <td>
              {s.instansi} {s.lokasi.replace("Dinas Kesehatan", "")}, Jl. Cut Nyak Dien No.33
              Kel Melayu Tenggarong 75512
            </td>
          </tr>
          <tr>
            <td colSpan={3} />
            <td className="bold">Selanjutnya disebut sebagai PIHAK PERTAMA</td>
          </tr>
          <tr>
            <td className="pt-2">II.</td>
            <td className="pt-2">N a m a</td>
            <td className="pt-2">:</td>
            <td className="pt-2">{k.namaDirektur}</td>
          </tr>
          <tr>
            <td />
            <td>Jabatan</td>
            <td>:</td>
            <td>{k.jabatanVendor}</td>
          </tr>
          <tr>
            <td colSpan={3} />
            <td>Bertindak untuk dan atas nama {k.vendor}</td>
          </tr>
          <tr>
            <td colSpan={3} />
            <td>Berdasarkan {k.dasarSurat || `Surat Penawaran Nomor: ${k.noSuratPenawaran}`}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat</td>
            <td>:</td>
            <td>{k.alamatVendor}</td>
          </tr>
          <tr>
            <td colSpan={3} />
            <td className="bold">Selanjutnya disebut sebagai PIHAK KEDUA</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama selanjutnya disebut sebagai
        &apos;Para Pihak&apos;, dengan ini menyatakan dengan sebenarnya telah melaksanakan
        pemeriksaan berupa pembayaran Kontribusi {k.namaKegiatan} tanggal {normTgl(k.tglMulai)}{" "}
        sampai dengan {normTgl(k.tglSelesai)} secara {k.metode} di {k.tempat}
      </p>
      <p className="doc-p">
        Sebagai Realisasi Surat Penawaran Nomor: {k.noSuratPenawaran} tanggal{" "}
        {normTgl(k.tglSuratPenawaran)}
      </p>
      <p className="doc-p">dengan jumlah/jenis barang sebagai berikut :</p>

      <table className="doc-tbl-barang">
        <thead>
          <tr>
            <td className="ctr bold">NO</td>
            <td className="ctr bold">Uraian Pekerjaan</td>
            <td className="ctr bold">Kuantitas</td>
            <td className="ctr bold">satuan Ukuran</td>
            <td className="ctr bold">Harga Satuan (Rp.)</td>
            <td className="ctr bold">Jumlah (Rp.)</td>
            <td className="ctr bold">Ket</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="ctr">1.</td>
            <td>{s.pekerjaan}</td>
            <td className="ctr">{k.jumlahPeserta}</td>
            <td className="ctr">Orang</td>
            <td className="ctr">{fmtNum(k.biayaSatuan)}</td>
            <td className="ctr">{fmtNum(d.jumlahBiaya)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <p className="doc-p">Dari Hasil Pemeriksaan dari kedua belah pihak dinyatakan :</p>
      <div className="doc-list">
        <div>a. Baik/ Lengkap</div>
        <div>b. Kurang / Tidak Lengkap</div>
      </div>
      <p className="doc-p">
        Demikian Berita Acara ini dibuat pada waktu sebagaimana telah disebutkan pada bagian
        awal Berita Acara ini.
      </p>

      <div className="ctr bold" style={{ marginTop: "6mm" }}>
        PARA PIHAK
      </div>
      <TtdKanan>
        <TtdPihak
          peran="PIHAK PERTAMA"
          jabatan={kpa?.jabatan || "Kuasa Pengguna Anggaran"}
          materai
          nama={kpa?.nama || "-"}
          nip={kpa?.nip}
        />
        <TtdPihak
          peran="PIHAK KEDUA"
          nama={k.namaDirektur}
          jabatan={k.jabatanVendor}
        />
      </TtdKanan>
    </div>
  );
}
