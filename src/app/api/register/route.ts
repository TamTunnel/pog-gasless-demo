// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const RPC_URL = `https://rpc.ankr.com/base/${process.env.ANKR_API_KEY}`;

const ABI = [
    "function register(bytes32 contentHash, bytes32 perceptualHash, string tool, string pipeline, bytes32 paramsHash, bytes32 parentHash, bytes32 attesterSig) external",
];

async function getContract() {
    if (!process.env.ANKR_API_KEY) {
        throw new Error("Missing ANKR_API_KEY environment variable.");
    }
    const pk = process.env.POG_PRIVATE_KEY;
    if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
        throw new Error("Invalid or missing POG_PRIVATE_KEY");
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL, 'base');
    const wallet = new ethers.Wallet(pk, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
}

export async function POST(request: Request) {
    console.log("--- RUNNING LATEST API ROUTE (v.LogQuery-Fix) ---");
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const parentHash = formData.get("parentHash") as string | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const originalUint8 = new Uint8Array(buffer);

        const watermarkedUint8 = new Uint8Array(originalUint8);
        const watermarkStartIdx = Math.max(0, watermarkedUint8.length - 32);
        for (let i = watermarkStartIdx; i < watermarkedUint8.length; i++) {
            watermarkedUint8[i] = watermarkedUint8[i] | 1;
        }

        const contentHash = keccak256(watermarkedUint8);

        const c = await getContract();
        const tx = await c.register(
            contentHash,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "pog.lzzo.net",
            "pog.lzzo.net gasless demo",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            parentHash && /^0x[a-fA-F0-9]{64}$/.test(parentHash) ? parentHash : "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
        const receipt = await tx.wait();

        // CORRECT: Use Buffer for robust Base64 encoding.
        const watermarkedImageBase64 = Buffer.from(watermarkedUint8).toString('base64');

        return NextResponse.json({
            success: true,
            txHash: receipt.hash,
            contentHash: contentHash,
            explorerUrl: `https://basescan.org/tx/${receipt.hash}`,
            watermarkedImageBase64: watermarkedImageBase64,
            imageFormat: file.type,
        });

    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Transaction failed" },
            { status: 500 }
        );
    }
}
