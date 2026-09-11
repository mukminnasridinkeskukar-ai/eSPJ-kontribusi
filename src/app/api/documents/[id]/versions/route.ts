import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/versions — riwayat versi (metadata saja)
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const items = await db.spjDocVersion.findMany({
      where: { docId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, author: true, title: true, createdAt: true },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat riwayat versi" }, { status: 500 });
  }
}

// POST /api/documents/[id]/versions — buat snapshot versi dari isi dokumen saat ini
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const doc = await db.spjDoc.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    const item = await db.spjDocVersion.create({
      data: {
        docId: id,
        title: doc.title,
        content: doc.content,
        headerHtml: doc.headerHtml,
        headerFirst: doc.headerFirst,
        footerHtml: doc.footerHtml,
        footerFirst: doc.footerFirst,
        settings: doc.settings,
        label: typeof body.label === "string" && body.label ? body.label : "Manual",
        author: typeof body.author === "string" && body.author ? body.author : "Pengguna",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat versi" }, { status: 500 });
  }
}
