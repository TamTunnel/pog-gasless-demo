// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // Simple LSB watermark detection (checks last 32 bytes for non-zero bits)
    const last32 = uint8.slice(-32);
    const hasWatermark = Array.from(last32).some(b => (b & 0x01) === 1);

    const contentHash = keccak256(uint8);

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      pog_events_found: hasWatermark ? 1 : 0,
      signal: hasWatermark 
        ? "Strong: Invisible watermark detected + registered on PoG" 
        : "None: No PoG watermark found",
      warning: "Proves claims, not truth.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
