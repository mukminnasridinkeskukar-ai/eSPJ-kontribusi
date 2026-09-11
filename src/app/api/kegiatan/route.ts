import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/kegiatan — daftar seluruh kegiatan + peserta
export async function GET() {
  try {
    const items = await db.kegiatan.findMany({
      include: { participants: { orderBy: { urutan: "asc" } } },
      orderBy: { no: "asc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat data kegiatan" }, { status: 500 });
  }
}

// POST /api/kegiatan — tambah kegiatan baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participants, id: _ignored, createdAt, updatedAt, ...fields } = body ?? {};
    const maxNo = await db.kegiatan.aggregate({ _max: { no: true } });
    const item = await db.kegiatan.create({
      data: {
        ...fields,
        no:
          typeof fields.no === "number" && fields.no > 0
            ? fields.no
            : (maxNo._max.no ?? 0) + 1,
        participants: Array.isArray(participants)
          ? { create: participants }
          : undefined,
      },
      include: { participants: { orderBy: { urutan: "asc" } } },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menambah kegiatan" }, { status: 500 });
  }
}
