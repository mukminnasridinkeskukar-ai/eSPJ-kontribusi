"use client";

// Sheet: Cover — sampul pengajuan verifikasi SPJ
import type { DocData } from "../doc-data";

export default function DocCover({ d }: { d: DocData }) {
  const { k, s, pptk, bp, bpp, verifikator, jumlahBiaya } = d;
  return (
    <div className="cover-doc">
      <div className="cover-title">
        PENGAJUAN PROSES VERIFIKASI
        <br />
        SPJ - GU/LS TAHUN {s.tahunAnggaran}
      </div>

      <table className="cover-table">
        <tbody>
          <tr>
            <td>Nama Program</td>
            <td>:</td>
            <td>{s.program.toUpperCase()}.</td>
          </tr>
          <tr>
            <td>Nama Kegiatan</td>
            <td>:</td>
            <td>{s.kegiatan}.</td>
          </tr>
          <tr>
            <td>Sub Kegiatan</td>
            <td>:</td>
            <td>{s.subKegiatan}.</td>
          </tr>
          <tr>
            <td>Nama PPTK</td>
            <td>:</td>
            <td>{pptk?.nama || "-"}</td>
          </tr>
          <tr>
            <td>BP</td>
            <td>:</td>
            <td>{bp?.nama || "-"}</td>
          </tr>
          <tr>
            <td>BPP</td>
            <td>:</td>
            <td>{bpp?.nama || "-"}</td>
          </tr>
          <tr>
            <td>Verifikator</td>
            <td>:</td>
            <td>{verifikator?.nama || "-"}</td>
          </tr>
          <tr>
            <td>Nilai SPJ</td>
            <td>:</td>
            <td className="bold">
              Rp {new Intl.NumberFormat("id-ID").format(jumlahBiaya)}
            </td>
          </tr>
          <tr>
            <td>Anggaran</td>
            <td>:</td>
            <td className="bold">{s.anggaranLabel}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: "12mm" }} />
      <div className="cover-jenis">
        {s.pekerjaan}
        <br />
        Tahun {s.tahunAnggaran}
      </div>
      <div style={{ height: "5mm" }} />
      <div className="cover-uraian">{d.uraianPembayaran}</div>
      <div style={{ height: "8mm" }} />
      <div className="cover-vendor">
        {k.namaDirektur} / {k.vendor}
      </div>
    </div>
  );
}
