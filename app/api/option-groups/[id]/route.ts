// app/api/categories/[id]/option-groups/route.ts
//
// GET  /api/categories/:id/option-groups
//   → All option groups (with values) assigned to this category.
//
// PUT  /api/categories/:id/option-groups
//   Body: { group_ids: string[] }
//   → Atomically replaces the category's group assignments.
//     Groups not in group_ids are unlinked but NOT deleted globally.

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const rows = await sql.query(
      `SELECT
         og.id,
         og.name,
         og.selection_type,
         og.is_required,
         og.sort_order,
         COALESCE(
           json_agg(
             json_build_object(
               'id',          ov.id,
               'label',       ov.label,
               'price_delta', ov.price_delta,
               'is_default',  ov.is_default
             ) ORDER BY ov.is_default DESC, ov.label
           ) FILTER (WHERE ov.id IS NOT NULL),
           '[]'
         ) AS values
       FROM option_groups og
       JOIN category_option_groups cog
         ON cog.option_group_id = og.id
        AND cog.category_id     = $1
       LEFT JOIN option_values ov
         ON ov.option_group_id = og.id
       GROUP BY og.id, og.name, og.selection_type, og.is_required,
                og.sort_order, cog.sort_order
       ORDER BY cog.sort_order, og.sort_order`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/categories/[id]/option-groups failed:", e);
    return NextResponse.json(
      { error: "Failed to fetch option groups" },
      { status: 500 }
    );
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const { group_ids } = body;

  if (!Array.isArray(group_ids)) {
    return NextResponse.json(
      { error: "group_ids must be an array" },
      { status: 400 }
    );
  }

  await sql.query("BEGIN");
  try {
    // Remove all current assignments for this category
    await sql.query(
      `DELETE FROM category_option_groups WHERE category_id = $1`,
      [id]
    );

    // Insert only the groups the user explicitly selected, preserving order
    for (let i = 0; i < group_ids.length; i++) {
      await sql.query(
        `INSERT INTO category_option_groups (category_id, option_group_id, sort_order)
         VALUES ($1, $2, $3)`,
        [id, group_ids[i], i]
      );
    }

    await sql.query("COMMIT");

    // Return the updated assignment list (same shape as GET)
    const rows = await sql.query(
      `SELECT
         og.id,
         og.name,
         og.selection_type,
         og.is_required,
         og.sort_order,
         COALESCE(
           json_agg(
             json_build_object(
               'id',          ov.id,
               'label',       ov.label,
               'price_delta', ov.price_delta,
               'is_default',  ov.is_default
             ) ORDER BY ov.is_default DESC, ov.label
           ) FILTER (WHERE ov.id IS NOT NULL),
           '[]'
         ) AS values
       FROM option_groups og
       JOIN category_option_groups cog
         ON cog.option_group_id = og.id
        AND cog.category_id     = $1
       LEFT JOIN option_values ov
         ON ov.option_group_id = og.id
       GROUP BY og.id, og.name, og.selection_type, og.is_required,
                og.sort_order, cog.sort_order
       ORDER BY cog.sort_order, og.sort_order`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (e) {
    await sql.query("ROLLBACK");
    console.error("PUT /api/categories/[id]/option-groups failed:", e);
    return NextResponse.json(
      { error: "Failed to update option groups" },
      { status: 500 }
    );
  }
}