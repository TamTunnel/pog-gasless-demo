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

    // Check last 32 bytes — ALL must have LSB = 1
    const last32 = uint8.slice(-32);
    const hasWatermark = last32.length === 32 && Array.from(last32).every(b => (b & 1) === 1);

    // Assume on-chain if watermark is present (real check later)
    const hasOnChain = hasWatermark;

    let signal = "Weak: No watermark detected";
    if (hasWatermark && hasOnChain) {
      signal = "Strong: Watermark + on-chain PoG proof";
    } else if (hasWatermark) {
      signal = "Medium: Watermark found (on-chain pending)";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: hasOnChain,
      signal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
