import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/restore — pulihkan isi dari sebuah versi.
// Keadaan sekarang disimpan dulu sebagai versi "Sebelum pemulihan" agar tidak ada
// data hilang; versi lama tidak pernah dihapus otomatis.
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { versionId } = await req.json();
    if (!versionId) return NextResponse.json({ error: "versionId wajib diisi" }, { status: 400 });

    const doc = await db.spjDoc.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    const ver = await db.spjDocVersion.findUnique({ where: { id: versionId } });
    if (!ver || ver.docId !== id)
      return NextResponse.json({ error: "Versi tidak ditemukan" }, { status: 404 });

    // 1) Backup keadaan sekarang
    await db.spjDocVersion.create({
      data: {
        docId: id,
        title: doc.title,
        content: doc.content,
        headerHtml: doc.headerHtml,
        headerFirst: doc.headerFirst,
        footerHtml: doc.footerHtml,
        footerFirst: doc.footerFirst,
        settings: doc.settings,
        label: "Sebelum pemulihan",
        author: "Pengguna",
      },
    });
    // 2) Pulihkan isi versi terpilih
    const restored = await db.spjDoc.update({
      where: { id },
      data: {
        title: ver.title,
        content: ver.content,
        headerHtml: ver.headerHtml,
        headerFirst: ver.headerFirst,
        footerHtml: ver.footerHtml,
        footerFirst: ver.footerFirst,
        settings: ver.settings,
      },
    });
    return NextResponse.json({ ok: true, doc: restored });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memulihkan versi" }, { status: 500 });
  }
}
