"use client";

// Sheet: BAST H1/H2 — Berita Acara Serah Terima Pekerjaan
import { KopSurat, Judul, Nomor, TtdPihak, TtdKanan } from "../doc-parts";
import type { DocData } from "../doc-data";
import { normTgl } from "@/lib/espj";

export default function DocBAST({ d }: { d: DocData }) {
  const { k, s, kpa } = d;
  return (
    <div className="doc-body">
      <KopSurat s={s} />
      <Judul baris={["BERITA ACARA SERAH TERIMA PEKERJAAN"]} />
      <Nomor text={`Nomor : ${k.noBAST}`} />

      <p className="doc-p">
        {d.kalimatBAST
          ? `Pada hari ini ${d.kalimatBAST}`
          : "Pada hari ini ............................................"}
        , yang bertanda tangan dibawah ini :
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
            <td>
              Selanjutnya disebut : <span className="bold">Pihak Pertama</span>
            </td>
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
            <td>
              Selanjutnya disebut : <span className="bold">Pihak Kedua</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama selanjutnya disebut sebagai
        &quot;Para Pihak&quot;. Para Pihak dengan ini terlebih dahulu menerangkan hal-hal
        sebagai berikut:
      </p>

      <div className="doc-clause">
        <span>1.</span>
        <p>
          Bahwa, sebelumnya PIHAK PERTAMA dan PIHAK KEDUA telah mengadakan suatu kerja sama
          Pelaksanaan Pekerjaan Berupa {s.pekerjaan} berdasarkan Surat Penawaran Nomor :{" "}
          {k.noSuratPenawaran} tanggal {normTgl(k.tglSuratPenawaran)};
        </p>
      </div>
      <div className="doc-clause">
        <span>2.</span>
        <p>
          Bahwa, Perjanjian tersebut telah menempatkan PIHAK PERTAMA sebagai Pemberi Kerja dan
          PIHAK KEDUA sebagai Pelaksana Kerja;
        </p>
      </div>
      <div className="doc-clause">
        <span>3.</span>
        <p>
          Bahwa, Perjanjian tersebut telah mewajibkan PIHAK KEDUA sebagai Pelaksana Kerja untuk
          melakukan pekerjaan dan menyerahkan hasil pekerjaan tersebut kepada PIHAK PERTAMA
          sebagai Pemberi Kerja, yaitu berupa pekerjaan {k.namaKegiatan} pada tanggal{" "}
          {normTgl(k.tglMulai)} sampai dengan {normTgl(k.tglSelesai)} secara {k.metode} di{" "}
          {k.tempat}.
        </p>
      </div>

      <p className="doc-p">
        Selanjutnya, untuk melaksanakan serah terima hasil pekerjaan diantara Para Pihak
        berdasarkan Perjanjian, maka Para Pihak dengan ini sepakat :
      </p>
      <div className="doc-clause">
        <span>4.</span>
        <p>
          Bahwa, PIHAK KEDUA dengan ini menyerahkan hasil pekerjaan kepada PIHAK PERTAMA
          sebagaimana PIHAK PERTAMA dengan ini menerima hasil pekerjaan tersebut dari PIHAK
          KEDUA;
        </p>
      </div>
      <div className="doc-clause">
        <span>5.</span>
        <p>
          Bahwa, dengan telah dilakukannya serah terima hasil pekerjaan berdasarkan Berita
          Acara ini, maka dengan demikian kewajiban PIHAK KEDUA sebagai Pelaksana Kerja untuk
          menyerahkan hasil pekerjaan kepada PIHAK PERTAMA dan hak PIHAK PERTAMA sebagai
          Pemberi Kerja untuk menerima hasil pekerjaan tersebut dari PIHAK KEDUA berdasarkan
          Perjanjian telah dilaksanakan;
        </p>
      </div>
      <div className="doc-clause">
        <span>6.</span>
        <p>
          Bahwa, Berita Acara ini merupakan bagian dari pelaksanaan Perjanjian dan sekaligus
          sebagai Tanda Terima hasil pekerjaan diantara Para Pihak, sehingga oleh karenanya
          merupakan satu kesatuan dan bagian yang tidak terpisahkan dari Perjanjian.
        </p>
      </div>

      <p className="doc-p">
        Demikian Berita Acara ini dibuat pada waktu sebagaimana telah disebutkan pada bagian
        awal Berita Acara ini.
      </p>

      <div className="ctr bold" style={{ marginTop: "5mm" }}>
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
        <TtdPihak peran="PIHAK KEDUA" nama={k.namaDirektur} jabatan={k.jabatanVendor} />
      </TtdKanan>
    </div>
  );
}
