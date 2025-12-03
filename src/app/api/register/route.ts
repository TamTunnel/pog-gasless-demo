import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

const PRIVATE_KEY = process.env.POG_SPONSOR_KEY;

if (!PRIVATE_KEY) {
  throw new Error("Missing POG_SPONSOR_KEY environment variable");
}
if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66) {
  throw new Error("POG_SPONSOR_KEY must be a valid 66-character private key starting with 0x");
}

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ABI = [
  "function register(bytes32 contentHash, bytes32 perceptualHash, string calldata tool, string calldata pipeline, bytes32 paramsHash, bytes32 parentHash, bytes32 attesterSig) external",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const contentHash = keccak256(uint8Array);

    // Real args (non-zero, valid strings)
    const perceptualHash = keccak256(uint8Array.slice(0, 32)); // Dummy perceptual
    const tool = "DemoTool";
    const pipeline = "DemoTool:Flux";
    const paramsHash = keccak256(ethers.toUtf8Bytes("demo prompt + seed 42 + cfg 7.0 + steps 20"));
    const parentHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const attesterSig = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    const tx = await contract.register(
      contentHash,
      perceptualHash,
      tool,
      pipeline,
      paramsHash,
      parentHash,
      attesterSig
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
      { error: error.message || "Transaction failed" },
      { status: 500 }
    );
  }
}
