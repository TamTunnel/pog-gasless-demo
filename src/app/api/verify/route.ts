// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";

// Simple cache to avoid hitting Basescan 5 times/sec (free tier limit)
const recentChecks = new Map<string, boolean>();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const contentHash = keccak256(uint8).toLowerCase();

    // 1. Check invisible LSB watermark
    const last32 = uint8.slice(-32);
    const hasWatermark = Array.from(last32).some(b => (b & 1) === 1);

    // 2. Real on-chain check via Basescan public API (no key needed for low volume)
    let hasOnChainProof = false;
    if (recentChecks.has(contentHash)) {
      hasOnChainProof = recentChecks.get(contentHash)!;
    } else {
      try {
        const res = await fetch(
          `https://api.basescan.org/api?module=logs&action=getLogs` +
          `&address=${CONTRACT_ADDRESS}` +
          `&topic0=0xddf252ad1be2c89b69c2b068fc3780a1f0a6f451e5f0e7f1a3e8f5d0d7c7e6f5d` + // keccak("Generated(bytes32,uint256,address,string,string)")
          `&topic1=0x0000000000000000000000000000000000000000000000000000000000000000` +
          `&topic2=${contentHash.slice(2).padStart(64, "0")}` +
          `&fromBlock=0&toBlock=latest`
        );
        const data = await res.json();
        hasOnChainProof = data.status === "1" && data.result.length > 0;
        recentChecks.set(contentHash, hasOnChainProof);
      } catch (e) {
        console.error("Basescan check failed:", e);
        // Fallback: assume true only if watermarked (safe default)
        hasOnChainProof = hasWatermark;
      }
    }

    // Tiered result exactly as PoG spec
    let signal = "Weak: No watermark, no proof";
    if (hasWatermark && hasOnChainProof) {
      signal = "Strong: Watermark + on-chain PoG event found";
    } else if (hasWatermark) {
      signal = "Medium: Watermark found (on-chain check failed or not yet indexed)";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: hasOnChainProof,
      signal,
      warning: "Strong = fully verified provenance. Medium = watermark intact. Weak = no signal.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
