"use client";

// Sheet: Daftar Pembayaran Penggantian U — format F4 landscape
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

export default function DocDaftarPembayaran({ d }: { d: DocData }) {
  const { k, s, pptk, bp } = d;
  const rows = k.participants ?? [];
  const total = rows.reduce((a, b) => a + (Number(b.jumlah) || 0), 0);

  return (
    <div className="doc-body daftar-doc">
      <div className="ctr bold daftar-title">
        DAFTAR PEMBAYARAN PENGGANTIAN BIAYA KONTRIBUSI BIMTEK DALAM RANGKA{" "}
        {k.namaKegiatan.toUpperCase()}
      </div>
      <div className="ctr daftar-periode">{d.periode}</div>

      <table className="daftar-tbl">
        <thead>
          <tr>
            <th className="w-8">NO</th>
            <th className="w-30">NAMA</th>
            <th className="w-38">JABATAN</th>
            <th className="w-26">NIP</th>
            <th className="w-20">PANGKAT/GOLONGAN</th>
            <th className="w-24">NPWP</th>
            <th className="w-18">NOMOR REKENING</th>
            <th className="w-24">NAMA PEMILIK REKENING</th>
            <th className="w-20">JUMLAH DITRANSFER</th>
            <th className="w-18">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="ctr" colSpan={10}>
                Belum ada data peserta penggantian biaya.
              </td>
            </tr>
          ) : (
            rows.map((p, i) => (
              <tr key={p.id ?? i}>
                <td className="ctr">{i + 1}.</td>
                <td>{p.nama}</td>
                <td>{p.jabatan}</td>
                <td>{p.nip}</td>
                <td>{p.pangkat}</td>
                <td>{p.npwp}</td>
                <td>{p.noRekening}</td>
                <td>{p.pemilikRekening}</td>
                <td className="kanan">{fmtNum(p.jumlah)}</td>
                <td>{p.keterangan}</td>
              </tr>
            ))
          )}
          <tr className="bold">
            <td colSpan={8} className="ctr">
              JUMLAH
            </td>
            <td className="kanan">{fmtNum(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <div className="ttd-row" style={{ marginTop: "10mm" }}>
        <div className="ttd-col ctr">
          <div>Mengetahui :</div>
          <div>Pejabat Pelaksana Teknis Kegiatan (PPTK),</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{pptk?.nama || "-"}</div>
          <div>NIP.{pptk?.nip || "-"}</div>
        </div>
        <div className="ttd-col ctr">
          <div>
            {s.kotaTtd}, ....................................
          </div>
          <div>Bendahara Pengeluaran,</div>
          <div className="ttd-ruang" />
          <div className="ttd-nama">{bp?.nama || "-"}</div>
          <div>NIP. {bp?.nip || "-"}</div>
        </div>
      </div>
    </div>
  );
}
