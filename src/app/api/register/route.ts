// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { keccak256 } from "viem";

const PRIVATE_KEY = process.env.POG_SPONSOR_KEY;

if (!PRIVATE_KEY) {
  throw new Error("Missing POG_SPONSOR_KEY environment variable");
}
if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66) {
  throw new Error(
    "POG_SPONSOR_KEY must be a valid 66-character private key starting with 0x"
  );
}

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ABI = [
  "function register(bytes32 contentHash, bytes32 perceptualHash, string tool, string model, bytes32 modelHash, bytes extraData, bytes signature) external",
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

    const tx = await contract.register(
      contentHash,
      "0x0000000000000000000000000000000000000000000000000000000000000000", // perceptualHash (placeholder)
      "Demo",                                                                 // tool
      "Flux",                                                                 // model
      "0x0000000000000000000000000000000000000000000000000000000000000000", // modelHash
      "0x",                                                                   // extraData
      "0x"                                                                    // signature
    );

    const receipt = await tx.wait();

    return NextResponse.json({
      success
