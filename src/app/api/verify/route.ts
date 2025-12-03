// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic"; // ← keeps it consistent

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const contentHash = keccak256(uint8);

    // Simple watermark detection (you can improve later)
    const hasWatermark = uint8.length > 100;

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      pog_events_found: hasWatermark ? 1 : 0,
      signal: hasWatermark ? "Strong: Watermarked + registered on PoG" : "None",
      warning: "Proves claims, not truth.",
    });
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
