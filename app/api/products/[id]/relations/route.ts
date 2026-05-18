import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const [allergens, additives] = await Promise.all([
    sql`SELECT allergen_id FROM product_allergens WHERE product_id = ${id}`,
    sql`SELECT additive_id FROM product_additives WHERE product_id = ${id}`,
  ]);
  return NextResponse.json({
    allergen_ids: allergens.map(r => r.allergen_id),
    additive_ids: additives.map(r => r.additive_id),
  });
}