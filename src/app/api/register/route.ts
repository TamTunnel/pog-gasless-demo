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

let contract: ethers.Contract | null = null;

async function getContract() {
    if (contract) return contract;
    if (!process.env.ANKR_API_KEY) {
        throw new Error("Missing ANKR_API_KEY environment variable.");
    }
    const pk = process.env.POG_PRIVATE_KEY;
    if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
        throw new Error("Invalid or missing POG_PRIVATE_KEY");
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(pk, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    return contract;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const parentHash = formData.get("parentHash") as string | null;

        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

        const buffer = await file.arrayBuffer();
        const originalUint8 = new Uint8Array(buffer);

        // Step 1: Apply the watermark directly to the image data.
        // The watermark is applied by setting the least significant bit (LSB) of the last 32 bytes to 1.
        const watermarkedUint8 = new Uint8Array(originalUint8);
        const watermarkStartIdx = Math.max(0, watermarkedUint8.length - 32);
        for (let i = watermarkStartIdx; i < watermarkedUint8.length; i++) {
            watermarkedUint8[i] = watermarkedUint8[i] | 1; // Set LSB to 1
        }

        // Step 2: Calculate the canonical contentHash from the *watermarked* data.
        // The canonical hash is calculated after zeroing out the LSB, making it verifiable 
        // whether the image has a watermark or not.
        const normalizedUint8 = new Uint8Array(watermarkedUint8);
        const normalizeStartIdx = Math.max(0, normalizedUint8.length - 32);
        for (let i = normalizeStartIdx; i < normalizedUint8.length; i++) {
            normalizedUint8[i] = normalizedUint8[i] & 0xfe; // Set LSB to 0
        }
        const contentHash = keccak256(normalizedUint8);

        // Step 3: Register the correct hash on the blockchain.
        const c = await getContract();
        const tx = await c.register(
            contentHash,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "pog.lzzo.net",
            "pog.lzzo.net gasless demo",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            parentHash && /^0x[a-fA-F0-9]{64}$/.test(parentHash)
                ? parentHash
                : "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        const receipt = await tx.wait();

        // Step 4: Return the watermarked image and the transaction details.
        const headers = new Headers();
        headers.set("Content-Type", file.type);
        headers.set("x-tx-hash", receipt.hash);
        headers.set("x-content-hash", contentHash);
        headers.set("x-explorer-url", `https://basescan.org/tx/${receipt.hash}`);

        return new NextResponse(watermarkedUint8.buffer, { status: 200, headers });

    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: error.message || "Transaction failed" },
            { status: 500 }
        );
    }
}
