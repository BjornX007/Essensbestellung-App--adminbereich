// app/api/categories/[id]/option-groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

type Ctx = { params: Promise<{ id: string }> };

const OPTION_GROUPS_QUERY = `
  SELECT
    og.*,
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
   AND cog.category_id = $1
  LEFT JOIN option_values ov
    ON ov.option_group_id = og.id
  GROUP BY og.id, cog.sort_order
  ORDER BY cog.sort_order, og.name
`;

export const GET = withSecurity(async (_req, ctx) => {
  const { id } = await (ctx as Ctx).params;
  try {
    const rows = await sql.query(OPTION_GROUPS_QUERY, [id]);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/categories/[id]/option-groups failed:", e);
    return NextResponse.json({ error: "Failed to fetch option groups" }, { status: 500 });
  }
});

export const PUT = withSecurity(async (req, ctx) => {
  const { id } = await (ctx as Ctx).params;

  const body = await req.json().catch(() => ({}));
  const { group_ids } = body;

  if (!Array.isArray(group_ids)) {
    return NextResponse.json({ error: "group_ids must be an array" }, { status: 400 });
  }

  await sql.query("BEGIN");
  try {
    await sql.query(`DELETE FROM category_option_groups WHERE category_id = $1`, [id]);

    for (let i = 0; i < group_ids.length; i++) {
      await sql.query(
        `INSERT INTO category_option_groups (category_id, option_group_id, sort_order)
         VALUES ($1, $2, $3)`,
        [id, group_ids[i], i]
      );
    }

    await sql.query("COMMIT");

    const rows = await sql.query(OPTION_GROUPS_QUERY, [id]);
    return NextResponse.json(rows);
  } catch (e) {
    await sql.query("ROLLBACK");
    console.error("PUT /api/categories/[id]/option-groups failed:", e);
    return NextResponse.json({ error: "Failed to update option groups" }, { status: 500 });
  }
});