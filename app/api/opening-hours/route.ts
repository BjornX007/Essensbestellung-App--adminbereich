// app/api/opening-hours/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

/** GET /api/opening-hours
 *  Seeds all 7 days with null times if they don't exist yet, returns them Mon→Sun.
 */
export async function GET() {
  try {
    await sql`
      INSERT INTO opening_hours (day_of_week, is_closed)
      VALUES (0, false),(1, false),(2, false),(3, false),(4, false),(5, false),(6, false)
      ON CONFLICT (day_of_week) DO NOTHING
    `;

    const rows = await sql`
      SELECT * FROM opening_hours ORDER BY day_of_week ASC
    `;

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load opening hours" }, { status: 500 });
  }
}