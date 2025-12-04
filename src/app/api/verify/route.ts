// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256, createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";

export const dynamic = "force-dynamic";

// Proof of Generation Registry ABI for event parsing
const pogAbi = [
  parseAbiItem(
    "event Registered(bytes32 indexed contentHash, bytes32 indexed paramsHash, string tool, string model, address indexed creator)"
  ),
];

// Public client to connect to Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const POG_REGISTRY_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // 1. Check for the invisible watermark
    const last32 = uint8.slice(-32);
    const hasWatermark =
      last32.length === 32 && Array.from(last32).every((b) => (b & 1) === 1);

    // 2. Calculate the contentHash to find the on-chain proof
    // We must re-zero the watermark bits to get the original hash
    const originalUint8 = new Uint8Array(uint8);
    if (hasWatermark) {
      const startIdx = Math.max(0, originalUint8.length - 32);
      for (let i = startIdx; i < originalUint8.length; i++) {
        originalUint8[i] = originalUint8[i] & 0xfe; // Set LSB to 0
      }
    }
    const contentHash = keccak256(originalUint8);

    // 3. Find the on-chain registration event
    let onChainProof: any = null;
    try {
      const logs = await publicClient.getLogs({
        address: POG_REGISTRY_ADDRESS,
        event: pogAbi[0],
        args: {
          contentHash: contentHash as `0x${string}`,
        },
        fromBlock: "earliest",
        toBlock: "latest",
      });

      if (logs && logs.length > 0) {
        const log = logs[0]; // Use the first event found
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        onChainProof = {
          tool: log.args.tool,
          model: log.args.model,
          creator: log.args.creator,
          txHash: log.transactionHash,
          timestamp: new Date(Number(block.timestamp) * 1000).toUTCString(),
          blockNumber: log.blockNumber.toString(),
        };
      }
    } catch (e) {
      console.error("On-chain verification error:", e);
      // Will proceed without on-chain proof if this fails
    }

    let signal = "Weak: No watermark detected";
    if (hasWatermark && onChainProof) {
      signal = "Strong: Watermark + on-chain PoG proof";
    } else if (hasWatermark) {
      signal = "Medium: Watermark found, but no on-chain proof found";
    }

    return NextResponse.json({
      contentHash,
      watermark_detected: hasWatermark,
      onchain_proof_found: !!onChainProof,
      signal,
      onChainProof, // Send details to the frontend
    });
  } catch (error: any) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
  }
}