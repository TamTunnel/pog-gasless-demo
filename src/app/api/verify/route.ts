// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { ethers, EventLog } from "ethers";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const RPC_URL = `https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`;

const ABI = [
    "event Generated(bytes32 indexed contentHash, bytes32 indexed perceptualHash, string indexed tool, string pipeline, bytes32 paramsHash, bytes32 parentHash, bytes32 attesterSig, uint256 timestamp, address registrar, uint16 version)"
];

// RADICAL WORKAROUND: Removing the custom interface entirely to bypass build error.

async function getContract() {
    if (!process.env.ANKR_API_KEY) {
        throw new Error("Missing ANKR_API_KEY environment variable.");
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL, 'base');
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function POST(request: Request) {
    console.log("--- RUNNING LATEST VERIFY API ROUTE (v.No-Interface) ---"); 
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
        const contentHash = keccak256(uint8);

        const last32 = uint8.slice(-32);
        const hasWatermark =
            last32.length === 32 && Array.from(last32).every((b) => (b & 1) === 1);

        let onChainProof: any = null;
        try {
            const c = await getContract();
            const filter = c.filters.Generated(contentHash);
            const logs = await c.queryFilter(filter, 14364353);

            if (logs.length > 0) {
                // Cast the log to 'any' and access properties directly.
                const log = logs[logs.length - 1] as any;
                const args = log.args;
                onChainProof = {
                    txHash: log.transactionHash,
                    contentHash: args.contentHash,
                    tool: args.tool,
                    model: args.pipeline,
                    // The runtime value is a bigint; we convert it to a Number for the Date constructor.
                    timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
                };
            }
        } catch (e) {
            console.error("On-chain lookup failed:", e);
        }

        let signal = "No AI watermark detected";
        if (hasWatermark && onChainProof) {
            signal = "Strong: Watermarked AI + on-chain registration";
        } else if (hasWatermark && !onChainProof) {
            signal = "Medium: Watermarked AI, but no on-chain registration found";
        } else if (!hasWatermark && onChainProof) {
            signal = "Weak: On-chain registration found, but image is not watermarked";
        } else { // !hasWatermark && !onChainProof
             signal = "None: No on-chain registration found and no watermark detected.";
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
