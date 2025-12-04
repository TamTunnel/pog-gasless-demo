// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const RPC_URL = `https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`;
const ABI = [
    "function registrations(bytes32) view returns (address, uint256, string, string, bytes32, bytes32, bytes32)"
];

let contract: ethers.Contract | null = null;
async function getContract() {
    if (contract) return contract;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    return contract;
}

export async function POST(request: Request) {
    console.log("--- RUNNING LATEST VERIFY API ROUTE ---"); // Diagnostic message
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

        // 1. Check for the watermark on the uploaded file
        const last32 = uint8.slice(-32);
        const hasWatermark =
            last32.length === 32 && Array.from(last32).every((b) => (b & 1) === 1);

        // 2. Calculate the canonical content hash by removing the watermark
        const normalizedUint8 = new Uint8Array(uint8);
        const normalizeStartIdx = Math.max(0, normalizedUint8.length - 32);
        for (let i = normalizeStartIdx; i < normalizedUint8.length; i++) {
            normalizedUint8[i] = normalizedUint8[i] & 0xfe; // remove LSB watermark
        }
        const contentHash = keccak256(normalizedUint8);

        // 3. Check for the content hash on-chain
        let onChainProof: any = null;
        try {
            const c = await getContract();
            const registration = await c.registrations(contentHash);
            const blockNumber = registration[1];
            if (blockNumber > 0) {
                onChainProof = {
                    txHash: "N/A (direct contract state lookup)",
                    contentHash,
                    tool: registration[2],
                    model: registration[3],
                    timestamp: new Date(Number(blockNumber) * 1000).toISOString(),
                };
            }
        } catch (e) {
            console.error("On-chain lookup failed:", e);
            // This is not a fatal error, just means no proof was found.
        }

        let signal = "No AI watermark detected";
        if (hasWatermark && onChainProof) {
            signal = "Strong: Watermarked AI + on-chain registration";
        } else if (hasWatermark && !onChainProof) {
            signal = "Medium: Watermarked AI, but no on-chain registration found";
        } else if (!hasWatermark && onChainProof) {
            signal = "Medium: On-chain registration found, but image is not watermarked";
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
