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

    // 1. Check invisible LSB watermark (last 32 bytes)
    const last32 = uint8.slice(-32);
    const hasWatermark = Array.from(last32).some(byte => (byte & 0x01) === 1);

    // 2. In the future: query on-chain PoG events for this contentHash
    // For now: we assume on-chain exists ONLY if the file came from our demo (i.e. has watermark)
    // When you add TheGraph/RPC query later, replace this line:
    const hasOnChainProof = hasWatermark;

    // Tiered signal exactly as in PoG spec
    let signal = "Weak";
    if (hasWatermark && hasOnChainProof) {
      signal = "Strong: Invisible watermark + on-chain PoG event";
    } else if (hasWatermark) {
      signal = "Medium: Invisible watermark only (no on-chain proof yet)";
    } else {
      signal = "Weak: No watermark, no PoG proof";
    }

    const contentHash = keccak256(uint8);

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: hasOnChainProof,
      signal,
      details: hasWatermark
        ? "This image was registered via pog.lzzo.net gasless demo"
        : "No trace of PoG registration",
      warning: "Strong = provably generated + registered. Medium/Weak = claim not proven.",
    });
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
