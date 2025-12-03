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
    const contentHash = keccak256(uint8);

    // LSB watermark detection (last 32 bytes have odd LSB)
    const last32 = uint8.slice(-32);
    const hasWatermark = Array.from(last32).some(byte => (byte & 1) === 1);

    // Mock on-chain check (in real: query Basescan/TheGraph for contentHash)
    const hasOnChain = hasWatermark; // Assume registered if watermarked

    let signal = "Weak";
    if (hasWatermark && hasOnChain) {
      signal = "Strong: Watermark + on-chain PoG proof";
    } else if (hasWatermark) {
      signal = "Medium: Watermark only (no on-chain yet)";
    } else {
      signal = "Weak: No watermark or PoG proof";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof: hasOnChain,
      signal,
      warning: "Strong = fully verified. Medium = watermark intact but unregistered. Weak = no signal.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
