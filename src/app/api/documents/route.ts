import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/documents — daftar dokumen (ringan, tanpa konten)
export async function GET() {
  try {
    const items = await db.spjDoc.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        kegiatanId: true,
        docKey: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { versions: true } },
      },
    });
    return NextResponse.json(
      items.map(({ _count, ...x }) => ({ ...x, versions: _count.versions }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat daftar dokumen" }, { status: 500 });
  }
}

// POST /api/documents — buat dokumen baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id: _id, versions: _v, createdAt: _c, updatedAt: _u, ...fields } = body ?? {};
    const item = await db.spjDoc.create({
      data: {
        title: typeof fields.title === "string" && fields.title ? fields.title : "Dokumen Tanpa Judul",
        source: fields.source ?? "custom",
        kegiatanId: fields.kegiatanId ?? null,
        docKey: fields.docKey ?? null,
        content: fields.content ?? "",
        headerHtml: fields.headerHtml ?? "",
        headerFirst: fields.headerFirst ?? "",
        footerHtml: fields.footerHtml ?? "",
        footerFirst: fields.footerFirst ?? "",
        settings: fields.settings ?? "{}",
      },
    });
    // Versi awal agar riwayat selalu punya titik awal
    await db.spjDocVersion.create({
      data: {
        docId: item.id,
        title: item.title,
        content: item.content,
        headerHtml: item.headerHtml,
        headerFirst: item.headerFirst,
        footerHtml: item.footerHtml,
        footerFirst: item.footerFirst,
        settings: item.settings,
        label: "Awal",
        author: "Pengguna",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat dokumen" }, { status: 500 });
  }
}
