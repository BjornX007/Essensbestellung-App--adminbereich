// app/api/categories/[id]/route.ts
import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type Ctx = { params: Promise<{ id: string }> };

export const GET = withSecurity(async (_req, ctx) => {
  const { id } = await (ctx as Ctx).params;
  const rows = await sql`SELECT * FROM categories WHERE id = ${id}`;
  if (rows.length === 0) return err("Not found", 404);
  return NextResponse.json(rows[0]);
});

export const PUT = withSecurity(async (req, ctx) => {
  const { id } = await (ctx as Ctx).params;

  let body: {
    name: string; slug?: string; description?: string;
    image_url?: string; sort_order?: number; is_visible?: boolean;
  };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.name?.trim()) return err("name is required");

  const slug = body.slug?.trim() || slugify(body.name);

  const rows = await sql`
    UPDATE categories SET
      name        = ${body.name},
      slug        = ${slug},
      description = ${body.description ?? null},
      image_url   = ${body.image_url   ?? null},
      sort_order  = ${body.sort_order  ?? 0},
      is_visible  = ${body.is_visible  ?? true}
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) return err("Not found", 404);
  return NextResponse.json(rows[0]);
});

export const DELETE = withSecurity(async (_req, ctx) => {
  const { id } = await (ctx as Ctx).params;
  await sql`DELETE FROM products WHERE category_id = ${id}`;
  await sql`DELETE FROM categories WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
});