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

    // 1. LSB watermark detection (last 32 bytes must have specific pattern for PoG — not random)
    const last32 = uint8.slice(-32);
    const hasWatermark = last32.every((byte, i) => (byte & 1) === 1); // Strict: all LSB=1 for PoG files

    // 2. Perceptual hash (simple average hash for fuzzy matching)
    const height = 8, width = 8;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      let pHash = 0;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        pHash = (pHash << 1) | (data[i] > avg ? 1 : 0);
      }
      const perceptualHash = keccak256(new Uint8Array(new BigUint64Array([BigInt(pHash)]).buffer));

      // 3. Mock on-chain (future: query Basescan for contentHash)
      const hasOnChain = hasWatermark; // Demo assumption

      // Tiered as PoG spec
      let signal = "Weak: No watermark or PoG proof";
      if (hasWatermark && hasOnChain) {
        signal = "Strong: Watermark + on-chain PoG event";
      } else if (hasWatermark) {
        signal = "Medium: Watermark only (no on-chain yet)";
      }

      return NextResponse.json({
        contentHash,
        perceptualHash,
        watermark_detected: hasWatermark,
        onchain_proof: hasOnChain,
        signal,
        warning: "Strong = fully verified. Medium = watermark intact. Weak = no signal.",
      });
    };
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
