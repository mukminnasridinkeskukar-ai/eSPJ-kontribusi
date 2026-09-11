"use client";

// Sheet: BAP Materai H1/H2 — Berita Acara Pembayaran Bermaterai
import { KopSurat, Materai } from "../doc-parts";
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocBAMaterai({ d }: { d: DocData }) {
  const { k, s, kpa } = d;
  const n = fmtNum;
  return (
    <div className="doc-body">
      <KopSurat s={s} />

      <div className="materai-header">
        <div className="materai-header-left">
          <div className="materai-title-c">BERITA ACARA BERMATERAI</div>
          <table className="doc-tbl-pihak" style={{ marginTop: "3mm" }}>
            <tbody>
              <tr>
                <td className="w-28">Program</td>
                <td>{s.program}</td>
              </tr>
              <tr>
                <td>Kegiatan</td>
                <td>{s.kegiatan}</td>
              </tr>
              <tr>
                <td>Sub Kegiatan</td>
                <td>{s.subKegiatan}</td>
              </tr>
              <tr>
                <td>Pekerjaan</td>
                <td>{s.pekerjaan}</td>
              </tr>
              <tr>
                <td>Lokasi</td>
                <td>{s.lokasi}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="materai-header-right">
          <div className="bold">BERITA ACARA PEMBAYARAN BERMATERAI</div>
          <table className="doc-tbl-pihak" style={{ marginTop: "3mm" }}>
            <tbody>
              <tr>
                <td>Nomor</td>
                <td>:</td>
                <td>{k.noBAMaterai}</td>
              </tr>
              <tr>
                <td>Tanggal</td>
                <td>:</td>
                <td>{normTgl(k.tglBAMaterai)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="doc-p" style={{ clear: "both", paddingTop: "4mm" }}>
        {d.kalimatBAMaterai
          ? `Pada hari ini ${d.kalimatBAMaterai}`
          : "Pada hari ini .............. tanggal ................ bulan ................ tahun ................"}
        , yang bertanda tangan dibawah ini :
      </p>

      <table className="doc-tbl-pihak">
        <tbody>
          <tr>
            <td className="w-10">1.</td>
            <td className="w-30">Nama</td>
            <td>:</td>
            <td className="bold">{kpa?.nama || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>NIP</td>
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
            <td />
            <td>Instansi</td>
            <td>:</td>
            <td>{s.instansi}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat Kantor</td>
            <td>:</td>
            <td>Jl. Cut Nyak Dien No.33 Kel Melayu Tenggarong 75512</td>
          </tr>
          <tr>
            <td colSpan={3}>Untuk selanjutnya disebut : Pihak Pertama</td>
            <td />
          </tr>
          <tr>
            <td className="pt-2">2.</td>
            <td className="pt-2">Nama</td>
            <td className="pt-2">:</td>
            <td className="pt-2 bold">{k.namaDirektur}</td>
          </tr>
          <tr>
            <td />
            <td>Jabatan</td>
            <td>:</td>
            <td>{k.jabatanVendor}</td>
          </tr>
          <tr>
            <td />
            <td>Perusahaan</td>
            <td>:</td>
            <td>{k.vendor}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat Perusahaan</td>
            <td>:</td>
            <td>{k.alamatVendor}</td>
          </tr>
          <tr>
            <td colSpan={3}>Untuk selanjutnya disebut : Pihak Kedua</td>
            <td />
          </tr>
        </tbody>
      </table>

      <table className="doc-tbl-berdasarkan" style={{ marginTop: "3mm" }}>
        <tbody>
          <tr>
            <td className="w-10">A.</td>
            <td className="bold" colSpan={4}>
              Berdasarkan Surat Penawaran:
            </td>
          </tr>
          <tr>
            <td />
            <td className="w-8">1.</td>
            <td>a. Nomor Penawaran</td>
            <td>:</td>
            <td>{k.noSuratPenawaran}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>b. Tanggal Penawaran</td>
            <td>:</td>
            <td>{normTgl(k.tglSuratPenawaran)}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>c. Nomor Invoice</td>
            <td>:</td>
            <td>{k.noInvoice}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>d. Tanggal Invoice</td>
            <td>:</td>
            <td>{normTgl(k.tglInvoice)}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>e. Nilai Invoice</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>&nbsp;&nbsp;&nbsp;Terbilang</td>
            <td>:</td>
            <td className="bold">{d.terbilangBiaya}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>f. Uraian Pekerjaan</td>
            <td>:</td>
            <td>{d.uraianPekerjaan}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>g. Lokasi Pekerjaan</td>
            <td>:</td>
            <td>{s.lokasiPekerjaan}</td>
          </tr>
          <tr>
            <td />
            <td />
            <td>h. Instansi</td>
            <td>:</td>
            <td>{k.vendor}</td>
          </tr>
          <tr>
            <td />
            <td>2.</td>
            <td colSpan={3}>
              Sumber dana DPA SKPD {s.instansi.replace("DINAS", "Dinas")} Kabupaten{" "}
              {s.pemerintah.replace("PEMERINTAH KABUPATEN ", "")}, Sub Kegiatan{" "}
              {s.subKegiatan} Tahun Anggaran {s.tahunAnggaran}
            </td>
          </tr>
          <tr>
            <td />
            <td />
            <td colSpan={3}>Nomor DPA SKP : {s.noDPA}</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        <b>B.</b> Sesuai Surat invoice diatas maka Pihak Kedua menerima pembayaran dari Pihak
        Pertama dengan jumlah nilai pembayaran sebesar : {d.terbilangBiaya}
      </p>
      <p className="doc-p bold">Rekapitulasi Pembayaran Invoice :</p>
      <table className="doc-tbl-berdasarkan">
        <tbody>
          <tr>
            <td className="w-56">Nilai Invoice</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td>Pembayaran s.d BAP lalu</td>
            <td>:</td>
            <td>-</td>
          </tr>
          <tr>
            <td>Pembayaran s.d BAP ini</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td>Total Pembayaran s.d BAP ini</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        <b>C.</b> Pada pembayaran ini Pihak Pertama dan Pihak Kedua sepakat atas sejumlah
        pembayaran diatas dengan jumlah nilai pembayaran sebesar : {d.terbilangBiaya}
      </p>

      <p className="doc-p">
        Demikian Berita Acara Pembayaran Bermaterai ini dibuat dan ditanda tangani di{" "}
        {s.kotaTtd} pada tanggal tersebut diatas untuk dipergunakan sebagaimana mestinya.
      </p>

      <div className="ttd-row" style={{ marginTop: "7mm" }}>
        <div className="ttd-col ctr">
          <div className="bold">PIHAK KEDUA</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{k.namaDirektur}</div>
          <div>{k.jabatanVendor}</div>
        </div>
        <div className="ttd-col ctr">
          <div className="bold">PIHAK PERTAMA</div>
          <div>{kpa?.jabatan || "Kuasa Pengguna Anggaran"}</div>
          <div className="materai-box mx-auto">
            <span>materai</span>
          </div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{kpa?.nama || "-"}</div>
          <div>NIP. {kpa?.nip || "-"}</div>
        </div>
      </div>
    </div>
  );
}
