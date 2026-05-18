import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

async function getGroupWithValues(id: string) {
  const rows = await sql.query(
    `SELECT og.*,
       COALESCE(json_agg(
         json_build_object(
           'id', ov.id, 'label', ov.label,
           'price_delta', ov.price_delta, 'is_default', ov.is_default
         ) ORDER BY ov.is_default DESC, ov.label
       ) FILTER (WHERE ov.id IS NOT NULL), '[]') AS values
     FROM option_groups og
     LEFT JOIN option_values ov ON ov.option_group_id = og.id
     WHERE og.id = $1
     GROUP BY og.id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function GET() {
  const rows = await sql.query(
    `SELECT og.*,
       COALESCE(json_agg(
         json_build_object(
           'id', ov.id, 'label', ov.label,
           'price_delta', ov.price_delta, 'is_default', ov.is_default
         ) ORDER BY ov.is_default DESC, ov.label
       ) FILTER (WHERE ov.id IS NOT NULL), '[]') AS values
     FROM option_groups og
     LEFT JOIN option_values ov ON ov.option_group_id = og.id
     GROUP BY og.id
     ORDER BY og.sort_order, og.name`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, selection_type = "multi", is_required = false, sort_order = 0, values = [] } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  await sql.query("BEGIN");
  try {
    const [group] = await sql.query(
      `INSERT INTO option_groups (name, selection_type, is_required, sort_order)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name.trim(), selection_type, is_required, sort_order]
    );

    for (const v of values) {
      await sql.query(
        `INSERT INTO option_values (option_group_id, label, price_delta, is_default)
         VALUES ($1,$2,$3,$4)`,
        [group.id, v.label?.trim() || "", v.price_delta ?? 0, v.is_default ?? false]
      );
    }

    await sql.query("COMMIT");
    const full = await getGroupWithValues(group.id);
    return NextResponse.json(full, { status: 201 });
  } catch (e) {
    await sql.query("ROLLBACK");
    console.error("POST /api/option-groups failed:", e);
    return NextResponse.json({ error: "Failed to create option group" }, { status: 500 });
  }
}