// app/api/categories/route.ts
import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const GET = withSecurity(async () => {
  const rows = await sql`
    SELECT * FROM categories ORDER BY sort_order ASC, name ASC
  `;
  return NextResponse.json(rows);
});

export const POST = withSecurity(async (req) => {
  let body: {
    name: string; slug?: string; description?: string;
    image_url?: string; sort_order?: number; is_visible?: boolean;
  };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.name?.trim()) return err("name is required");

  const slug = body.slug?.trim() || slugify(body.name);

  const rows = await sql`
    INSERT INTO categories (name, slug, description, image_url, sort_order, is_visible)
    VALUES (
      ${body.name}, ${slug}, ${body.description ?? null},
      ${body.image_url ?? null}, ${body.sort_order ?? 0}, ${body.is_visible ?? true}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});