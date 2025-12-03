import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const contentHash = keccak256(uint8Array);

    // Mock verify (detect watermark by checking embedded hash)
    // In real: extract LSB from last 32 bytes and compare to contentHash
    const hasWatermark = true; // Dummy for demo
    const signal = hasWatermark ? "Strong: Watermarked AI + PoG" : "None";

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      pog_events_found: 1,
      signal,
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      warning: "Proves claims, not truth. Bad actors can evade.",
    });
  } catch (error: any) {
    console.error("Verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
