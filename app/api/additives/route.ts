import { sql } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await sql`SELECT * FROM additives ORDER BY name ASC`;
  return NextResponse.json(rows);
}