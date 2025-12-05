// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, keccak256, type Address } from "viem";
import { base } from "viem/chains";
import { detectWatermark } from '@/lib/pog';

export const dynamic = "force-dynamic";

const POG_ABI = [
  parseAbiItem(
    "event Registered(bytes32 indexed contentHash, bytes32 indexed paramsHash, string tool, string model, address indexed creator)"
  ),
];

const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`),
});

const POG_REGISTRY_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3" as Address;

async function verifyOnChain(contentHash: `0x${string}`) {
    try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 7500n ? latestBlock - 7500n : 0n;

        const logs = await publicClient.getLogs({
            address: POG_REGISTRY_ADDRESS,
            event: POG_ABI[0],
            args: { contentHash },
            fromBlock,
            toBlock: "latest",
        });

        if (logs && logs.length > 0) {
            const log = logs[0];
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
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
    return null;
}

export async function POST(request: Request) {
    if (!process.env.ANKR_API_KEY) {
        return NextResponse.json({ error: "Missing ANKR_API_KEY environment variable." }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }
        
        const imageBuffer = Buffer.from(await file.arrayBuffer());

        const contentHash = keccak256(imageBuffer as any);
        const watermarkDetected = await detectWatermark(imageBuffer);
        const onChainProof = await verifyOnChain(contentHash);
        
        let signal = "Weak: No watermark detected";
        if (watermarkDetected && onChainProof) {
            signal = "Strong: Watermark + on-chain PoG proof";
        } else if (watermarkDetected) {
            signal = "Medium: Watermark found, but no on-chain proof found";
        } else if (onChainProof) {
            signal = "Medium: On-chain proof found, but no watermark detected in image";
        }
        
        return NextResponse.json({
            contentHash,
            watermark_detected: watermarkDetected,
            onchain_proof_found: !!onChainProof,
            signal,
            onChainProof,
        });

    } catch (error: any) {
        console.error("Verify API Error:", error);
        if (error instanceof SyntaxError) {
             return NextResponse.json({ error: "Invalid request format. Expected an image upload." }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
    }
}