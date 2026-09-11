import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/pengaturan
export async function GET() {
  try {
    let s = await db.pengaturan.findUnique({ where: { id: "utama" } });
    if (!s) s = await db.pengaturan.create({ data: { id: "utama" } });
    return NextResponse.json(s);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

// PUT /api/pengaturan
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    delete body.id;
    const s = await db.pengaturan.upsert({
      where: { id: "utama" },
      update: body,
      create: { id: "utama", ...body },
    });
    return NextResponse.json(s);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
