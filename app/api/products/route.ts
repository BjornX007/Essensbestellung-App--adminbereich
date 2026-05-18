// app/api/products/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";

function err(
  message: string,
  status = 400
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─────────────────────────────
// GET /api/products
// GET /api/products?category_id=<uuid>
// ─────────────────────────────
export const GET = withSecurity(
  async (req: NextRequest) => {
    try {
      const categoryId =
        req.nextUrl.searchParams.get(
          "category_id"
        );

      const rows = categoryId
        ? await sql`
            SELECT *
            FROM products

            WHERE category_id = ${categoryId}

            ORDER BY
              sort_order ASC,
              name ASC
          `
        : await sql`
            SELECT *
            FROM products

            ORDER BY
              sort_order ASC,
              name ASC
          `;

      return NextResponse.json(rows);

    } catch (error) {
      console.error(
        "Products GET error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch products",
        },
        {
          status: 500,
        }
      );
    }
  },
  {
    allowedMethods: ["GET"],

    rateLimit: {
      maxRequests: 120,
      windowMs: 60_000,
    },
  }
);

// ─────────────────────────────
// POST /api/products
// ─────────────────────────────
export const POST = withSecurity(
  async (req: NextRequest) => {
    try {
      let body: {
        category_id: string;
        name: string;
        slug?: string;
        description?: string;
        price: number | string;
        image_url?: string;
        is_available?: boolean;
        is_featured?: boolean;
        sort_order?: number;
      };

      try {
        body = await req.json();
      } catch {
        return err("Invalid JSON");
      }

      if (!body.category_id) {
        return err(
          "category_id is required"
        );
      }

      if (!body.name?.trim()) {
        return err(
          "name is required"
        );
      }

      if (
        body.price === undefined ||
        body.price === ""
      ) {
        return err(
          "price is required"
        );
      }

      const slug =
        body.slug?.trim() ||
        slugify(body.name);

      const rows = await sql`
        INSERT INTO products (
          category_id,
          name,
          slug,
          description,
          price,
          image_url,
          is_available,
          is_featured,
          sort_order
        )

        VALUES (
          ${body.category_id},
          ${body.name},
          ${slug},
          ${body.description ?? null},
          ${Number(body.price)},
          ${body.image_url ?? null},
          ${body.is_available ?? true},
          ${body.is_featured ?? false},
          ${body.sort_order ?? 0}
        )

        RETURNING *
      `;

      return NextResponse.json(
        rows[0],
        {
          status: 201,
        }
      );

    } catch (error) {
      console.error(
        "Products POST error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to create product",
        },
        {
          status: 500,
        }
      );
    }
  },
  {
    allowedMethods: ["POST"],

    rateLimit: {
      maxRequests: 30,
      windowMs: 60_000,
    },
  }
);