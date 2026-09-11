import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/pejabat
export async function GET() {
  try {
    const items = await db.pejabat.findMany({ orderBy: { kode: "asc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat pejabat" }, { status: 500 });
  }
}

// PUT /api/pejabat — bulk upsert { list: [{kode, nama, nip, jabatan, jabatanPanjang}] }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const list = Array.isArray(body?.list) ? body.list : [];
    for (const p of list) {
      if (!p?.kode) continue;
      await db.pejabat.upsert({
        where: { kode: p.kode },
        update: {
          nama: p.nama ?? "",
          nip: p.nip ?? "",
          jabatan: p.jabatan ?? "",
          jabatanPanjang: p.jabatanPanjang ?? "",
        },
        create: {
          kode: p.kode,
          nama: p.nama ?? "",
          nip: p.nip ?? "",
          jabatan: p.jabatan ?? "",
          jabatanPanjang: p.jabatanPanjang ?? "",
        },
      });
    }
    const items = await db.pejabat.findMany({ orderBy: { kode: "asc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan pejabat" }, { status: 500 });
  }
}
