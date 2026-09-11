"use client";

// Dashboard + Data Pelatihan (daftar) + Pengaturan/Pejabat
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  FileStack,
  Wallet,
  Users,
  Percent,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import type { Kegiatan, Pejabat, Pengaturan } from "@/lib/espj-types";
import { PEJABAT_LABEL } from "@/lib/espj-types";
import { fmtRupiah, fmtNum, hitungPPh23, normTgl } from "@/lib/espj";
import KegiatanForm from "./KegiatanForm";

/* ================= DASHBOARD ================= */
export function DashboardView({
  kegiatan,
  onBukaDokumen,
  onEdit,
}: {
  kegiatan: Kegiatan[];
  onBukaDokumen: () => void;
  onEdit: (k: Kegiatan) => void;
}) {
  const totalNilai = kegiatan.reduce((a, k) => a + k.jumlahPeserta * k.biayaSatuan, 0);
  const totalPeserta = kegiatan.reduce((a, k) => a + k.jumlahPeserta, 0);
  const totalPph = kegiatan.reduce(
    (a, k) => a + (k.pph23 > 0 ? k.pph23 : hitungPPh23(k.jumlahPeserta * k.biayaSatuan)),
    0
  );
  const lengkap = kegiatan.filter(
    (k) => k.noBAP && k.noBAST && k.noBABayar && k.noBAMaterai && k.tglBAP && k.tglBAST
  ).length;

  const statistik = [
    { label: "Kegiatan Pelatihan", value: String(kegiatan.length), icon: FileStack },
    { label: "Total Nilai Kontribusi", value: fmtRupiah(totalNilai), icon: Wallet },
    { label: "Jumlah Peserta", value: `${fmtNum(totalPeserta)} orang`, icon: Users },
    { label: "Total PPh 23", value: fmtRupiah(totalPph), icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statistik.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl bg-emerald-100 text-emerald-700 p-3">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-lg font-bold truncate">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Data Pelatihan Terkini</CardTitle>
          <Button size="sm" onClick={onBukaDokumen}>
            <LayoutDashboard className="h-4 w-4 mr-2" /> Buka Dokumen SPJ
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead className="min-w-[280px]">Kegiatan</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead>Kelengkapan BA</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {kegiatan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada data pelatihan.
                  </TableCell>
                </TableRow>
              ) : (
                kegiatan.map((k) => {
                  const baLengkap =
                    k.noBAP && k.noBAST && k.noBABayar && k.noBAMaterai && k.tglBAP && k.tglBAST;
                  return (
                    <TableRow key={k.id}>
                      <TableCell>{k.no}</TableCell>
                      <TableCell className="max-w-[360px]">
                        <div className="truncate font-medium" title={k.namaKegiatan}>
                          {k.namaKegiatan}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {k.metode} • {k.tempat}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{k.vendor}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {normTgl(k.tglMulai)} — {normTgl(k.tglSelesai)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {fmtRupiah(k.jumlahPeserta * k.biayaSatuan)}
                      </TableCell>
                      <TableCell>
                        {baLengkap ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Lengkap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <AlertCircle className="h-3 w-3 mr-1" /> Proses
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(k)} title="Ubah">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= DAFTAR DATA PELATIHAN ================= */
export function DataListView({
  kegiatan,
  onEdit,
  onTambah,
  onDeleted,
}: {
  kegiatan: Kegiatan[];
  onEdit: (k: Kegiatan) => void;
  onTambah: () => void;
  onDeleted: (id: string) => void;
}) {
  const { toast } = useToast();
  const [hapus, setHapus] = useState<Kegiatan | null>(null);

  const doHapus = async () => {
    if (!hapus) return;
    try {
      const res = await fetch(`/api/kegiatan/${hapus.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Terhapus", description: "Data kegiatan berhasil dihapus." });
      onDeleted(hapus.id);
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    } finally {
      setHapus(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Data Pelatihan</h2>
          <p className="text-xs text-muted-foreground">
            Formulir induk — sheet &quot;Data Pelatihan&quot; pada file Excel.
          </p>
        </div>
        <Button onClick={onTambah}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Kegiatan
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead className="min-w-[260px]">Kegiatan</TableHead>
                <TableHead>Vendor / Pihak Ke-3</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {kegiatan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada data. Klik &quot;Tambah Kegiatan&quot; untuk mulai mengisi formulir.
                  </TableCell>
                </TableRow>
              ) : (
                kegiatan.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>{k.no}</TableCell>
                    <TableCell className="max-w-[340px]">
                      <div className="truncate font-medium" title={k.namaKegiatan}>
                        {k.namaKegiatan}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {normTgl(k.tglMulai)} s/d {normTgl(k.tglSelesai)} • {k.metode}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{k.vendor}</div>
                      <div className="text-muted-foreground">{k.namaDirektur}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {k.noInvoice || "-"}
                      <div className="text-muted-foreground">{normTgl(k.tglInvoice)}</div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {fmtRupiah(k.jumlahPeserta * k.biayaSatuan)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(k)} title="Ubah">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setHapus(k)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hapus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHapus(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Hapus kegiatan?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              &quot;{hapus.namaKegiatan.slice(0, 80)}...&quot; beserta daftar peserta penggantiannya akan
              dihapus permanen.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHapus(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={doHapus}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ================= PENGATURAN & PEJABAT ================= */
export function PengaturanView({
  pengaturan,
  pejabat,
  onReload,
}: {
  pengaturan: Pengaturan | null;
  pejabat: Pejabat[];
  onReload: () => void;
}) {
  const { toast } = useToast();
  const [s, setS] = useState<Pengaturan | null>(pengaturan);
  const [pj, setPj] = useState<Pejabat[]>(pejabat);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Pengaturan, v: string) => setS((p) => (p ? { ...p, [k]: v } : p));
  const setPjF = (i: number, k: keyof Pejabat, v: string) =>
    setPj((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const simpan = async () => {
    if (!s) return;
    setSaving(true);
    try {
      await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      await fetch("/api/pejabat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: pj }),
      });
      toast({ title: "Tersimpan", description: "Pengaturan & pejabat berhasil diperbarui." });
      onReload();
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!s) return <p className="text-sm text-muted-foreground">Memuat pengaturan…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Pejabat &amp; Pengaturan</h2>
          <p className="text-xs text-muted-foreground">
            Identitas instansi, program/kegiatan, dan pejabat pengelola — dipakai seluruh dokumen.
          </p>
        </div>
        <Button onClick={simpan} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> Simpan Semua
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identitas Instansi (Kop Surat)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="Pemerintah">
              <Input value={s.pemerintah} onChange={(e) => set("pemerintah", e.target.value)} />
            </F>
            <F label="Instansi">
              <Input value={s.instansi} onChange={(e) => set("instansi", e.target.value)} />
            </F>
            <F label="Alamat Baris 1">
              <Input value={s.alamat1} onChange={(e) => set("alamat1", e.target.value)} />
            </F>
            <F label="Alamat Baris 2">
              <Input value={s.alamat2} onChange={(e) => set("alamat2", e.target.value)} />
            </F>
            <F label="Laman / Pos-el">
              <Input value={s.laman} onChange={(e) => set("laman", e.target.value)} />
            </F>
            <F label="Kota Tanda Tangan">
              <Input value={s.kotaTtd} onChange={(e) => set("kotaTtd", e.target.value)} />
            </F>
            <F label="Tahun Anggaran">
              <Input value={s.tahunAnggaran} onChange={(e) => set("tahunAnggaran", e.target.value)} />
            </F>
            <F label="Label Anggaran (Cover)">
              <Input value={s.anggaranLabel} onChange={(e) => set("anggaranLabel", e.target.value)} />
            </F>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Program, Kegiatan &amp; Belanja</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <F label="Program">
              <Input value={s.program} onChange={(e) => set("program", e.target.value)} />
            </F>
            <F label="Kegiatan">
              <Textarea className="min-h-[60px]" value={s.kegiatan} onChange={(e) => set("kegiatan", e.target.value)} />
            </F>
            <F label="Sub Kegiatan">
              <Textarea className="min-h-[60px]" value={s.subKegiatan} onChange={(e) => set("subKegiatan", e.target.value)} />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Jenis Pekerjaan">
                <Input value={s.pekerjaan} onChange={(e) => set("pekerjaan", e.target.value)} />
              </F>
              <F label="Sumber Dana Default">
                <Input value={s.sumberDanaDefault} onChange={(e) => set("sumberDanaDefault", e.target.value)} />
              </F>
              <F label="Kode Rekening">
                <Input value={s.kodeRekening} onChange={(e) => set("kodeRekening", e.target.value)} />
              </F>
              <F label="Uraian Kode Rekening">
                <Input value={s.uraianKodeRekening} onChange={(e) => set("uraianKodeRekening", e.target.value)} />
              </F>
              <F label="Nomor DPA">
                <Input value={s.noDPA} onChange={(e) => set("noDPA", e.target.value)} />
              </F>
              <F label="Lokasi Pekerjaan">
                <Input value={s.lokasiPekerjaan} onChange={(e) => set("lokasiPekerjaan", e.target.value)} />
              </F>
            </div>
            <F label="Dasar SK KPA (teks panjang dokumen)">
              <Textarea className="min-h-[70px]" value={s.skKPA} onChange={(e) => set("skKPA", e.target.value)} />
            </F>
            <F label="Teks Jabatan PPTK (panjang)">
              <Textarea
                className="min-h-[70px]"
                value={s.jabatanPPTKPanjang}
                onChange={(e) => set("jabatanPPTKPanjang", e.target.value)}
              />
            </F>
            <F label="Teks Jabatan KPA (panjang)">
              <Textarea
                className="min-h-[70px]"
                value={s.jabatanKPAPanjang}
                onChange={(e) => set("jabatanKPAPanjang", e.target.value)}
              />
            </F>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Pejabat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pj.map((p, i) => (
            <div key={p.kode} className="rounded-lg border p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div className="md:col-span-3">
                <Label className="text-[11px] text-muted-foreground">{PEJABAT_LABEL[p.kode] || p.kode}</Label>
                <Input className="mt-1" value={p.nama} onChange={(e) => setPjF(i, "nama", e.target.value)} placeholder="Nama" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[11px] text-muted-foreground">NIP</Label>
                <Input className="mt-1" value={p.nip} onChange={(e) => setPjF(i, "nip", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Jabatan (pendek)</Label>
                <Input className="mt-1" value={p.jabatan} onChange={(e) => setPjF(i, "jabatan", e.target.value)} />
              </div>
              <div className="md:col-span-5">
                <Label className="text-[11px] text-muted-foreground">Teks Jabatan Panjang (badan dokumen)</Label>
                <Textarea
                  className="mt-1 min-h-[42px]"
                  value={p.jabatanPanjang}
                  onChange={(e) => setPjF(i, "jabatanPanjang", e.target.value)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
