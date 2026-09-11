"use client";

// Sheet: Disposisi — Lembar Disposisi kelengkapan SPJ (33 item checklist)
import type { DocData } from "../doc-data";
import { fmtNum, normTgl } from "@/lib/espj";

function DispBox({
  nama,
  label,
  tinggi,
}: {
  nama?: string;
  label: string;
  tinggi?: string;
}) {
  return (
    <div className="disp-box" style={{ minHeight: tinggi }}>
      {nama ? <div className="disp-nama">{nama}</div> : null}
      <div className="disp-label">{label}</div>
      <div className="disp-ttd" />
    </div>
  );
}

const ITEM_LIST: string[] = [
  "SRT. MOHON TERIMA & PERIKSA DARI PIHAK KETIGA",
  "BA. PEMERIKSAAN BARANG DARI PPK",
  "BA. SERAH TERIMA BARANG DARI PIHAK KETIGA KE PPK",
  "BA. SERAH TERIMA PEKERJAAN DARI PIHAK KETIGA KE PPK",
  "BA. SERAH TERIMA PEKERJAAN DARI PPK KE KPA",
  "SRT. MOHON PERIKSA ADMIN DARI KPA KE PJPHP/PPHP",
  "BA. PEMERIKSAAN ADMIN PJPHP/PPHP",
  "SRT. MOHON PEMBAYARAN DARI PIHAK KETIGA",
  "BA. PEMBAYARAN",
  "BA. PEMBAYARAN BERMATERAI",
  "SPTJB",
  "KWITANSI BEND. 20",
  "FAKTUR/INVOICE/NOTA",
  "FAKTUR PAJAK",
  "E - BILING",
  "REKENING KORAN/BANK",
  "KARTU INVENTARIS BARANG/KIB",
  "FC. PERJANJIAN/KONTRAK",
  "DOKUMENTASI KEGIATAN",
  "SURAT PERNYATAAN VERIFIKASI PPK SKPD",
  "RESUME KONTRAK",
  "FC. DPA",
  "LEMBAR SPP-LS",
  "LEMBAR SPM",
];

export default function DocDisposisi({ d }: { d: DocData }) {
  const { k, s, pptk, kpa, bpp, bp, pphp, verifikator } = d;
  const items = [...ITEM_LIST];
  while (items.length < 33) items.push("");

  return (
    <div className="doc-body disp-doc">
      <div className="ctr bold disp-title">
        LEMBAR DISPOSISI {s.instansi} PENGADAAN BARANG &amp; JASA
      </div>

      <table className="doc-tbl-pihak disp-info">
        <tbody>
          <tr>
            <td className="w-32 disp-lbl">TANGGAL</td>
            <td>:</td>
            <td>{normTgl(k.tglBAP) || normTgl(k.tglMulai)}</td>
          </tr>
          <tr>
            <td className="disp-lbl">PROGRAM</td>
            <td>:</td>
            <td>{s.program}</td>
          </tr>
          <tr>
            <td className="disp-lbl">KEGIATAN</td>
            <td>:</td>
            <td>{s.kegiatan}</td>
          </tr>
          <tr>
            <td className="disp-lbl">URAIAN</td>
            <td>:</td>
            <td>{s.pekerjaan}</td>
          </tr>
          <tr>
            <td className="disp-lbl">PELAKSANA</td>
            <td>:</td>
            <td>{k.vendor}</td>
          </tr>
          <tr>
            <td className="disp-lbl">NILAI KONTRAK</td>
            <td>:</td>
            <td className="bold">Rp {fmtNum(d.jumlahBiaya)}</td>
          </tr>
        </tbody>
      </table>

      <table className="disp-grid">
        <thead>
          <tr>
            <th colSpan={3} className="disp-th">
              KELENGKAPAN SPJ
            </th>
            <th className="disp-th">INSTRUKSI/INFORMASI</th>
            <th className="disp-th">TANDA TANGAN/PARAF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="disp-items">
              {items.map((it, i) => (
                <div className="disp-item" key={i}>
                  <span className="disp-no">{i + 1}.</span>
                  <span className="disp-uraian">{it}</span>
                  <span className="disp-check" />
                </div>
              ))}
            </td>
            <td className="disp-kolom">
              <div className="disp-instruksi">
                <div className="disp-note-line">Diperiksa kelengkapannya :</div>
                <div className="disp-note-line">1. Administrasi</div>
                <div className="disp-note-line">2. Teknis</div>
                <div className="disp-note-line">
                  <br />
                </div>
                <div className="disp-note-line">
                  <br />
                </div>
                <div className="disp-note-line">Catatan : ..........................................</div>
                <div className="disp-note-line">
                  ......................................................................
                </div>
                <div className="disp-note-line">
                  ......................................................................
                </div>
              </div>
            </td>
            <td className="disp-kolom ttd">
              <DispBox label={s.instansi} tinggi="12mm" />
              <DispBox label="Staf PPTK" tinggi="12mm" />
              <DispBox nama={pphp?.nama} label="PJPHP/PPHP" tinggi="16mm" />
              <DispBox nama={pptk?.nama} label="Pejabat Pelaksana Teknis Kegiatan (PPTK)" tinggi="16mm" />
              <DispBox label="Pejabat Pembuat Komitmen (PPK)" tinggi="14mm" />
              <div className="disp-dua">
                <DispBox
                  nama={kpa?.nama}
                  label="Kuasa Pengguna Anggaran (KPA)"
                  tinggi="20mm"
                />
                <DispBox nama={verifikator?.nama} label="Verifikasi" tinggi="20mm" />
              </div>
              <div className="disp-dua">
                <DispBox nama={bpp?.nama} label="Bendahara Pengeluaran Pembantu" tinggi="20mm" />
                <DispBox nama={bp?.nama} label="Bendahara Pengeluaran" tinggi="20mm" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="disp-catatan">
        <b>CATATAN :</b>
        <div className="disp-garis" />
        <div className="disp-garis" />
      </div>
    </div>
  );
}
