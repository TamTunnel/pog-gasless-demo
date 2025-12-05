// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
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
    const { contentHash, watermarkDetected: hasWatermark } = await request.json();

    if (!contentHash) {
      return NextResponse.json({ error: "contentHash is required" }, { status: 400 });
    }

    let onChainProof: any = null;
    try {
      // Calculate a recent block range to search (approx. last hour)
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 2500n ? latestBlock - 2500n : 0n; // Search last ~1.4 hours

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
