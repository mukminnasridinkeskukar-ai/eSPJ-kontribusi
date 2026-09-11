"use client";

// Sheet: Ben_20 Ke-1/Ke2 — Bukti Pengeluaran (Bendahara 20)
import { KopSurat, Materai } from "../doc-parts";
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocBuktiPengeluaran({ d }: { d: DocData }) {
  const { k, s, pptk, bpp, kpa } = d;
  const n = fmtNum;
  return (
    <div className="doc-body">
      <div className="bukti-head">
        <KopSurat s={s} />
        <div className="bukti-judul">
          <div className="bold">{s.instansi}</div>
          <div className="bukti-sub">BUKTI PENGELUARAN</div>
        </div>
        <div className="bukti-nomor">
          Nomor Bukti : ..................................
        </div>
      </div>

      <table className="doc-tbl-pihak" style={{ marginTop: "4mm" }}>
        <tbody>
          <tr>
            <td className="w-8">a.</td>
            <td className="w-40">Telah diterima dari</td>
            <td>:</td>
            <td>{bpp?.jabatanPanjang || "Bendahara Pengeluaran Pembantu"}</td>
          </tr>
          <tr>
            <td>-</td>
            <td>Uang Sebesar</td>
            <td>:</td>
            <td className="bold">Rp {n(d.jumlahBiaya)}</td>
          </tr>
          <tr>
            <td>b.</td>
            <td>Terbilang</td>
            <td>:</td>
            <td className="bold">{d.terbilangBiaya}</td>
          </tr>
          <tr>
            <td>c.</td>
            <td>Kepada Nama</td>
            <td>:</td>
            <td>
              {k.namaDirektur} / {k.vendor}
            </td>
          </tr>
          <tr>
            <td />
            <td>Alamat</td>
            <td>:</td>
            <td>{k.alamatVendor}</td>
          </tr>
          <tr>
            <td>d.</td>
            <td>Sebagai Pembayaran</td>
            <td>:</td>
            <td>{d.uraianPembayaran}</td>
          </tr>
          <tr>
            <td className="pt-2">e.</td>
            <td className="pt-2">Kegiatan</td>
            <td className="pt-2" />
            <td className="pt-2">{s.kegiatan}</td>
          </tr>
          <tr>
            <td>f.</td>
            <td>Sub Kegiatan</td>
            <td>:</td>
            <td>{s.subKegiatan}</td>
          </tr>
          <tr>
            <td>g.</td>
            <td>Sumber Dana</td>
            <td>:</td>
            <td>{k.sumberDana}</td>
          </tr>
        </tbody>
      </table>

      <table className="doc-tbl-rekap" style={{ marginTop: "4mm" }}>
        <thead>
          <tr>
            <td className="w-42">Kode Rekening</td>
            <td>Uraian Kode Rekening</td>
            <td className="ctr w-14">Rp</td>
            <td className="ctr w-30">Jumlah</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{s.kodeRekening}</td>
            <td>{s.uraianKodeRekening}</td>
            <td className="ctr">Rp</td>
            <td className="kanan">{n(d.jumlahBiaya)},-</td>
          </tr>
          <tr>
            <td colSpan={2} className="bold">
              Jumlah
            </td>
            <td className="ctr">Rp</td>
            <td className="kanan">{n(d.jumlahBiaya)},-</td>
          </tr>
          <tr>
            <td colSpan={2}>Potongan PPn</td>
            <td className="ctr">Rp</td>
            <td className="kanan">{n(d.ppn)},-</td>
          </tr>
          <tr>
            <td colSpan={2}>Potongan PPh 21</td>
            <td className="ctr">Rp</td>
            <td className="kanan">0,-</td>
          </tr>
          <tr>
            <td colSpan={2}>Potongan PPh 22</td>
            <td className="ctr">Rp</td>
            <td className="kanan">0,-</td>
          </tr>
          <tr>
            <td colSpan={2}>Potongan PPh 23</td>
            <td className="ctr">Rp</td>
            <td className="kanan">{n(d.pph23)},-</td>
          </tr>
          <tr>
            <td colSpan={2}>Potongan PPh 4 Ayat 2</td>
            <td className="ctr">Rp</td>
            <td className="kanan">0,-</td>
          </tr>
          <tr>
            <td colSpan={2} className="bold">
              Jumlah Setelah potongan PPn/PPh
            </td>
            <td className="ctr">Rp</td>
            <td className="kanan bold">{n(d.setelahPotongan)},-</td>
          </tr>
        </tbody>
      </table>

      <div className="bukti-tanggal">
        <b>i.</b> Tanggal Pengeluaran : {d.tanggalPengeluaran}
      </div>

      <div className="ttd-grid-4" style={{ marginTop: "6mm" }}>
        <div className="ttd-col">
          <div>
            Direktur {k.vendor}
          </div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{k.namaDirektur}</div>
        </div>
        <div className="ttd-col">
          <div>PPTK</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{pptk?.nama || "-"}</div>
          <div>NIP. {pptk?.nip || "-"}</div>
        </div>
        <div className="ttd-col">
          <div>Dibayarkan,</div>
          <div>Bendahara Pengeluaran Pembantu</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{bpp?.nama || "-"}</div>
          <div>NIP. {bpp?.nip || "-"}</div>
        </div>
        <div className="ttd-col">
          <div>Mengetahui,</div>
          <div>Kuasa Pengguna Anggaran</div>
          <Materai />
          <div className="ttd-nama">{kpa?.nama || "-"}</div>
          <div>NIP. {kpa?.nip || "-"}</div>
        </div>
      </div>

      <div className="bukti-lembar">
        <div>
          <b>Lembar Pertama</b> : Untuk Bendahara Pengeluaran/Bendahara Pengeluaran Pembantu
        </div>
        <div>
          <b>Lembar Kedua</b> : Untuk PPK-SKPD
        </div>
        <div>
          <b>Lembar Ketiga</b> : Untuk PPTK
        </div>
        <div>
          <b>Lembar Keempat</b> : Arsip
        </div>
      </div>
    </div>
  );
}
