// src/app/api/calculate-hash/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // This is the exact same hashing logic used in the `register` endpoint.
    // It calculates the canonical contentHash by zeroing out the LSB of the last 32 bytes.
    const normalizedUint8 = new Uint8Array(uint8);
    const startIdx = Math.max(0, normalizedUint8.length - 32);
    for (let i = startIdx; i < normalizedUint8.length; i++) {
        normalizedUint8[i] = normalizedUint8[i] & 0xfe; // Set LSB to 0
    }
    const contentHash = keccak256(normalizedUint8);

    return NextResponse.json({ contentHash });

  } catch (error: any) {
    console.error("Calculate Hash API Error:", error);
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
  }
}
