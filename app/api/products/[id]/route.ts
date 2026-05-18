// app/api/products/[id]/route.ts
import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/products/[id]
export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  if (rows.length === 0) return err("Not found", 404);
  return NextResponse.json(rows[0]);
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: {
    category_id: string; name: string; slug?: string;
    description?: string; price: number | string;
    image_url?: string; is_available?: boolean;
    is_featured?: boolean; sort_order?: number;
    allergen_ids?: string[]; additive_ids?: string[];
  };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.name?.trim()) return err("name is required");
  if (body.price === undefined || body.price === "") return err("price is required");

  const slug = body.slug?.trim() || slugify(body.name);

  const rows = await sql`
    UPDATE products SET
      category_id  = ${body.category_id},
      name         = ${body.name},
      slug         = ${slug},
      description  = ${body.description  ?? null},
      price        = ${Number(body.price)},
      image_url    = ${body.image_url    ?? null},
      is_available = ${body.is_available ?? true},
      is_featured  = ${body.is_featured  ?? false},
      sort_order   = ${body.sort_order   ?? 0}
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) return err("Not found", 404);

  // Sync allergens
  await sql`DELETE FROM product_allergens WHERE product_id = ${id}`;
  if (body.allergen_ids?.length) {
    for (const allergenId of body.allergen_ids) {
      await sql`
        INSERT INTO product_allergens (product_id, allergen_id)
        VALUES (${id}, ${allergenId})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // Sync additives
  await sql`DELETE FROM product_additives WHERE product_id = ${id}`;
  if (body.additive_ids?.length) {
    for (const additiveId of body.additive_ids) {
      await sql`
        INSERT INTO product_additives (product_id, additive_id)
        VALUES (${id}, ${additiveId})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return NextResponse.json(rows[0]);
}

// DELETE /api/products/[id]
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await sql`DELETE FROM products WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}