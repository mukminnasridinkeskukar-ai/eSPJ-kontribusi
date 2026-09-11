"use client";

// Sheet: BA Bayar H1/H2 — Berita Acara Pembayaran
import { KopSurat, Judul, Nomor, TtdPihak, TtdKanan } from "../doc-parts";
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocBABayar({ d }: { d: DocData }) {
  const { k, s, pptk } = d;
  const n = fmtNum;
  return (
    <div className="doc-body">
      <KopSurat s={s} />
      <Judul baris={["BERITA ACARA PEMBAYARAN"]} />
      <Nomor text={`Nomor : ${k.noBABayar}`} />

      <p className="doc-p">
        {d.kalimatBABayar
          ? `Pada hari ini ${d.kalimatBABayar}`
          : "Pada hari ini .............. tanggal ................ bulan ................ tahun ................"}
        , yang bertanda tangan dibawah ini :
      </p>

      <table className="doc-tbl-pihak">
        <tbody>
          <tr>
            <td className="w-10">I.</td>
            <td className="w-44">N a m a</td>
            <td>:</td>
            <td>{pptk?.nama || "-"}</td>
          </tr>
          <tr>
            <td />
            <td>N I P</td>
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
            <td>Alamat Kantor</td>
            <td>:</td>
            <td>
              {s.instansi} {s.lokasi.replace("Dinas Kesehatan", "")} Jl. Cut Nyak Dien No.33
              Kel. Melayu Tenggarong 75512
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

      <table className="doc-tbl-berdasarkan">
        <tbody>
          <tr>
            <td className="w-10">A.</td>
            <td className="bold">Berdasarkan :</td>
          </tr>
          <tr>
            <td />
            <td>1.</td>
            <td>Surat Penawaran</td>
            <td>:</td>
            <td>
              Nomor: {k.noSuratPenawaran} tanggal {normTgl(k.tglSuratPenawaran)}
            </td>
          </tr>
          <tr>
            <td />
            <td>2.</td>
            <td>Nilai Kontrak</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td />
            <td>3.</td>
            <td>Berita Acara Pemeriksaan Pekerjaan</td>
            <td>:</td>
            <td>
              Nomor: {k.noBAP} tanggal {normTgl(k.tglBAP)}
            </td>
          </tr>
          <tr>
            <td />
            <td>4.</td>
            <td>Berita Acara Serah Terima Pekerjaan</td>
            <td>:</td>
            <td>
              Nomor: {k.noBAST} tanggal {normTgl(k.tglBAST)}
            </td>
          </tr>
          <tr>
            <td />
            <td>5.</td>
            <td>Uraian Kontrak</td>
            <td>:</td>
            <td>{d.uraianKontrak}</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        <b>B.</b> Berdasarkan hal tersebut diatas, sesuai Surat Perintah Kerja tersebut diatas
        maka PIHAK KEDUA berhak menerima Pembayaran yang disediakan oleh PIHAK KESATU dengan
        rincian sebagai berikut :
      </p>
      <table className="doc-tbl-berdasarkan">
        <tbody>
          <tr>
            <td />
            <td>1.</td>
            <td>Jumlah Pembayaran s.d BAP ini</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td />
            <td>2.</td>
            <td>Jumlah Pembayaran s.d BAP yang lalu</td>
            <td>:</td>
            <td>-</td>
          </tr>
          <tr>
            <td />
            <td>3.</td>
            <td>Jumlah Pembayaran ini</td>
            <td>:</td>
            <td>{n(d.jumlahBiaya)}</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p bold">Rekapitulasi Pembayaran Kontrak :</p>
      <table className="doc-tbl-rekap">
        <thead>
          <tr>
            <td className="w-10 ctr">No</td>
            <td>Uraian Kegiatan</td>
            <td className="ctr" style={{ width: "28mm" }}>
              Nilai Fisik
            </td>
            <td className="ctr" style={{ width: "26mm" }}>
              PPn dipungut
            </td>
            <td className="ctr" style={{ width: "28mm" }}>
              Jumlah
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="ctr">1.</td>
            <td>Nilai Kontrak</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
            <td className="kanan">{n(d.ppn)}</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td className="ctr">2.</td>
            <td>Pembayaran s.d BAP lalu</td>
            <td className="kanan">-</td>
            <td className="kanan">-</td>
            <td className="kanan">-</td>
          </tr>
          <tr>
            <td className="ctr">3.</td>
            <td>Pembayaran s.d BAP ini</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
            <td className="kanan">{n(d.ppn)}</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td className="ctr">4.</td>
            <td>Total Pembayaran s.d BAP ini</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
            <td className="kanan">{n(d.ppn)}</td>
            <td className="kanan">{n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td className="ctr">5.</td>
            <td>Sisa Kontrak</td>
            <td className="kanan">-</td>
            <td className="kanan">-</td>
            <td className="kanan">-</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        <b>C.</b> PIHAK KEDUA sepakat atas jumlah pembayaran tersebut dan akan dibayarkan ke
        Rekening Nomor : {k.noRekening} Pada {k.namaBank} an. {k.pemilikRekening}
      </p>
      <p className="doc-p">
        Berita Acara ini dibuat dengan sesungguhnya dengan mengingat sumpah Jabatan dan dibuat
        rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
      </p>

      <div className="ttd-row" style={{ marginTop: "8mm" }}>
        <div className="ttd-col">
          <div>PIHAK KEDUA</div>
          <div className="ttd-ruang" />
          <div className="materai-box">
            <span>materai</span>
          </div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{k.namaDirektur}</div>
          <div>{k.jabatanVendor}</div>
        </div>
        <div className="ttd-col">
          <div>PIHAK KESATU</div>
          <div>Pejabat Pelaksana Teknis Kegiatan</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{pptk?.nama || "-"}</div>
          <div>NIP. {pptk?.nip || "-"}</div>
        </div>
      </div>
    </div>
  );
}
