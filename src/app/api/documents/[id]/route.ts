import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/documents/[id] — dokumen lengkap
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const item = await db.spjDoc.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          select: { id: true, label: true, author: true, createdAt: true, title: true },
        },
      },
    });
    if (!item) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat dokumen" }, { status: 500 });
  }
}

// PUT /api/documents/[id] — simpan perubahan (auto-save & manual)
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, string> = {};
    for (const f of ["title", "content", "headerHtml", "headerFirst", "footerHtml", "footerFirst", "settings"] as const) {
      if (typeof body[f] === "string") data[f] = body[f];
    }
    const item = await db.spjDoc.update({ where: { id }, data });
    return NextResponse.json({ ok: true, updatedAt: item.updatedAt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan dokumen" }, { status: 500 });
  }
}

// DELETE /api/documents/[id] — hapus dokumen (versi ikut terhapus via cascade)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await db.spjDoc.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus dokumen" }, { status: 500 });
  }
}
