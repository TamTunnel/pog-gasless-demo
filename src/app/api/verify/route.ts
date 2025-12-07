
// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""; 
const BASE_CHAIN_ID = "8453";

// CORRECTED: This is the correct event signature from the contract logs.
const GENERATED_EVENT_TOPIC = "0x8592fb395f043e97105a02b39c3fcd30912a5c8ac804a249364587cd65920cc7";

export async function POST(request: Request) {
  if (!ETHERSCAN_API_KEY) {
      return NextResponse.json({ error: "Server configuration error: ETHERSCAN_API_KEY is not set." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const contentHash = keccak256(uint8);

    const last32 = uint8.slice(-32);
    let hasWatermark = false;
    if (last32.length === 32) {
      hasWatermark = Array.from(last32).every(b => (b & 1) === 1);
    }

    let onChainProof = null;
    let onChainError = null;
    try {
      const res = await fetch(
        `https://api.etherscan.io/v2/api?module=logs&action=getLogs` +
        `&address=${CONTRACT_ADDRESS}` +
        `&topic0=${GENERATED_EVENT_TOPIC}` +
        `&topic1=${contentHash}` + 
        `&page=1&offset=1` +
        `&apikey=${ETHERSCAN_API_KEY}` +
        `&chainid=${BASE_CHAIN_ID}`
      );

      const data = await res.json();
      
      if (data.status === "1" && data.result.length > 0) {
        const log = data.result[0];
        // NOTE: The topic indices change based on the new event signature.
        // Assuming timestamp is now topic 2 and registrar is topic 3 based on common patterns.
        // This may need adjustment if the event structure is different.
        const timestamp = BigInt(log.topics[2]).toString(); 
        const registrar = `0x${log.topics[3].slice(26)}`;

        onChainProof = {
          creator: registrar,
          txHash: log.transactionHash,
          blockNumber: parseInt(log.blockNumber, 16).toString(),
          timestamp: new Date(parseInt(timestamp) * 1000).toUTCString(),
        };
      } else if (data.status === "0") {
        onChainError = data.message;
        if (data.result && typeof data.result === 'string') {
           onChainError = data.result; 
        }
      }
    } catch (e: any) {
      console.error("On-chain check failed:", e);
      onChainError = e.message;
    }

    let signal = "Weak: No watermark or on-chain proof found.";
    if (hasWatermark && onChainProof) {
      signal = "Strong: Watermark detected and on-chain proof found.";
    } else if (onChainProof) {
      signal = "Medium: On-chain proof found, but no watermark was detected.";
    } else if (hasWatermark) {
      signal = "Medium: Watermark detected, but no on-chain proof was found.";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: !!onChainProof,
      signal,
      onChainProof,
      debug_onChainError: onChainError,
    });
  } catch (error: any) {
    console.error("Verify API Main Error:", error);
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
  }
}
