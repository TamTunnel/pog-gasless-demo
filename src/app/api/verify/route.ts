// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { keccak256, createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

export const dynamic = "force-dynamic";

const pogAbi = [
  parseAbiItem(
    "event Registered(bytes32 indexed contentHash, bytes32 indexed paramsHash, string tool, string model, address indexed creator)"
  ),
];

// Using Ankr RPC with an API Key
const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`),
});

const POG_REGISTRY_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";

export async function POST(request: Request) {
  if (!process.env.ANKR_API_KEY) {
    return NextResponse.json({ error: "Missing ANKR_API_KEY environment variable." }, { status: 500 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const last32 = uint8.slice(-32);
    const hasWatermark =
      last32.length === 32 && Array.from(last32).every((b) => (b & 1) === 1);

    const normalizedUint8 = new Uint8Array(uint8);
    const startIdx = Math.max(0, normalizedUint8.length - 32);
    for (let i = startIdx; i < normalizedUint8.length; i++) {
      normalizedUint8[i] = normalizedUint8[i] & 0xfe; // Set LSB to 0
    }
    const contentHash = keccak256(normalizedUint8);

    let onChainProof: any = null;
    try {
      const latestBlock = await publicClient.getBlockNumber();
      // Reduced block range to 10000 to avoid RPC errors
      const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;

      const logs = await publicClient.getLogs({
        address: POG_REGISTRY_ADDRESS,
        event: pogAbi[0],
        args: {
          contentHash: contentHash as `0x${string}`,
        },
        fromBlock: fromBlock,
        toBlock: "latest",
      });

      if (logs && logs.length > 0) {
        const log = logs[0];
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
      onChainProof,
    });
  } catch (error: any) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
  }
}
