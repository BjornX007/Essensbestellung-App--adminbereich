import cloudinary from "@/app/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

const FOLDER_MAP: Record<string, string> = {
  product:  "restaurant/products",
  category: "restaurant/categories",
  logo:     "restaurant/branding",
  hero:     "restaurant/branding",
};

const SIZE_MAP: Record<string, string> = {
  product:  "w_800,h_800,c_limit,q_auto:good,f_auto",
  category: "w_1200,h_600,c_limit,q_auto:good,f_auto",
  logo:     "w_400,h_400,c_limit,q_auto:best,f_auto",
  hero:     "w_1920,h_1080,c_limit,q_auto:good,f_auto",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

function applyTransform(url: string, transform: string): string {
  return url.replace("/upload/", `/upload/${transform}/`);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "product";

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only JPG, PNG, WEBP or GIF allowed" }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "Max file size is 5MB" }, { status: 400 });
    if (!FOLDER_MAP[type])
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET; // unsigned preset name

    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset!);
    body.append("folder", FOLDER_MAP[type]);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body }
    );

    if (!res.ok) {
      const e = await res.json();
      console.error("[upload]", e);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const data = await res.json();
    const url = applyTransform(data.secure_url, SIZE_MAP[type]);

    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload]", e);
    const testResult = await cloudinary.uploader.upload(
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  { folder: "test" }
);
console.log("TEST UPLOAD:", testResult.secure_url);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}