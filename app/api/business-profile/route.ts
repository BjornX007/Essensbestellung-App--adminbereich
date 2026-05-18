// app/api/business-profile/route.ts
import { sql } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";

type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
};

type ProfilePayload = {
  id?: string;
  name: string;
  tagline?: string;
  description?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  hero_image_url?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
};

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function rowToProfile(row: Record<string, unknown>) {
  const social = (row.social_links ?? {}) as SocialLinks;
  const { social_links, ...rest } = row;
  void social_links;
  return {
    ...rest,
    instagram: social.instagram ?? "",
    facebook:  social.facebook  ?? "",
    tiktok:    social.tiktok    ?? "",
    website:   social.website   ?? "",
  };
}

export const GET = withSecurity(async () => {
  const rows = await sql`
    SELECT * FROM business_profile ORDER BY updated_at DESC LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(rowToProfile(rows[0]));
});

export const POST = withSecurity(async (req) => {
  let body: ProfilePayload;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.name?.trim()) return err("name is required");

  const social: SocialLinks = {
    instagram: body.instagram,
    facebook:  body.facebook,
    tiktok:    body.tiktok,
    website:   body.website,
  };

  const rows = await sql`
    INSERT INTO business_profile
      (name, tagline, description, address, city, postal_code,
       phone, email, logo_url, hero_image_url, social_links)
    VALUES
      (${body.name}, ${body.tagline ?? null}, ${body.description ?? null},
       ${body.address ?? null}, ${body.city ?? null}, ${body.postal_code ?? null},
       ${body.phone ?? null}, ${body.email ?? null},
       ${body.logo_url ?? null}, ${body.hero_image_url ?? null},
       ${JSON.stringify(social)}::jsonb)
    RETURNING *
  `;
  return NextResponse.json(rowToProfile(rows[0]), { status: 201 });
});

export const PUT = withSecurity(async (req) => {
  let body: ProfilePayload;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.id)           return err("id is required");
  if (!body.name?.trim()) return err("name is required");

  const social: SocialLinks = {
    instagram: body.instagram,
    facebook:  body.facebook,
    tiktok:    body.tiktok,
    website:   body.website,
  };

  const rows = await sql`
    UPDATE business_profile SET
      name           = ${body.name},
      tagline        = ${body.tagline        ?? null},
      description    = ${body.description    ?? null},
      address        = ${body.address        ?? null},
      city           = ${body.city           ?? null},
      postal_code    = ${body.postal_code    ?? null},
      phone          = ${body.phone          ?? null},
      email          = ${body.email          ?? null},
      logo_url       = ${body.logo_url       ?? null},
      hero_image_url = ${body.hero_image_url ?? null},
      social_links   = ${JSON.stringify(social)}::jsonb,
      updated_at     = now()
    WHERE id = ${body.id}
    RETURNING *
  `;
  if (rows.length === 0) return err("Profile not found", 404);
  return NextResponse.json(rowToProfile(rows[0]));
});

export const PATCH = withSecurity(async (req) => {
  let body: Partial<ProfilePayload>;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }
  if (!body.id) return err("id is required");

  const existing = await sql`SELECT * FROM business_profile WHERE id = ${body.id}`;
  if (existing.length === 0) return err("Profile not found", 404);

  const cur = existing[0];
  const curSocial = (cur.social_links ?? {}) as SocialLinks;

  const social: SocialLinks = {
    instagram: body.instagram !== undefined ? body.instagram : curSocial.instagram,
    facebook:  body.facebook  !== undefined ? body.facebook  : curSocial.facebook,
    tiktok:    body.tiktok    !== undefined ? body.tiktok    : curSocial.tiktok,
    website:   body.website   !== undefined ? body.website   : curSocial.website,
  };

  const rows = await sql`
    UPDATE business_profile SET
      name           = ${body.name           ?? cur.name},
      tagline        = ${body.tagline        ?? cur.tagline},
      description    = ${body.description    ?? cur.description},
      address        = ${body.address        ?? cur.address},
      city           = ${body.city           ?? cur.city},
      postal_code    = ${body.postal_code    ?? cur.postal_code},
      phone          = ${body.phone          ?? cur.phone},
      email          = ${body.email          ?? cur.email},
      logo_url       = ${body.logo_url       ?? cur.logo_url},
      hero_image_url = ${body.hero_image_url ?? cur.hero_image_url},
      social_links   = ${JSON.stringify(social)}::jsonb,
      updated_at     = now()
    WHERE id = ${body.id}
    RETURNING *
  `;
  return NextResponse.json(rowToProfile(rows[0]));
});

export const DELETE = withSecurity(async (req) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return err("id query param is required");
  await sql`DELETE FROM business_profile WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
});