export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

export const GET = withSecurity(
  async () => {
    try {
   const drivers = await sql`
  SELECT id, name, email
  FROM neon_auth."user"
  WHERE role = 'driver'
  ORDER BY name ASC
`;
      return NextResponse.json({ drivers });
    } catch (err) {
      console.error("Drivers GET error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  {
    allowedMethods: ["GET"],
    rateLimit: { maxRequests: 60, windowMs: 60_000 },
  }
);