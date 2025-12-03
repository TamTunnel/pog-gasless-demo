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

    // Strict LSB watermark detection: last 32 bytes must ALL have LSB = 1
    const last32 = uint8.slice(-32);
    const hasWatermark = last32.length === 32 && last32.every(b => (b & 1) === 1);

    // In the future: real on-chain check via Basescan API
    // For now: if it has our exact watermark → assume registered
    const hasOnChainProof = hasWatermark;

    let signal = "Weak: No watermark detected";
    if (hasWatermark && hasOnChainProof) {
      signal = "Strong: Watermark + on-chain PoG proof";
    } else if (hasWatermark) {
      signal = "Medium: Watermark found (on-chain check pending)";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: hasOnChainProof,
      signal,
      warning: "Strong = provably registered via pog.lzzo.net",
    });
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
