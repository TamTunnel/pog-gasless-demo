// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

export const dynamic = "force-dynamic";

let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const RPC_URL = "https://mainnet.base.org";

const ABI = [
  "function register(bytes32 contentHash, bytes32 perceptualHash, string calldata tool, string calldata pipeline, bytes32 paramsHash, bytes32 parentHash, bytes32 attesterSig) external",
];

async function getContract() {
  if (contract) return contract;

  const PRIVATE_KEY = process.env.POG_PRIVATE_KEY;
  if (!PRIVATE_KEY) throw new Error("POG_PRIVATE_KEY missing");
  if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66)
    throw new Error("Invalid POG_PRIVATE_KEY");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  return contract;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const contentHash = keccak256(uint8);

    const c = await getContract();

    const tx = await c.register(
      contentHash,
      "0x0000000000000000000000000000000000000000000000000000000000000000", // perceptualHash
      "PoG Demo", // tool (non-empty)
      "PoG Demo:Flux", // pipeline (non-empty, longer)
      keccak256(ethers.toUtf8Bytes("prompt seed 42 cfg 7 steps 20")), // paramsHash
      "0x0000000000000000000000000000000000000000000000000000000000000000", // parentHash
      "0x0000000000000000000000000000000000000000000000000000000000000000" // attesterSig (32 zeros)
    );

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      explorer: `https://basescan.org/tx/${receipt.hash}`,
    });
  } catch (error: any) {
    console.error("Register failed:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
