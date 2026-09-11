"use client";

// Sheet: Pernyataan PA — Surat Pernyataan Penggantian Uang (SPJ TNT)
import { KopSurat, Judul, Nomor } from "../doc-parts";
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocPernyataanPA({ d }: { d: DocData }) {
  const { k, s, kpa, pptk } = d;
  const n = fmtNum;
  return (
    <div className="doc-body">
      <KopSurat s={s} />
      <Judul baris={["SURAT PERNYATAAN"]} />
      <Nomor text={`Nomor: ${k.noSPPA || ""}`} />

      <p className="doc-p">Kami yang bertanda tangan dibawah ini :</p>

      <table className="doc-tbl-pihak">
        <tbody>
          <tr>
            <td className="w-10">I.</td>
            <td className="w-20">Nama</td>
            <td className="w-4">:</td>
            <td>{kpa?.nama || "-"}</td>
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
            <td>{s.jabatanKPAPanjang}</td>
          </tr>
          <tr>
            <td />
            <td>Unit Kerja</td>
            <td>:</td>
            <td>{s.instansi}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat Kantor</td>
            <td>:</td>
            <td>Jl. Cut Nyak Dien No.33 Kel. Melayu Tenggarong 75512</td>
          </tr>
          <tr>
            <td className="pt-2">II.</td>
            <td className="pt-2">Nama</td>
            <td className="pt-2">:</td>
            <td className="pt-2">{pptk?.nama || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>NIP</td>
            <td>:</td>
            <td>{pptk?.nip || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>Jabatan</td>
            <td>:</td>
            <td>{s.jabatanPPTKPanjang}</td>
          </tr>
          <tr>
            <td />
            <td>Unit Kerja</td>
            <td>:</td>
            <td>{s.instansi}</td>
          </tr>
          <tr>
            <td />
            <td>Alamat Kantor</td>
            <td>:</td>
            <td>Jl. Cut Nyak Dien No.33 Kel. Melayu Tenggarong 75512</td>
          </tr>
          <tr>
            <td colSpan={3}>
              Selanjutnya disebut : <b>Pihak Pertama</b>
            </td>
            <td />
          </tr>
          <tr>
            <td className="pt-2">III.</td>
            <td className="pt-2">Nama</td>
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
            <td />
            <td>Alamat</td>
            <td>:</td>
            <td>{k.alamatVendor}</td>
          </tr>
          <tr>
            <td colSpan={3}>
              Selanjutnya disebut : <b>Pihak Kedua</b>
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <p className="doc-p bold">Dengan ini menyatakan :</p>

      <div className="doc-clause">
        <span>1.</span>
        <div>
          <p>
            Bahwa, PIHAK PERTAMA dan PIHAK KEDUA telah mengadakan suatu kerja sama Pelaksanaan
            Pekerjaan sebagai berikut :
          </p>
          <table className="doc-tbl-pihak" style={{ marginLeft: "6mm" }}>
            <tbody>
              <tr>
                <td className="w-8">a.</td>
                <td className="w-32">Nama Pekerjaan</td>
                <td>:</td>
                <td>{s.pekerjaan}</td>
              </tr>
              <tr>
                <td>b.</td>
                <td>Surat Penawaran</td>
                <td>:</td>
                <td>Nomor: {k.noSuratPenawaran}</td>
              </tr>
              <tr>
                <td>c.</td>
                <td>Beban Anggaran</td>
                <td>:</td>
                <td>
                  DPA SKPD {s.instansi.replace("DINAS", "Dinas")} Kab.{" "}
                  {s.pemerintah.replace("PEMERINTAH KABUPATEN ", "")}, Kegiatan {s.kegiatan}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="doc-clause">
        <span>2.</span>
        <p>
          Bahwa, PIHAK KEDUA telah melaksanakan pekerjaan tersebut dan menyerahkan hasil
          pekerjaan kepada PIHAK PERTAMA dan PIHAK PERTAMA telah menerima hasil pekerjaan
          tersebut dari PIHAK KEDUA.
        </p>
      </div>
      <div className="doc-clause">
        <span>3.</span>
        <div>
          <p>
            Bahwa, dengan telah diserahkan terimakannya hasil pekerjaan tersebut, maka PIHAK
            PERTAMA telah melakukan pembayaran secara tunai dari nilai transaksi setelah
            dipotong Pajak kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima secara tunai
            pembayaran dari PIHAK PERTAMA, dengan perincian sebagai berikut :
          </p>
          <table className="doc-tbl-pihak" style={{ marginLeft: "6mm" }}>
            <tbody>
              <tr>
                <td className="w-8">a.</td>
                <td className="w-38">Nilai Transaksi</td>
                <td>:</td>
                <td>{n(d.jumlahBiaya)}</td>
              </tr>
              <tr>
                <td>b.</td>
                <td>Potongan Pajak</td>
                <td>:</td>
                <td>{n(d.ppn)}</td>
              </tr>
              <tr>
                <td>c.</td>
                <td>Jumlah Setelah potongan Pajak</td>
                <td>:</td>
                <td>{n(d.setelahPotongan)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="doc-clause">
        <span>4.</span>
        <p>
          Bahwa, dengan telah terjadinya transaksi pembayaran dari PIHAK PERTAMA kepada PIHAK
          KEDUA, maka PIHAK PERTAMA berhak mendapat penggantian uang pada saat Surat
          Pertanggungjawaban (SPJ) Belanja Pekerjaan tersebut dibayar oleh Bendahara
          Pengeluaran.
        </p>
      </div>

      <p className="doc-p">
        Demikian Surat Pernyataan ini dibuat sesuai dengan keadaan sebenarnya, dan dibuat
        untuk kelengkapan dalam Dokumen Surat Pertanggungjawaban (SPJ) Belanja dengan sistem
        pembayaran Transaksi Non Tunai (TNT).
      </p>

      <div className="ttd-row" style={{ marginTop: "8mm" }}>
        <div className="ttd-col ctr">
          <div>PIHAK PERTAMA</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{pptk?.nama || "-"}</div>
          <div>NIP. {pptk?.nip || "-"}</div>
        </div>
        <div className="ttd-col ctr">
          <div>
            {s.kotaTtd}, {normTgl(k.tglBAMaterai) || "........................"}
          </div>
          <div>PIHAK KEDUA</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{k.namaDirektur}</div>
        </div>
      </div>

      <div className="ttd-row" style={{ marginTop: "8mm" }}>
        <div className="ttd-col" />
        <div className="ttd-col ctr">
          <div>Pengguna Anggaran</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{kpa?.nama || "-"}</div>
          <div>NIP. {kpa?.nip || "-"}</div>
        </div>
      </div>
    </div>
  );
}
