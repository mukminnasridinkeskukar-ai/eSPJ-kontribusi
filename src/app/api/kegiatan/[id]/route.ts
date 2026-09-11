import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type ParticipantInput = {
  id?: string;
  urutan?: number;
  nama?: string;
  jabatan?: string;
  nip?: string;
  pangkat?: string;
  npwp?: string;
  noRekening?: string;
  pemilikRekening?: string;
  jumlah?: number;
  keterangan?: string;
};

// GET /api/kegiatan/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await db.kegiatan.findUnique({
      where: { id },
      include: { participants: { orderBy: { urutan: "asc" } } },
    });
    if (!item) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat kegiatan" }, { status: 500 });
  }
}

// PUT /api/kegiatan/[id] — update fields + replace participants
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { participants, id: _ignored, createdAt, updatedAt, ...fields } = body ?? {};

    const data: Record<string, unknown> = { ...fields };

    if (Array.isArray(participants)) {
      data.participants = {
        deleteMany: {},
        create: (participants as ParticipantInput[]).map((p, i) => ({
          ...p,
          urutan: typeof p.urutan === "number" ? p.urutan : i + 1,
        })),
      };
    }

    const item = await db.kegiatan.update({
      where: { id },
      data,
      include: { participants: { orderBy: { urutan: "asc" } } },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan kegiatan" }, { status: 500 });
  }
}

// DELETE /api/kegiatan/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.kegiatan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus kegiatan" }, { status: 500 });
  }
}
