import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

function toTime(val: unknown): string | null {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  return val.length === 5 ? `${val}:00` : val;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { open_time, close_time, is_closed } = await req.json();

    const [row] = await sql`
      UPDATE opening_hours SET
        open_time  = ${toTime(open_time)},
        close_time = ${toTime(close_time)},
        is_closed  = ${is_closed ?? false}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}