import { NextResponse } from "next/server";
import { Wallet, ethers } from "ethers";
import { keccak256 } from "viem";

// Your sponsor wallet (keep this secret!)
const PRIVATE_KEY = process.env.POG_SPONSOR_KEY!;
const RPC_URL = "https://mainnet.base.org";
const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3"; // Your PoG contract

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

const ABI = [
  "function register(bytes32 contentHash, bytes32 perceptualHash, string memory tool, string memory model, bytes32 modelHash, bytes memory extraData, bytes memory signature) external"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const contentHash = keccak256(uint8);

    // Dummy values for demo (you can expand later)
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
