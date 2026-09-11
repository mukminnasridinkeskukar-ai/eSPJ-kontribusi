"use client";

// Formulir Data Pelatihan — replika sheet "Data Pelatihan" sebagai form input
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import type { Kegiatan, Participant } from "@/lib/espj-types";
import {
  terbilang,
  fmtRupiah,
  terhitung,
  kalimatTanggal,
  hitungPPh23,
  templateUraianPembayaran,
  normTgl,
} from "@/lib/espj";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Kegiatan | null;
  onSaved: (k: Kegiatan) => void;
};

const emptyParticipant = (): Participant => ({
  nama: "",
  jabatan: "",
  nip: "",
  pangkat: "",
  npwp: "",
  noRekening: "",
  pemilikRekening: "",
  jumlah: 0,
  keterangan: "Bankaltimtara",
  urutan: 0,
});

function F({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function KegiatanForm({ open, onOpenChange, initial, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("kegiatan");
  const [f, setF] = useState<Kegiatan>(
    initial ?? {
      id: "",
      no: 0,
      namaDirektur: "",
      vendor: "",
      jabatanVendor: "",
      alamatVendor: "",
      cpVendor: "",
      namaKegiatan: "",
      dasarSurat: "",
      noSuratPenawaran: "",
      tglSuratPenawaran: "",
      tglMulai: "",
      tglSelesai: "",
      metode: "Klasikal",
      tempat: "",
      noInvoice: "",
      tglInvoice: "",
      noRekening: "",
      namaBank: "",
      pemilikRekening: "",
      noBAP: "",
      tglBAP: "",
      noBAST: "",
      tglBAST: "",
      noBABayar: "",
      tglBABayar: "",
      noBAMaterai: "",
      tglBAMaterai: "",
      jumlahPeserta: 0,
      biayaSatuan: 0,
      peserta: "",
      uraianPembayaran: "",
      ppn: 0,
      pph23: 0,
      sumberDana: "",
      noSPPA: "",
      participants: [],
    }
  );

  const set = (k: keyof Kegiatan, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const jumlahBiaya = (f.jumlahPeserta || 0) * (f.biayaSatuan || 0);
  const pph23Auto = useMemo(() => hitungPPh23(jumlahBiaya), [jumlahBiaya]);
  const pph23Shown = f.pph23 > 0 ? f.pph23 : pph23Auto;
  const uraianAuto = useMemo(
    () =>
      templateUraianPembayaran({
        namaKegiatan: f.namaKegiatan,
        tglMulai: f.tglMulai,
        tglSelesai: f.tglSelesai,
        metode: f.metode,
        tempat: f.tempat,
        peserta: f.peserta,
      }),
    [f.namaKegiatan, f.tglMulai, f.tglSelesai, f.metode, f.tempat, f.peserta]
  );

  const simpan = async () => {
    if (!f.namaKegiatan.trim() || !f.vendor.trim()) {
      toast({
        title: "Data belum lengkap",
        description: "Nama Kegiatan dan Vendor wajib diisi.",
        variant: "destructive",
      });
      setTab("kegiatan");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...f, pph23: pph23Shown };
      const res = await fetch(f.id ? `/api/kegiatan/${f.id}` : "/api/kegiatan", {
        method: f.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = (await res.json()) as Kegiatan;
      toast({ title: "Tersimpan", description: `Kegiatan "${saved.namaKegiatan.slice(0, 60)}..." berhasil disimpan.` });
      onSaved(saved);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Gagal menyimpan", description: "Terjadi kesalahan saat menyimpan data.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updP = (i: number, key: keyof Participant, v: unknown) => {
    const arr = [...(f.participants ?? [])];
    arr[i] = { ...arr[i], [key]: v };
    set("participants", arr);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {f.id ? "Ubah Data Pelatihan" : "Tambah Data Pelatihan"}
          </DialogTitle>
          <DialogDescription>
            Formulir ini menggantikan sheet &quot;Data Pelatihan&quot;. Seluruh dokumen SPJ akan
            terisi otomatis dari data di sini.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full max-w-full flex-nowrap overflow-x-auto justify-start">
            <TabsTrigger value="kegiatan" className="whitespace-nowrap">1. Kegiatan</TabsTrigger>
            <TabsTrigger value="vendor" className="whitespace-nowrap">2. Vendor</TabsTrigger>
            <TabsTrigger value="invoice" className="whitespace-nowrap">3. Invoice &amp; Rekening</TabsTrigger>
            <TabsTrigger value="ba" className="whitespace-nowrap">4. Berita Acara</TabsTrigger>
            <TabsTrigger value="nilai" className="whitespace-nowrap">5. Nilai &amp; Pajak</TabsTrigger>
            <TabsTrigger value="peserta" className="whitespace-nowrap">6. Peserta Penggantian</TabsTrigger>
          </TabsList>

          {/* 1. KEGIATAN */}
          <TabsContent value="kegiatan" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <F label="Nama Kegiatan / Pelatihan *">
              <Textarea
                className="min-h-[70px]"
                value={f.namaKegiatan}
                onChange={(e) => set("namaKegiatan", e.target.value)}
                placeholder="Pelatihan ..."
              />
            </F>
            <F label="Dasar Surat">
              <Textarea
                className="min-h-[70px]"
                value={f.dasarSurat}
                onChange={(e) => set("dasarSurat", e.target.value)}
                placeholder="Surat Penawaran Program Pelatihan Nomor : ..."
              />
            </F>
            <F label="Nomor Surat Penawaran">
              <Input value={f.noSuratPenawaran} onChange={(e) => set("noSuratPenawaran", e.target.value)} />
            </F>
            <F label="Tanggal Surat Penawaran">
              <Input
                type="date"
                value={f.tglSuratPenawaran}
                onChange={(e) => set("tglSuratPenawaran", e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{normTgl(f.tglSuratPenawaran) || "—"}</p>
            </F>
            <F label="Tanggal Mulai">
              <Input type="date" value={f.tglMulai} onChange={(e) => set("tglMulai", e.target.value)} />
              <p className="text-[11px] text-muted-foreground">{normTgl(f.tglMulai) || "—"}</p>
            </F>
            <F label="Tanggal Selesai">
              <Input type="date" value={f.tglSelesai} onChange={(e) => set("tglSelesai", e.target.value)} />
              <p className="text-[11px] text-muted-foreground">{normTgl(f.tglSelesai) || "—"}</p>
            </F>
            <F label="Metode">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={f.metode}
                onChange={(e) => set("metode", e.target.value)}
              >
                <option>Klasikal</option>
                <option>Blended Learning</option>
                <option>e-Learning</option>
              </select>
            </F>
            <F label="Tempat Pelaksanaan">
              <Input value={f.tempat} onChange={(e) => set("tempat", e.target.value)} placeholder="Hotel / Bapelkes ..." />
            </F>
            <F label="Sumber Dana">
              <Input value={f.sumberDana} onChange={(e) => set("sumberDana", e.target.value)} />
            </F>
            <F label="Nomor SP PA">
              <Input value={f.noSPPA} onChange={(e) => set("noSPPA", e.target.value)} />
            </F>
          </TabsContent>

          {/* 2. VENDOR */}
          <TabsContent value="vendor" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <F label="Nama Direktur / Pimpinan">
              <Input value={f.namaDirektur} onChange={(e) => set("namaDirektur", e.target.value)} />
            </F>
            <F label="Pelaksana / Pihak Ke-3 / Vendor">
              <Input value={f.vendor} onChange={(e) => set("vendor", e.target.value)} />
            </F>
            <F label="Jabatan (kontak vendor)">
              <Input value={f.jabatanVendor} onChange={(e) => set("jabatanVendor", e.target.value)} />
            </F>
            <F label="Contact Person">
              <Input value={f.cpVendor} onChange={(e) => set("cpVendor", e.target.value)} />
            </F>
            <F label="Alamat" hint="Digunakan pada seluruh dokumen sebagai alamat Pihak Kedua.">
              <Textarea className="min-h-[70px]" value={f.alamatVendor} onChange={(e) => set("alamatVendor", e.target.value)} />
            </F>
          </TabsContent>

          {/* 3. INVOICE & REKENING */}
          <TabsContent value="invoice" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <F label="Nomor Invoice">
              <Input value={f.noInvoice} onChange={(e) => set("noInvoice", e.target.value)} />
            </F>
            <F label="Tanggal Invoice">
              <Input type="date" value={f.tglInvoice} onChange={(e) => set("tglInvoice", e.target.value)} />
            </F>
            <F label="Nomor Rekening">
              <Input value={f.noRekening} onChange={(e) => set("noRekening", e.target.value)} />
            </F>
            <F label="Nama Bank">
              <Input value={f.namaBank} onChange={(e) => set("namaBank", e.target.value)} />
            </F>
            <F label="Nama Pemilik Rekening">
              <Input value={f.pemilikRekening} onChange={(e) => set("pemilikRekening", e.target.value)} />
            </F>
          </TabsContent>

          {/* 4. BERITA ACARA */}
          <TabsContent value="ba" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {(
              [
                ["BAP", "BA Pemeriksaan Pekerjaan"],
                ["BAST", "BA Serah Terima Pekerjaan"],
                ["BABayar", "BA Pembayaran"],
                ["BAMaterai", "BA Pembayaran Bermaterai"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="space-y-2 rounded-lg border p-3">
                <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                <Input
                  placeholder={`Nomor ${label}`}
                  value={f[`no${k}` as keyof Kegiatan] as string}
                  onChange={(e) => set(`no${k}` as keyof Kegiatan, e.target.value)}
                />
                <Input
                  type="date"
                  value={f[`tgl${k}` as keyof Kegiatan] as string}
                  onChange={(e) => set(`tgl${k}` as keyof Kegiatan, e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground italic">
                  Kalimat otomatis: {kalimatTanggal(f[`tgl${k}` as keyof Kegiatan] as string) || "—"}
                </p>
              </div>
            ))}
            <p className="md:col-span-2 text-[11px] text-muted-foreground">
              Kosongkan tanggal bila berita acara belum terbit — dokumen akan menampilkan titik-titik
              isian. Nomor dapat diisi bertahap
              (mis. &quot;B-&nbsp;&nbsp;&nbsp;&nbsp;/DINKES/SDK-SDMK/400.3.8.3/9/2026&quot;).
            </p>
          </TabsContent>

          {/* 5. NILAI & PAJAK */}
          <TabsContent value="nilai" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <F label="Jumlah Peserta">
              <Input
                type="number"
                min={0}
                value={f.jumlahPeserta}
                onChange={(e) => set("jumlahPeserta", Number(e.target.value))}
              />
            </F>
            <F label="Biaya Satuan (Rp)">
              <Input
                type="number"
                min={0}
                value={f.biayaSatuan}
                onChange={(e) => set("biayaSatuan", Number(e.target.value))}
              />
            </F>
            <F label="Jumlah Biaya (otomatis)">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-semibold">
                {fmtRupiah(jumlahBiaya)}
              </div>
            </F>
            <F label="Terbilang (otomatis)">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {terhitung(jumlahBiaya)}
              </div>
            </F>
            <F label="Peserta / an. (nama penerima kontribusi)">
              <Input value={f.peserta} onChange={(e) => set("peserta", e.target.value)} />
            </F>
            <F label="PPn (Rp)">
              <Input type="number" min={0} value={f.ppn} onChange={(e) => set("ppn", Number(e.target.value))} />
            </F>
            <F label={`PPh 23 (otomatis ${fmtRupiah(pph23Auto)} bila dikosongkan)`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={f.pph23}
                placeholder={String(pph23Auto)}
                onChange={(e) => set("pph23", Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">
                Kosongkan/0 untuk otomatis: {fmtRupiah(pph23Auto)}
              </p>
            </F>
            <F
              label="Uraian Pembayaran / Kwitansi"
              hint="Dikosongkan akan dibuat otomatis dari template resmi."
            >
              <Textarea
                className="min-h-[80px]"
                value={f.uraianPembayaran}
                onChange={(e) => set("uraianPembayaran", e.target.value)}
                placeholder={uraianAuto}
              />
            </F>
            <div className="md:col-span-2 rounded-md border bg-muted/30 px-3 py-2 text-[12px] leading-relaxed">
              <b>Pratinjau uraian otomatis:</b> {uraianAuto}
              <br />
              <b>Terbilang:</b> {terbilang(jumlahBiaya)} Rupiah
            </div>
          </TabsContent>

          {/* 6. PESERTA PENGGANTIAN */}
          <TabsContent value="peserta" className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Daftar peserta penerima penggantian biaya kontribusi bimtek — digunakan pada dokumen
              &quot;Daftar Pembayaran Penggantian Uang&quot;.
            </p>
            <div className="space-y-3">
              {(f.participants ?? []).map((p, i) => (
                <div key={i} className="rounded-lg border p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F label="Nama">
                    <Input value={p.nama} onChange={(e) => updP(i, "nama", e.target.value)} />
                  </F>
                  <F label="Jabatan">
                    <Input value={p.jabatan} onChange={(e) => updP(i, "jabatan", e.target.value)} />
                  </F>
                  <F label="NIP">
                    <Input value={p.nip} onChange={(e) => updP(i, "nip", e.target.value)} />
                  </F>
                  <F label="Pangkat/Golongan">
                    <Input value={p.pangkat} onChange={(e) => updP(i, "pangkat", e.target.value)} />
                  </F>
                  <F label="NPWP">
                    <Input value={p.npwp} onChange={(e) => updP(i, "npwp", e.target.value)} />
                  </F>
                  <F label="Nomor Rekening">
                    <Input value={p.noRekening} onChange={(e) => updP(i, "noRekening", e.target.value)} />
                  </F>
                  <F label="Nama Pemilik Rekening">
                    <Input value={p.pemilikRekening} onChange={(e) => updP(i, "pemilikRekening", e.target.value)} />
                  </F>
                  <F label="Jumlah Ditransfer">
                    <Input
                      type="number"
                      value={p.jumlah}
                      onChange={(e) => updP(i, "jumlah", Number(e.target.value))}
                    />
                  </F>
                  <F label="Keterangan (Bank)">
                    <Input value={p.keterangan} onChange={(e) => updP(i, "keterangan", e.target.value)} />
                  </F>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        set(
                          "participants",
                          (f.participants ?? []).filter((_, j) => j !== i)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => set("participants", [...(f.participants ?? []), emptyParticipant()])}
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Peserta
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={simpan} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
