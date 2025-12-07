
// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""; 

// This is the keccak256 hash of the "Generated" event signature.
// keccak256("Generated(bytes32,uint256,address,string,string,bytes32)")
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

    // This is a simplified, local check for a watermark pattern.
    // In a real-world scenario, this would be a more robust algorithm.
    const last32 = uint8.slice(-32);
    let hasWatermark = false;
    if (last32.length === 32) {
      // Placeholder: Check if the last 32 bytes have a specific pattern (e.g., all odd).
      hasWatermark = Array.from(last32).every(b => (b & 1) === 1);
    }

    // This is the real on-chain check using the Etherscan API for Base.
    let onChainProof = null;
    let onChainError = null;
    try {
      const res = await fetch(
        `https://api.base.etherscan.io/api?module=logs&action=getLogs` +
        `&address=${CONTRACT_ADDRESS}` +
        `&topic0=${GENERATED_EVENT_TOPIC}` +
        `&topic1=0x${contentHash.slice(2)}` + 
        `&fromBlock=0&toBlock=latest` +
        `&page=1&offset=1` + // We only need the first event
        `&apikey=${ETHERSCAN_API_KEY}`
      );

      const data = await res.json();
      
      if (data.status === "1" && data.result.length > 0) {
        const log = data.result[0];
        // The data is ABI-encoded in the 'data' field. We need to decode it.
        // Format: [timestamp (uint256), tool (string), pipeline (string), paramsHash (bytes32)]
        const decodedData = `0x${log.data.slice(2)}`; // Ensure it starts with 0x
        
        // Manual decoding based on ABI rules for dynamic types (string)
        // This part is complex. We will extract what we can reliably.
        const timestamp = BigInt(log.topics[2]).toString(); // Assuming timestamp is the second indexed topic if so defined

        onChainProof = {
          creator: `0x${log.topics[3].slice(26)}`, // Registrar is the 3rd indexed topic
          txHash: log.transactionHash,
          blockNumber: parseInt(log.blockNumber, 16).toString(),
          timestamp: new Date(parseInt(timestamp) * 1000).toUTCString(),
          // tool, pipeline, and paramsHash require more complex decoding
        };
      } else if (data.status === "0") {
        // Etherscan API can return status "0" with a message if there are no logs
        // or if there's an API key issue.
        onChainError = data.message;
        if (data.result && typeof data.result === 'string') {
           onChainError = data.result; // e.g., "Invalid API Key"
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
