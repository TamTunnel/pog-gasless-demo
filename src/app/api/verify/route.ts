
// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""; 
const BASE_CHAIN_ID = "8453";

const GENERATED_EVENT_TOPIC = "0x77dbddf20f52d30e2fa0c718fc7ad9e1f0a6adf4bc44aed22c6638f7626b5f58";

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
      // Correct V2 API endpoint with chainid as per Etherscan documentation.
      const res = await fetch(
        `https://api.etherscan.io/api?module=logs&action=getLogs` +
        `&address=${CONTRACT_ADDRESS}` +
        `&topic0=${GENERATED_EVENT_TOPIC}` +
        `&topic1=0x${contentHash.slice(2)}` + 
        `&fromBlock=0&toBlock=latest` +
        `&page=1&offset=1` +
        `&apikey=${ETHERSCAN_API_KEY}` +
        `&chainid=${BASE_CHAIN_ID}`
      );

      const data = await res.json();
      
      if (data.status === "1" && data.result.length > 0) {
        const log = data.result[0];
        const timestamp = BigInt(log.topics[2]).toString(); 

        onChainProof = {
          creator: `0x${log.topics[3].slice(26)}`,
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
