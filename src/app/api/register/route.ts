// src/app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ABI = [
  "function register(bytes32 contentHash, bytes32 perceptualHash, string tool, string model, bytes32 modelHash, bytes extraData, bytes signature) external",
];

export async function POST(request: NextRequest) {
  try {
    const PRIVATE_KEY_RAW = process.env.POG_SPONSOR_KEY;

    if (!PRIVATE_KEY_RAW) {
      return NextResponse.json(
        { error: "Server misconfigured: missing POG_SPONSOR_KEY" },
        { status: 500 }
      );
    }

    const PRIVATE_KEY = PRIVATE_KEY_RAW.trim().replace(/^"|"$/g, "");
    if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66) {
      return NextResponse.json(
        { error: "Server misconfigured: invalid POG_SPONSOR_KEY format" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const contentHash = keccak256(uint8Array);

    const tx = await contract.register(
      contentHash,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "Demo",
      "Flux",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x",
      "0x"
    );

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      explorer: `https://basescan.org/tx/${receipt.hash}`,
    });
  } catch (error: any) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Transaction failed" },
      { status: 500 }
    );
  }
}
