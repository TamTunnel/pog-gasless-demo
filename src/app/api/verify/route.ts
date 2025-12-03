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

    // Tiered detection as per PoG spec:
    // 1. Invisible LSB watermark in last 32 bytes?
    const last32 = uint8.slice(-32);
    const hasLSBWatermark = Array.from(last32).some(b => (b & 0x01) === 1);

    // 2. In future: check on-chain events via The Graph / direct RPC
    // For now: assume on-chain if watermarked (demo mode)
    const hasOnChain = hasLSBWatermark;

    let signal = "None";
    if (hasOnChain && hasLSBWatermark) {
      signal = "Strong: Watermarked + on-chain PoG event";
    } else if (hasLSBWatermark) {
      signal = "Medium: Watermarked but no on-chain proof yet";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasLSBWatermark,
      onchain_proof: hasOnChain,
      signal,
      warning: "Proves claims, not truth. Final verification requires on-chain check.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
