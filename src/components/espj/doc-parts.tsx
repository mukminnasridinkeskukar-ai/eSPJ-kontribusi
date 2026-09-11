"use client";

// Komponen bersama untuk dokumen SPJ (kop surat, blok TTD, materai, dsb.)
import Image from "next/image";
import type { Pengaturan } from "@/lib/espj-types";
import type { DocData } from "./doc-data";

export function KopSurat({ s }: { s: Pengaturan }) {
  return (
    <div className="kop">
      <div className="kop-logo">
        <Image
          src="/logo-kukar.png"
          alt="Logo Kabupaten Kutai Kartanegara"
          width={86}
          height={98}
          priority
          className="h-auto w-auto"
        />
      </div>
      <div className="kop-teks">
        <div className="kop-pemda">{s.pemerintah}</div>
        <div className="kop-instansi">{s.instansi}</div>
        <div className="kop-alamat">{s.alamat1}</div>
        <div className="kop-alamat">{s.alamat2}</div>
        <div className="kop-laman">{s.laman}</div>
      </div>
    </div>
  );
}

export function Judul({ baris }: { baris: string[] }) {
  return (
    <div className="doc-judul">
      {baris.map((b, i) => (
        <div key={i}>{b}</div>
      ))}
    </div>
  );
}

export function Nomor({ text }: { text: string }) {
  return <div className="doc-nomor">{text}</div>;
}

export function Materai({ label = "materai" }: { label?: string }) {
  return (
    <div className="materai-box">
      <span>{label}</span>
    </div>
  );
}

export function TtdPihak({
  peran,
  jabatan,
  materai = false,
  nama,
  nip,
}: {
  peran: string;
  jabatan?: string;
  materai?: boolean;
  nama: string;
  nip?: string;
}) {
  return (
    <div className="ttd-col">
      {peran ? <div className="ttd-peran">{peran}</div> : null}
      {jabatan ? <div>{jabatan}</div> : null}
      {materai ? <Materai /> : null}
      <div className="ttd-ruang" />
      <div className="ttd-nama">{nama}</div>
      {nip ? <div>NIP. {nip}</div> : null}
    </div>
  );
}

export function TtdKanan({ children }: { children: React.ReactNode }) {
  return <div className="ttd-row">{children}</div>;
}

/** Label sel tabel potongan pajak Bukti Pengeluaran */
export function PotonganRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="potongan-row">
      <div className={bold ? "potongan-label bold" : "potongan-label"}>{label}</div>
      <div className="potongan-rp">Rp</div>
      <div className={bold ? "potongan-val bold" : "potongan-val"}>{value}</div>
      <div>,-</div>
    </div>
  );
}

export type { DocData };
